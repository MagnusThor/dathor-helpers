import { executeGpuComputeMultiPass } from "./executeGpuComputeMultiPass";
import { executeGpuComputeSinglePass } from "./executeGpuComputeSinglePass";
import { CancellationToken, OperationCanceledError, Task } from "./Task";


export enum GpuExecutionType {
    SinglePass = 'SINGLE_PASS',
    MultiPass = 'MULTI_PASS' 
}


/**
 * Type descriptor for each field in the GPU argument struct.
 */
export type GpuArgType =
  | "int"
  | "uint"
  | "float"
  | "vec2"
  | "vec3"
  | "vec4"
  | "mat2"
  | "mat3"
  | "mat4";


 /**
 * Creates a GPU-aligned Float32Array suitable for WebGPU uniform buffers.
 * Automatically handles std140-like alignment (vec3 padded to vec4, etc.)
 *
 * Example:
 * const args = createGpuArgumentBuffer({
 *   direction: { type: "uint", value: 1 },
 *   color: { type: "vec3", value: [1, 0.5, 0.2] },
 * });
 *
 * device.queue.writeBuffer(argumentBuffer, 0, args);
 */
export function createGpuArgumentBuffer(
  schema: Record<string, { type: GpuArgType; value: number | number[] }>
): Float32Array {
  const alignments: Record<GpuArgType, number> = {
    int: 4,
    uint: 4,
    float: 4,
    vec2: 8,
    vec3: 16,
    vec4: 16,
    mat2: 16 * 2,
    mat3: 16 * 3,
    mat4: 16 * 4,
  };

  // const sizes: Record<GpuArgType, number> = {
  //   int: 4,
  //   uint: 4,
  //   float: 4,
  //   vec2: 8,
  //   vec3: 12,
  //   vec4: 16,
  //   mat2: 16 * 2,
  //   mat3: 16 * 3,
  //   mat4: 16 * 4,
  // };

  let offset = 0;
  const tempBuffer: number[] = [];

  for (const [key, { type, value }] of Object.entries(schema)) {
    const align = alignments[type];
    const baseFloats = Array.isArray(value) ? value : [value];

    // Align offset to nearest multiple of alignment (in floats)
    const alignFloats = align / 4;
    while (offset % alignFloats !== 0) {
      tempBuffer.push(0);
      offset++;
    }

    // Add value
    tempBuffer.push(...baseFloats);
    offset += baseFloats.length;

    // Pad vec3 to 4 floats
    if (type === "vec3") {
      while (offset % 4 !== 0) {
        tempBuffer.push(0);
        offset++;
      }
    }

    // Pad matrices to 16-byte boundaries
    if (type.startsWith("mat")) {
      while (offset % 4 !== 0) {
        tempBuffer.push(0);
        offset++;
      }
    }
  }

  // Align total size to 16-byte multiple
  const totalBytes = Math.ceil((tempBuffer.length * 4) / 16) * 16;
  const view = new Float32Array(totalBytes / 4);
  view.set(tempBuffer);

  return view;
}


export interface GpuComputeInput {
  data: ArrayBufferView;
  usage?: GPUBufferUsageFlags;
  readOnly?: boolean; // NEW: indicate if buffer is read-only in the shader
}

export interface GpuComputeRequest<TResult> {
    shaderEntry: string;
    shaderCode: string;   
    inputs?: GpuComputeInput[];
    argumentData?: ArrayBufferView | null;
    computeParams?: ArrayBufferView | null;
    outputSizeInBytes?: number;
    arrayLength: number; 
    deserializer: (buffer: ArrayBuffer) => TResult;

    dimensions?: [number, number, number]; 
    token?: CancellationToken; 
}


export abstract class GpuTask<TResult> {
    /**
     * Prepares the low-level GpuComputeRequest object for the execution engine.
     */
    public abstract getRunConfig(): GpuComputeRequest<TResult>;

    /**
     * Determines which execution function (SinglePass, MultiPass, etc.) the runner should use.
     */
    public abstract readonly executionType: GpuExecutionType;

    /**
     * Executes the task using the GpuTaskRunner (Compute class).
     * @param token Optional cancellation token.
     */
    public run(token?: CancellationToken): Task<TResult> {
        // Now passes the token to the runner
        return GpuTaskRunner.execute(this, token);
    }
}

export class GpuTaskRunner {
    /**
     * Executes a high-level GpuTask by dispatching it to the appropriate WebGPU low-level logic
     * based on the task's executionType.
     * @param task The GpuTask instance to execute.
     * @param token Optional cancellation token.
     * @returns A Task that completes with the result of the GPU computation.
     */
    public static execute<TResult>(
        task: GpuTask<TResult>,
        token?: CancellationToken
    ): Task<TResult> {
        const config = task.getRunConfig();
        config.token = token; 
        
        const computeFunc = 
            task.executionType === GpuExecutionType.SinglePass
                ? executeGpuComputeSinglePass
                : executeGpuComputeMultiPass; // Routed execution

        // Uses the Task wrapper to execute the determined async function
        return new Task<TResult>((resolve, reject) =>
            computeFunc(config).then(resolve).catch(reject)
        );
    }
}


