// Orthographic triangle rasterizer for offline GLB references; depth testing avoids SVG
// painter-order artifacts on overlapping pads, frames and cylinders. No image editing.
function drawTriangle({ points: [a, b, c], color }, size, { pixels, depth }) {
  const denominator = (b.y - c.y) * (a.x - c.x) + (c.x - b.x) * (a.y - c.y);
  if (Math.abs(denominator) < 1e-9) return;
  const minX = Math.max(0, Math.floor(Math.min(a.x, b.x, c.x)));
  const maxX = Math.min(size - 1, Math.ceil(Math.max(a.x, b.x, c.x)));
  const minY = Math.max(0, Math.floor(Math.min(a.y, b.y, c.y)));
  const maxY = Math.min(size - 1, Math.ceil(Math.max(a.y, b.y, c.y)));
  for (let y = minY; y <= maxY; y += 1) {
    for (let x = minX; x <= maxX; x += 1) {
      const wa = ((b.y - c.y) * (x + 0.5 - c.x) + (c.x - b.x) * (y + 0.5 - c.y)) / denominator;
      const wb = ((c.y - a.y) * (x + 0.5 - c.x) + (a.x - c.x) * (y + 0.5 - c.y)) / denominator;
      const wc = 1 - wa - wb;
      if (wa < 0 || wb < 0 || wc < 0) continue;
      const z = wa * a.z + wb * b.z + wc * c.z;
      const index = y * size + x;
      if (z >= depth[index]) continue;
      depth[index] = z;
      pixels.set(color, index * 3);
    }
  }
}

export function rasterizeReference(triangles, size, background = [238, 234, 229]) {
  const pixels = Buffer.alloc(size * size * 3);
  const depth = new Float64Array(size * size).fill(Infinity);
  for (let offset = 0; offset < pixels.length; offset += 3) pixels.set(background, offset);
  for (const triangle of triangles) drawTriangle(triangle, size, { pixels, depth });
  return pixels;
}
