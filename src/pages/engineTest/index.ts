import "index.css";

import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

import * as Engine from "engine";

function getRandomThree(): [number, number, number] {
  return [Math.log(Math.random()), Math.log(Math.random()), Math.log(Math.random())];
}

function getRandomRotation() {
  return new THREE.Euler(...getRandomThree());
}

function getRandomPosition() {
  return new THREE.Vector3(...getRandomThree());
}

document.addEventListener("DOMContentLoaded", () => {
  console.log("content loaded");

  const context = Engine.initThree("threeCanvas");

  const { camera, renderer, scene } = context;

  camera.position.set(0, 0, 0.001);

  const controls = new OrbitControls(camera, renderer.domElement);

  controls.update();

  context.callbacks.push(() => controls.update());

  const cubeRandomParent = new THREE.Group();
  const cubeFilterParent = new THREE.Group();
  const cubeRandom = new THREE.Mesh(new THREE.BoxGeometry(2, 2, 2), new THREE.MeshLambertMaterial({ color: "#ff0000" }));
  cubeRandom.add(new THREE.AxesHelper(3));

  const cubeFiltered = new THREE.Mesh(new THREE.BoxGeometry(2, 2, 2), new THREE.MeshLambertMaterial({ color: "#ff0000" }));
  cubeFiltered.add(new THREE.AxesHelper(3));

  cubeFilterParent.add(cubeFiltered);

  cubeRandomParent.add(cubeRandom);

  cubeRandomParent.position.set(5, 0, 0);
  cubeFilterParent.position.set(-5, 0, 0);

  scene.add(cubeFilterParent);
  scene.add(cubeRandomParent);


  const light = new THREE.DirectionalLight();
  light.rotateX(1);
  light.rotateY(1);
  light.rotateZ(1);

  light.updateMatrix();
  light.updateMatrixWorld();

  const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
  scene.add(ambientLight);

  scene.add(light);

  cubeRandom.position.set(5, 0, 0);
  cubeFiltered.position.set(-5, 0, 0);

  const filterRotation = new Engine.EulerNotchFilter();

  const filterPosition = new Engine.Vector3NotchFilter();

  context.callbacks.push(() => {

    const randomRotation = getRandomRotation();
    const randomPosition = getRandomPosition();

    filterRotation.accumulateEuler(randomRotation);
    filterPosition.accumulate(randomPosition);


    cubeRandom.rotation.copy(randomRotation);
    cubeFiltered.rotation.copy(filterRotation.averageEuler());

    cubeRandom.position.copy(randomPosition);
    cubeFiltered.position.copy(filterPosition.average());
  })

  const axisHelper = new THREE.AxesHelper(2);

  // context.scene.add(cubeRandom);
  // context.scene.add(cubeFiltered);

  context.scene.add(axisHelper);
});