/**
 * Infers arrayLength and outputSizeInBytes for GPU inputs.
 * Supports TypedArrays and DataView.
 */
export function inferGpuBufferInfo(input: ArrayBufferView | ArrayBufferView[]): { arrayLength: number; outputSizeInBytes: number; } {
  const firstInput = Array.isArray(input) ? input[0] : input;

  let arrayLength: number;
  let outputSizeInBytes: number;

  if (firstInput instanceof Float32Array ||
    firstInput instanceof Uint32Array ||
    firstInput instanceof Int32Array ||
    firstInput instanceof Uint16Array ||
    firstInput instanceof Int16Array ||
    firstInput instanceof Uint8Array ||
    firstInput instanceof Int8Array) {
    arrayLength = firstInput.length;
    outputSizeInBytes = firstInput.byteLength;
  } else if (firstInput instanceof DataView) {
    arrayLength = firstInput.byteLength; // fallback
    outputSizeInBytes = firstInput.byteLength;
  } else {
    throw new Error("Unsupported ArrayBufferView type for GPU input.");
  }

  return { arrayLength, outputSizeInBytes };
}
