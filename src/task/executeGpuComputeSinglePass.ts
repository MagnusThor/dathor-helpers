import { GpuComputeRequest, safeDestroy } from "./GpuCompute";
import { getWorkgroupSize } from "./getWorkgroupSize";


export async function executeGpuComputeSinglePass<TResult>(
  config: GpuComputeRequest<TResult>
): Promise<TResult> {
  const checkCancellation = () => config.token?.throwIfCancellationRequested();
  checkCancellation();

  if (!navigator.gpu) throw new Error("WebGPU is not supported.");
  const adapter = await navigator.gpu.requestAdapter();
  if (!adapter) throw new Error("Failed to get GPU adapter.");
  checkCancellation();
  const device = await adapter.requestDevice();

  const buffers: GPUBuffer[] = [];
  const toArrayBuffer = (view: ArrayBufferView) =>
    view.buffer.slice(view.byteOffset, view.byteOffset + view.byteLength);

  try {
    const wg = getWorkgroupSize(device.limits);
    const arrayLength = config.arrayLength;

    const shaderCode = config.shaderCode.replace(
      "###workgroup_size",
      `@workgroup_size(${wg.x}, ${wg.y}, ${wg.z})`
    );
    const shaderModule = device.createShaderModule({ code: shaderCode });

    const bindGroupLayoutEntries: GPUBindGroupLayoutEntry[] = [];
    const bindGroupEntries: GPUBindGroupEntry[] = [];
    let bindingIndex = 0;

    // --- Input Buffers ---
    const allInputs = config.inputs ?? [];
    for (const input of allInputs) {
      const arrayBuffer = toArrayBuffer(input.data);
      const buf = device.createBuffer({
        size: arrayBuffer.byteLength,
        usage: input.usage ?? (GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST),
        mappedAtCreation: true,
      });
      new Uint8Array(buf.getMappedRange()).set(new Uint8Array(arrayBuffer));
      buf.unmap();
      buffers.push(buf);

      bindGroupLayoutEntries.push({
        binding: bindingIndex,
        visibility: GPUShaderStage.COMPUTE,
        buffer: { type: "read-only-storage" },
      });
      bindGroupEntries.push({ binding: bindingIndex, resource: { buffer: buf } });
      bindingIndex++;
    }

    // --- Output Buffer ---
    const outputBuffer = device.createBuffer({
      size: config.outputSizeInBytes!,
      usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC,
    });
    buffers.push(outputBuffer);

    bindGroupLayoutEntries.push({
      binding: bindingIndex,
      visibility: GPUShaderStage.COMPUTE,
      buffer: { type: "storage" },
    });
    bindGroupEntries.push({ binding: bindingIndex, resource: { buffer: outputBuffer } });
    bindingIndex++;

    // --- Uniform Buffer ---
    if (config.computeParams) {
      const arrayBuffer = toArrayBuffer(config.computeParams);
      const buf = device.createBuffer({
        size: Math.max(16, arrayBuffer.byteLength),
        usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
      });
      device.queue.writeBuffer(buf, 0, arrayBuffer);
      buffers.push(buf);

      bindGroupLayoutEntries.push({
        binding: bindingIndex,
        visibility: GPUShaderStage.COMPUTE,
        buffer: { type: "uniform" },
      });
      bindGroupEntries.push({ binding: bindingIndex, resource: { buffer: buf } });
      bindingIndex++;
    }

    // --- Argument Buffer ---
    if (config.argumentData) {
      const arrayBuffer = toArrayBuffer(config.argumentData);
      const buf = device.createBuffer({
        size: Math.max(16, arrayBuffer.byteLength),
        usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
      });
      device.queue.writeBuffer(buf, 0, arrayBuffer);
      buffers.push(buf);

      bindGroupLayoutEntries.push({
        binding: bindingIndex,
        visibility: GPUShaderStage.COMPUTE,
        buffer: { type: "uniform" },
      });
      bindGroupEntries.push({ binding: bindingIndex, resource: { buffer: buf } });
      bindingIndex++;
    }

    checkCancellation();

    // --- Pipeline & Bind Group ---
    const bindGroupLayout = device.createBindGroupLayout({ entries: bindGroupLayoutEntries });
    const pipeline = device.createComputePipeline({
      layout: device.createPipelineLayout({ bindGroupLayouts: [bindGroupLayout] }),
      compute: { module: shaderModule, entryPoint: config.shaderEntry },
    });
    const bindGroup = device.createBindGroup({
      layout: bindGroupLayout,
      entries: bindGroupEntries,
    });

    // --- Dispatch ---
    const totalWGX = Math.ceil(arrayLength / wg.x);
    const dispatchX = Math.min(totalWGX, device.limits.maxComputeWorkgroupsPerDimension);

    const encoder = device.createCommandEncoder();
    const pass = encoder.beginComputePass({ label: config.shaderEntry });
    pass.setPipeline(pipeline);
    pass.setBindGroup(0, bindGroup);
    pass.dispatchWorkgroups(dispatchX, 1, 1);
    pass.end();

    // --- Readback Buffer ---
    const readbackBuffer = device.createBuffer({
      size: config.outputSizeInBytes!,
      usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ,
    });
    buffers.push(readbackBuffer);

    encoder.copyBufferToBuffer(outputBuffer, 0, readbackBuffer, 0, config.outputSizeInBytes!);
    device.queue.submit([encoder.finish()]);

    // Destroy input & output buffers early; we only need readback
    buffers.filter(b => b !== readbackBuffer).forEach(safeDestroy);

    await readbackBuffer.mapAsync(GPUMapMode.READ);
    checkCancellation();

    const data = readbackBuffer.getMappedRange().slice(0);
    readbackBuffer.unmap();

    safeDestroy(readbackBuffer);
    return config.deserializer(data);
  } finally {
    // Safety: destroy any remaining buffers
    buffers.forEach(safeDestroy);
  }
}
