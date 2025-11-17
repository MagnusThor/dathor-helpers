import { GpuComputeRequest, safeDestroy } from "./GpuCompute";
import { getWorkgroupSize } from "./getWorkgroupSize";


export async function executeGpuComputeMultiPass<TResult>(
  config: GpuComputeRequest<TResult>
): Promise<TResult> {
  const checkCancellation = () => config.token?.throwIfCancellationRequested();
  checkCancellation();

  if (!navigator.gpu) throw new Error("WebGPU is not supported.");
  const adapter = await navigator.gpu.requestAdapter();
  if (!adapter) throw new Error("Failed to get GPU adapter.");
  checkCancellation();
  const device = await adapter.requestDevice();

  const toArrayBuffer = (view: ArrayBufferView) =>
    view.buffer.slice(view.byteOffset, view.byteOffset + view.byteLength);

  if (!config.inputs || config.inputs.length === 0) {
    throw new Error("MultiPass compute requires at least one input buffer.");
  }

  const createdBuffers: GPUBuffer[] = [];
  const storageBuffers: GPUBuffer[] = [];
  let paramsUniformBuffer: GPUBuffer | null = null;
  let argumentBuffer: GPUBuffer | null = null;
  let readbackBuffer: GPUBuffer | null = null;

  try {
    const wg = getWorkgroupSize(device.limits);
    const N = config.arrayLength;

    const log2N = Math.log2(N);
    if (!Number.isInteger(log2N)) {
      throw new Error("Array length must be a power of two for multi-pass algorithms.");
    }

    // --- Create input buffers ---
    for (let i = 0; i < config.inputs.length; i++) {
      const input = config.inputs[i];
      const isReadOnly = (input as any).readOnly ?? false;
      const data = toArrayBuffer(input.data);

      const usage =
        (isReadOnly ? GPUBufferUsage.STORAGE : GPUBufferUsage.STORAGE) |
        GPUBufferUsage.COPY_SRC |
        (i === 0 && !isReadOnly ? GPUBufferUsage.COPY_DST : 0);

      const buffer = device.createBuffer({
        size: data.byteLength,
        usage,
        mappedAtCreation: true,
      });

      new Uint8Array(buffer.getMappedRange()).set(new Uint8Array(data));
      buffer.unmap();

      createdBuffers.push(buffer);
      storageBuffers.push(buffer);
    }

    // --- Uniform buffer ---
    const paramsData = config.computeParams
      ? config.computeParams instanceof Uint32Array
        ? config.computeParams.slice()
        : new Uint32Array(config.computeParams as any)
      : new Uint32Array([0, 0, N, 0]);

    paramsUniformBuffer = device.createBuffer({
      size: Math.max(16, paramsData.byteLength),
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });
    device.queue.writeBuffer(paramsUniformBuffer, 0, paramsData);
    createdBuffers.push(paramsUniformBuffer);

    // --- Optional argument buffer ---
    if (config.argumentData) {
      const argData = toArrayBuffer(config.argumentData);

      argumentBuffer = device.createBuffer({
        size: Math.max(16, argData.byteLength),
        usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
      });
      device.queue.writeBuffer(argumentBuffer, 0, argData);
      createdBuffers.push(argumentBuffer);
    }

    // --- Shader module & pipeline ---
    const shaderCode = config.shaderCode.replace(
      "###workgroup_size",
      `@workgroup_size(${wg.x}, ${wg.y}, ${wg.z})`
    );
    const shaderModule = device.createShaderModule({ code: shaderCode });

    // --- Bind group layout ---
    const entries: GPUBindGroupLayoutEntry[] = [];
    for (let i = 0; i < storageBuffers.length; i++) {
      const isReadOnly = (config.inputs[i] as any).readOnly ?? false;
      entries.push({
        binding: i,
        visibility: GPUShaderStage.COMPUTE,
        buffer: { type: isReadOnly ? "read-only-storage" : "storage" },
      });
    }

    const paramBinding = storageBuffers.length;
    entries.push({
      binding: paramBinding,
      visibility: GPUShaderStage.COMPUTE,
      buffer: { type: "uniform" },
    });
    if (argumentBuffer) {
      entries.push({
        binding: paramBinding + 1,
        visibility: GPUShaderStage.COMPUTE,
        buffer: { type: "uniform" },
      });
    }

    const bindGroupLayout = device.createBindGroupLayout({ entries });
    const pipeline = device.createComputePipeline({
      layout: device.createPipelineLayout({ bindGroupLayouts: [bindGroupLayout] }),
      compute: { module: shaderModule, entryPoint: config.shaderEntry },
    });

    // --- Bind group ---
    const bgEntries: GPUBindGroupEntry[] = [];
    for (let i = 0; i < storageBuffers.length; i++) {
      bgEntries.push({ binding: i, resource: { buffer: storageBuffers[i] } });
    }
    bgEntries.push({ binding: paramBinding, resource: { buffer: paramsUniformBuffer } });
    if (argumentBuffer) {
      bgEntries.push({ binding: paramBinding + 1, resource: { buffer: argumentBuffer } });
    }
    const bindGroup = device.createBindGroup({ layout: bindGroupLayout, entries: bgEntries });

    // --- Dispatch passes ---
    const uniformArray = new Uint32Array(4);
    const totalWGX = Math.ceil(N / wg.x);
    const dispatchX = Math.min(totalWGX, device.limits.maxComputeWorkgroupsPerDimension);

    for (let stage = 1; stage <= log2N; stage++) {
      for (let step = stage; step >= 1; step--) {
        checkCancellation();
        uniformArray[0] = stage;
        uniformArray[1] = step - 1;
        uniformArray[2] = N;
        uniformArray[3] = 0;
        device.queue.writeBuffer(paramsUniformBuffer, 0, uniformArray);

        const encoder = device.createCommandEncoder();
        const pass = encoder.beginComputePass();
        pass.setPipeline(pipeline);
        pass.setBindGroup(0, bindGroup);
        pass.dispatchWorkgroups(dispatchX, 1, 1);
        pass.end();
        device.queue.submit([encoder.finish()]);
      }
    }

    // --- Readback ---
    const outputBuffer = storageBuffers[0];
    readbackBuffer = device.createBuffer({
      size: config.outputSizeInBytes ?? N * 4,
      usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ,
    });

    const copyEncoder = device.createCommandEncoder();
    copyEncoder.copyBufferToBuffer(
      outputBuffer,
      0,
      readbackBuffer,
      0,
      config.outputSizeInBytes ?? N * 4
    );
    device.queue.submit([copyEncoder.finish()]);

    // Destroy storage buffers now; we only need readback
    storageBuffers.forEach(safeDestroy);
    storageBuffers.length = 0;

    // --- Map and return result ---
    await readbackBuffer.mapAsync(GPUMapMode.READ);
    checkCancellation();
    const mapped = readbackBuffer.getMappedRange();
    const resultBuffer = mapped.slice(0);
    readbackBuffer.unmap();

    safeDestroy(paramsUniformBuffer);
    safeDestroy(argumentBuffer);
    safeDestroy(readbackBuffer);

    return config.deserializer(resultBuffer);
  } finally {
    // Cleanup any remaining buffers
    createdBuffers.forEach(safeDestroy);
  }
}
