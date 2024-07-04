import { initThree } from "../../engine";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

import { generateMesh } from "./proceduralMesh";

import "./index.css";
import { PerlinNoise2d } from "./perlinNoise";

document.addEventListener("DOMContentLoaded", () => {
  const context = initThree("mainCanvas");

  const { camera, renderer, scene } = context;

  camera.position.set(50, 20, 30);
  // camera.rotateX(-1);

  const controls = new OrbitControls(camera, renderer.domElement);

  controls.update();

  context.callbacks.push(() => controls.update());

  const cubeRandomParent = new THREE.Group();
  const cubeFilterParent = new THREE.Group();
  const cubeRandom = new THREE.Mesh(
    new THREE.BoxGeometry(2, 2, 2),
    new THREE.MeshLambertMaterial({ color: "#ff0000" })
  );
  cubeRandom.add(new THREE.AxesHelper(3));

  const cubeFiltered = new THREE.Mesh(
    new THREE.BoxGeometry(2, 2, 2),
    new THREE.MeshLambertMaterial({ color: "#ff0000" })
  );
  cubeFiltered.add(new THREE.AxesHelper(3));

  cubeFilterParent.add(cubeFiltered);

  cubeRandomParent.add(cubeRandom);

  cubeRandomParent.position.set(5, 0, 0);
  cubeFilterParent.position.set(-5, 0, 0);

  // scene.add(cubeFilterParent);
  // scene.add(cubeRandomParent);

  const light = new THREE.DirectionalLight(0xffffff, 1);
  const lightTarget = new THREE.Object3D();
  lightTarget.position.set(100, -50, 70);
  scene.add(lightTarget);
  light.target = lightTarget;
  scene.add(light);
  // light.rotateX(1);
  // light.rotateY(1);
  // light.rotateZ(1);

  // light.updateMatrix();
  // light.updateMatrixWorld();

  const ambientLight = new THREE.AmbientLight(0xffffff, 0.3);
  scene.add(ambientLight);

  const proceduralMesh = generateMesh(100, 100, 1);

  const meshPositionAttribute = proceduralMesh.geometry.getAttribute(
    "position"
  ) as THREE.BufferAttribute;

  const meshColorAttribute = proceduralMesh.geometry.getAttribute(
    "color"
  ) as THREE.BufferAttribute;

  scene.add(proceduralMesh.mesh);

  const perlinNoise = new PerlinNoise2d(20, 20);

  perlinNoise.randomize();

  proceduralMesh.mesh.position.set(-50, -2, -50);

  context.callbacks.push(() => {
    perlinNoise.rotate(0.01);

    for (let y = 0; y < 101; y++) {
      for (let x = 0; x < 101; x++) {
        const valueAtPoint = perlinNoise.valueAtPoint(x / 101, y / 101);

        const distanceFromCenterX = Math.cos(
          (((x - 101 / 2) / (101 / 2)) * Math.PI) / 2
        );
        const distanceFromCenterY = Math.cos(
          (((y - 101 / 2) / (101 / 2)) * Math.PI) / 2
        );

        let multiplyer = distanceFromCenterX * distanceFromCenterY;
        multiplyer = multiplyer * multiplyer;

        meshPositionAttribute.setY(y * 101 + x, valueAtPoint * 10 * multiplyer);

        const color = Math.sqrt(valueAtPoint + 0.2) * multiplyer;

        meshColorAttribute.setXYZ(
          y * 101 + x,
          color,
          color,
          color
          //  * multiplyer,
          // Math.sqrt(valueAtPoint + 0.2) * multiplyer,
          // Math.sqrt(valueAtPoint + 0.2) * multiplyer
        );
      }
    }

    meshPositionAttribute.needsUpdate = true;
    meshColorAttribute.needsUpdate = true;

    window.addEventListener(
      "resize",
      function () {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();

        renderer.setSize(window.innerWidth, window.innerHeight);
      },
      false
    );
  });
});
