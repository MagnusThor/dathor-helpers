export function toArrayBuffer(view: ArrayBufferView): ArrayBuffer {
  const buf = view.buffer;
  if (buf instanceof ArrayBuffer) {
    return buf.slice(view.byteOffset, view.byteOffset + view.byteLength);
  } else if (buf instanceof SharedArrayBuffer) {
    // Copy the relevant range to a new ArrayBuffer
    return new Uint8Array(buf, view.byteOffset, view.byteLength).slice().buffer;
  } else {
    throw new Error("Unsupported buffer type");
  }
}