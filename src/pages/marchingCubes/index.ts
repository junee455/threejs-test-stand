import { initThree } from "../../engine";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

import "./index.scss";

function getLatticeNumberOfEdges(x: number, y: number, z: number) {
  const edgesPerLine = x - 1;
  const edgesPerSlice = edgesPerLine * y + x * (y - 1);

  const totalEdges = edgesPerSlice * z + x * y * (z - 1);

  return totalEdges;
}

window.addEventListener("DOMContentLoaded", () => {
  const context = initThree("mainCanvas");
  const { camera, renderer, scene } = context;

  const controls = new OrbitControls(camera, renderer.domElement);

  camera.position.set(50, 20, 30);

  controls.update();

  context.callbacks.push(() => controls.update());

  const coords = [
    1, 1, 1, 1, 1, -1, -1, 1, -1, -1, 1, 1,

    1, -1, 1, 1, -1, -1, -1, -1, -1, -1, -1, 1,
  ].map((v) => v * 9);

  const edgeCoords = [
    0, 1, 1, 1, 1, 0, 0, 1, -1, -1, 1, 0,

    0, -1, 1, 1, -1, 0, 0, -1, -1, -1, -1, 0,

    1, 0, 1, 1, 0, -1, -1, 0, -1, -1, 0, 1,
  ].map((v) => v * 9);

  // const edgeIndicators = new Array(12).fill(0).map((_, i) => {
  //   const cube = new THREE.Mesh(
  //     new THREE.BoxGeometry(1, 1, 1),
  //     new THREE.MeshBasicMaterial({ color: "#00F" })
  //   );

  //   cube.position.set(
  //     ...(edgeCoords.slice(i * 3, i * 3 + 3) as [number, number, number])
  //   );

  //   scene.add(cube);

  //   console.log(i);

  //   return cube;
  // });

  const latticeDimensions: [number, number, number] = [3, 3, 3];
  // const latticeDimensions: [number, number, number] = [2,2,2];

  const latticeCellSize = 9;

  const pickedObjects: THREE.Object3D[] = [];

  const latticeCubes = new Array(
    latticeDimensions.reduce((prev, curr) => prev * curr, 1)
  );

  /**
   * lattice edges per square:
   */

  // const edgeIndicators = new Array(
  //   getLatticeNumberOfEdges(...latticeDimensions)
  // );

  const edgeIndicators: THREE.Mesh[] = [];

  console.log(edgeIndicators.length);

  for (let y = 0; y < latticeDimensions[1]; y++) {
    for (let x = 0; x < latticeDimensions[0]; x++) {
      for (let z = 0; z < latticeDimensions[2]; z++) {
        const cube = new THREE.Mesh(
          new THREE.BoxGeometry(1, 1, 1),
          new THREE.MeshBasicMaterial({ color: "#F00" })
        );

        cube.position.set(
          ...([x, y, z].map(
            (v, i) =>
              v * latticeCellSize - (latticeCellSize * latticeDimensions[i]) / 2
          ) as [number, number, number])
        );

        // if (y > 0 && x > 0 && z > 0) {
        //   for (let _x = 0; _x < 2; _x++) {
        //     for (let _y = 0; _y < 2; _y++) {
        //       for (let _z = 0; _z < 2; _z++) {
        //         const edgeIndicator = new THREE.Mesh(
        //           new THREE.BoxGeometry(0.5, 0.5, 0.5),
        //           new THREE.MeshBasicMaterial({ color: "#00F" })
        //         );

        //         edgeIndicator.position.set(
        //           ...([x, y, z].map(
        //             (v, i) =>
        //               v * latticeCellSize -
        //               (latticeCellSize * latticeDimensions[i]) / 2 -
        //               latticeCellSize / 2
        //           ) as [number, number, number])
        //         );

        //         edgeIndicators.push(edgeIndicator);

        //         scene.add(edgeIndicator);
        //       }
        //     }
        //   }
        // }

        latticeCubes[
          x * latticeDimensions[2] +
            y * latticeDimensions[2] * latticeDimensions[0] +
            z
        ] = cube;

        scene.add(cube);
      }
    }
  }

  // const latticeCubes = new Array(latticeDimensions.reduce((prev, curr) => prev * curr, 1)).fill(0).map((_, i) => {
  //   const cube = new THREE.Mesh(
  //     new THREE.BoxGeometry(1, 1, 1),
  //     new THREE.MeshBasicMaterial({ color: "#F00" })
  //   );

  //   cube.position.set(
  //     ...(coords.slice(i * 3, i * 3 + 3) as [number, number, number])
  //   );

  //   scene.add(cube);

  //   console.log(i);

  //   return cube;
  // });

  const raycaster = new THREE.Raycaster();

  let pointer = new THREE.Vector2();

  function onPointerMove(event: PointerEvent) {
    // calculate pointer position in normalized device coordinates
    // (-1 to +1) for both components

    pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
    pointer.y = -(event.clientY / window.innerHeight) * 2 + 1;
  }

  window.addEventListener("pointermove", onPointerMove);

  // context.callbacks.push(() => {
  //   raycaster.setFromCamera(pointer, camera);

  //   const intersects = raycaster.intersectObjects(allTestCubes);

  //   allTestCubes.forEach((cube) => {
  //     // @ts-ignore
  //     (cube as THREE.Mesh).material.color.set("#F00");
  //   });

  //   for (let i = 0; i < intersects.length; i++) {
  //     // @ts-ignore
  //     (intersects[i].object as THREE.Mesh).material.color.set("#0F0");
  //   }
  // });
  // raycaster.camera
});
