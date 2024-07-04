import "index.css";

import * as TWEEN from "@tweenjs/tween.js";

import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

function initThree() {
  const threeCanvas = document.getElementById("threeCanvas");

  if (!threeCanvas) {
    console.log("canvas element not found");
    throw "canvas element not found";
  }

  const renderer = new THREE.WebGLRenderer({
    alpha: true,
    canvas: threeCanvas,
  });

  renderer.setSize(window.innerWidth, window.innerHeight);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(
    60,
    window.innerWidth / window.innerHeight,
    0.1,
    1000,
  );

  const target = new THREE.Object3D();
  scene.add(target);
  target.position.set(0, 0, 0);

  let sunLight = new THREE.DirectionalLight(0xffffff, 0.5);
  sunLight.target = target;
  sunLight.position.set(50, 50, 50);
  scene.add(sunLight);

  sunLight = new THREE.DirectionalLight(0xffffff, 0.5);
  sunLight.target = target;
  sunLight.position.set(-50, 50, 50);
  scene.add(sunLight);

  let occluder: THREE.Group;

  let worldRig = new THREE.Object3D();

  scene.add(worldRig);

  // loadOccluderGLTF((gltf) => {

  // worldRig.add(gltf.scene);

  // })

  const controls = new OrbitControls(camera, renderer.domElement);

  controls.update();
  // scene.add(camera);

  // scene.add(occluder);

  // occluder.material.wireframe = true;

  // scene.add(new THREE.AxesHelper(100));

  // cube.rotateX(0.5);
  // cube.rotateY(0.5);

  // camera.position.z = 20;
  // camera.position.y = 5;

  // camera.setFocalLength(23);

  const fromCube = new THREE.Mesh(
    new THREE.BoxGeometry(0.05, 5, 0.7),
    new THREE.MeshBasicMaterial({ color: 0x00ff00 }),
  );

  const toCube = new THREE.Mesh(
    new THREE.BoxGeometry(0.05, 5, 0.7),
    new THREE.MeshBasicMaterial({ color: 0x0000ff }),
  );

  const interpolateCube = new THREE.Mesh(
    new THREE.BoxGeometry(0.05, 5, 0.7),
    new THREE.MeshBasicMaterial({ color: 0xffff00 }),
  );

  fromCube.position.set(0, -1.5, -5);

  toCube.position.set(0, 1.5, -5);

  interpolateCube.position.set(0, 0, -5);

  scene.add(fromCube);

  scene.add(toCube);

  scene.add(interpolateCube);

  const dummyAxes = new THREE.Object3D();
  dummyAxes.add(new THREE.AxesHelper(5));

  scene.add(dummyAxes);

  fromCube.rotateX(-0.3);
  fromCube.rotateX(0.7);
  fromCube.rotateZ(1);

  toCube.rotateX(1.3);
  toCube.rotateY(-0.3);
  toCube.rotateZ(-0.5);

  interpolateCube.quaternion.set(
    fromCube.quaternion.x,
    fromCube.quaternion.y,
    fromCube.quaternion.z,
    fromCube.quaternion.w,
  );

  toCube.removeFromParent();

  const posMultiplyer = 2;

  camera.position.set(
    30 * posMultiplyer,
    20 * posMultiplyer,
    10 * posMultiplyer,
  );

  camera.rotation.set((-30 / 180) * Math.PI, (45 / 180) * Math.PI, 0, "YXZ");

  const startQubeQuat = new THREE.Quaternion(
    ...interpolateCube.quaternion.toArray(),
  );

  const extrinsicTestCube = new THREE.Mesh(
    new THREE.BoxGeometry(3, 3, 3),
    new THREE.MeshBasicMaterial({ color: 0xff00ff, wireframe: true }),
  );

  const camDirection = new THREE.Mesh(
    new THREE.BoxGeometry(3, 3, 3),
    new THREE.MeshBasicMaterial({ color: 0xffff00 }),
  );

  camDirection.position.set(0, 0, -3);

  extrinsicTestCube.add(camDirection);

  extrinsicTestCube.add(new THREE.AxesHelper(10));

  extrinsicTestCube.position.set(10, 0, -10);

  scene.add(extrinsicTestCube);

  extrinsicTestCube.quaternion.setFromEuler(new THREE.Euler(10, 20, 30));

  const toQuat = new THREE.Quaternion();
  const fromQuat = new THREE.Quaternion();
  toQuat.setFromEuler(new THREE.Euler(50, 100, 100));
  fromQuat.copy(extrinsicTestCube.quaternion);

  const camTween = new TWEEN.Tween({ t: 0 }).to({ t: 1 }, 10000).easing(TWEEN.Easing.Quadratic.InOut).start();

  camTween.onUpdate((quat) => {
    extrinsicTestCube.quaternion.slerpQuaternions(fromQuat, toQuat, quat.t);
  });

  function animate() {
    requestAnimationFrame(animate);

    controls.update();


    camTween.update();

    camera.updateProjectionMatrix();
    camera.updateMatrixWorld();

    renderer.render(scene, camera);
  }
  animate();
}

document.addEventListener("DOMContentLoaded", () => {
  initThree();
})