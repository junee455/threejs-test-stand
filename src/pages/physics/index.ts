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

  const fpsCounterEl = document.getElementById("fpsCounter");

  if (fpsCounterEl) {
    let avgDeltaTime = 0;
    let frames = 0;

    context.callbacks.push((context) => {
      avgDeltaTime += context.deltaTime;
      frames++;
    });

    setInterval(() => {
      fpsCounterEl.innerHTML = `FPS: ${frames / 0.5}`;
      avgDeltaTime = 0;
      frames = 0;
    }, 500);
  }

  const testCube = new THREE.Mesh(
    new THREE.BoxGeometry(3, 3, 3),
    new THREE.MeshBasicMaterial({ color: "#F00" })
  );

  testCube.position.set(0, 10, 0);

  const testCubeState = {
    speed: new THREE.Vector3(0, 0, 0),
    position: testCube.position.clone(),
  };

  const acceleration = -9.8;

  context.callbacks.push((context) => {
    return;
    
    const deltaSpeed = acceleration * context.deltaTime;
    testCubeState.speed.add(new THREE.Vector3(0, deltaSpeed, 0));

    testCubeState.position.add(
      testCubeState.speed.clone().multiplyScalar(context.deltaTime)
    );

    testCube.position.copy(testCubeState.position);
  });

  const testSurface = new THREE.Mesh(
    new THREE.BoxGeometry(100, 0.5, 100),
    new THREE.MeshBasicMaterial({ color: "#2f2f2f" })
  );

  scene.add(testSurface);
  scene.add(testCube);
});
