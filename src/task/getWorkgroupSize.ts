/** Determines a suitable workgroup size based on device limits (1D, 2D, 3D) */




export const getWorkgroupSize = (limits: GPUSupportedLimits, maxX = 64, maxY = 1, maxZ = 1) => {
  /** Finds largest power of 2 <= n */
  const largestPowerOf2UpTo = (n: number): number => 2 ** Math.floor(Math.log2(n));


  const x = Math.min(maxX, largestPowerOf2UpTo(limits.maxComputeWorkgroupSizeX));
  const y = Math.min(maxY, largestPowerOf2UpTo(limits.maxComputeWorkgroupSizeY));
  const z = Math.min(maxZ, largestPowerOf2UpTo(limits.maxComputeWorkgroupSizeZ));
  return { x, y, z, limitsRaw: limits };
};
