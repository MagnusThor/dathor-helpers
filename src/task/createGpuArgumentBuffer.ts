import { GpuArgType } from "./GpuCompute";

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
  schema: Record<string, { type: GpuArgType; value: number | number[]; }>
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
