import { createGpuRequest } from "./createGpuRequest";
import { executeGpuComputeMultiPass } from "./executeGpuComputeMultiPass";
import { executeGpuComputeSinglePass } from "./executeGpuComputeSinglePass";
import { GpuTask } from "./GpuTask";
import { CancellationToken, OperationCanceledError, Task } from "./Task";


// Helper to destroy a buffer safely
export const safeDestroy = (buffer: GPUBuffer | null) => {
    try { buffer?.destroy(); } catch {}
};


export enum GpuExecutionType {
    SinglePass = 'SINGLE_PASS',
    MultiPass = 'MULTI_PASS',
    SinglePassOnWorker = 'SINGLE_PASS_WORKER',
    MultiPassOnWorker = 'MULTI_PASS_WORKER',
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


export type GpuComputeArg = ArrayBuffer | ArrayBufferView | number | string;

export type GpuComputeArguments = Record<string, GpuComputeArg>;




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


