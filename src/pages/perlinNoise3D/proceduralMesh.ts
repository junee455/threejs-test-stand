import * as THREE from "three";

/***
 * - width, height - number of tiles
 * - size - size of a cell in meters
 */
export function generateMesh(width: number, height: number, cellSize: number) {
  // const vertices = new Float32Array([])

  // 3 floats per vertex
  const attributeSize = 3;

  const vertices: number[] = [];

  const indices: number[] = [];

  const normals: number[] = [];

  for (let y = 0; y < height + 1; y++) {
    for (let x = 0; x < width + 1; x++) {
      const index = y * (height + 1) * attributeSize + x * attributeSize;

      vertices[index] = x * cellSize;
      vertices[index + 1] = Math.random();
      vertices[index + 2] = y * cellSize;

      normals[index] = 0;
      normals[index + 1] = 1;
      normals[index + 2] = 0;

      if (y < height && x < width) {
        // fill in indices for square
        const v_index = y * (height + 1) + x;

        indices.push(v_index);
        indices.push(v_index + width + 1);
        indices.push(v_index + 1);

        indices.push(v_index + width + 1);
        indices.push(v_index + width + 2);
        indices.push(v_index + 1);
      }
    }
  }

  const f32_vertices = new Float32Array(vertices);
  const f32_normals = new Float32Array(normals);
  const colors = new Float32Array(vertices.map(() => 0.5));

  const geometry = new THREE.BufferGeometry();

  geometry.setIndex(indices);
  geometry.setAttribute("position", new THREE.BufferAttribute(f32_vertices, 3));
  geometry.setAttribute("normal", new THREE.BufferAttribute(f32_normals, 3));
  geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));

  const material = new THREE.MeshPhongMaterial({
    // flatShading: true,
    shininess: 0.5,
    vertexColors: true,
    // water:
    // color: 0x60a0ff,
    // sand:
    color: 0xC2B280,
    // emissive: 0x000000,
    // specular: 0x000000,
    // side: THREE.FrontSide,
  });

  const mesh = new THREE.Mesh(geometry, material);

  return {
    mesh,
    geometry,
  };
}
