import { GpuComputeRequest } from "./GpuCompute";

/**
 * Generic helper to create a GpuComputeRequest from a simple task config.
 * Used by both single-pass and multi-pass GPU tasks.
 */
export function createGpuRequest<TResult>(
    options: {
        shaderCode: string;
        shaderEntry?: string;
        arrayLength: number;
        inputs: { data: ArrayBufferView; readOnly?: boolean }[];
        outputSizeInBytes: number;
        computeParams?: ArrayBufferView;
        argumentData?: ArrayBufferView;
        deserializer?: (data: ArrayBuffer) => TResult;
    }
): GpuComputeRequest<TResult> {
    return {
        shaderCode: options.shaderCode,
        shaderEntry: options.shaderEntry ?? "main",
        arrayLength: options.arrayLength,
        inputs: options.inputs,
        outputSizeInBytes: options.outputSizeInBytes,
        computeParams: options.computeParams,
        argumentData: options.argumentData,
        deserializer: options.deserializer ?? ((data) => data as unknown as TResult),
    };
}
