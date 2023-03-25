import './index.css';

import * as THREE from 'three';
import { Quaternion } from 'three';
import { loadOccluder } from './examples/static threejs/loadOccluder';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

let shouldContinue = false;

let interpValue = 0;

let testCubeRotation: [number, number, number] = [0, 0, 0]

let testCubePosition: [number, number, number] = [0, 0, 0]

let testCubeQuat: [number, number, number, number] = [0, 0, 0, 1]

const imageWidth = 1900
const imageHeight = 1000

let moveTracker = true;

function lerp(from: number, to: number, t: number) {
  return (1 - t) * from + t * to
}

type Position = [number, number, number]

function interpolatePosition(from: Position, to: Position, t: number) {
  const newPos = [];

  for (let i = 0; i < 3; i++) {
    newPos[i] = lerp(from[i], to[i], t)
  }

  return newPos as Position
}

const extrinsicEulerAnglesToQuatDummyObj = new THREE.Object3D()

function extrinsicEulerAnglesToQuat(angles: [number, number, number]) {
  const blAngles = [angles[1], angles[2], angles[0]]

  extrinsicEulerAnglesToQuatDummyObj.rotation.set(0, 0, 0, 'XYZ');

  blAngles.forEach((v, i) => {
    const newAngles = angles.map((vv, ii) => {
      return ii == i ? vv / 180 * Math.PI : 0
    })
    const newQuat = new THREE.Quaternion()
    newQuat.setFromEuler(new THREE.Euler(...newAngles as [number, number, number], 'YXZ'))
    extrinsicEulerAnglesToQuatDummyObj.applyQuaternion(newQuat)
  })

  return extrinsicEulerAnglesToQuatDummyObj.quaternion.clone();
}

function interpolateQuaternion(from: Quaternion, to: Quaternion, t: number) {

  let newQuatValues = [
    lerp(from.x, to.x, t),
    lerp(from.y, to.y, t),
    lerp(from.z, to.z, t),
    lerp(from.w, to.w, t),
  ]

  const length = newQuatValues.reduce((prev, next) => prev + next * next, 0) ** 0.5

  newQuatValues = newQuatValues.map(v => v / length)

  return new THREE.Quaternion(...(newQuatValues as [number, number, number, number]))
}

export function correctPosition(lastPos: Position, vpsPos: Position, currentPos: Position) {
  return [currentPos[0] + vpsPos[0] - lastPos[0], currentPos[1] + vpsPos[1] - lastPos[1], currentPos[2] + vpsPos[2] - lastPos[2]]
}

function correctAngle(lastAngle: Quaternion, vpsAngle: Quaternion, currentAngle: Quaternion) {
  let quatValues: [number, number, number, number] = [
    currentAngle.x + vpsAngle.x - lastAngle.x,
    currentAngle.y + vpsAngle.y - lastAngle.y,
    currentAngle.z + vpsAngle.z - lastAngle.z,
    currentAngle.w + vpsAngle.w - lastAngle.w,
  ]

  let abs = quatValues.reduce((prev, next) => prev + next * next, 0)
  abs **= 0.5

  quatValues = quatValues.map(v => v / abs) as [number, number, number, number]

  return new THREE.Quaternion(...quatValues)
}


function lerpPos(from: Position, to: Position, t: number) {
  const newPos = []
  for (let i = 0; i < 3; i++) {
    newPos[i] = lerp(from[i], to[i], t)
  }

  return newPos as unknown as Position
}


function initThree() {

  const threeCanvas = document.getElementById("threeCanvas");

  
  if (!threeCanvas) {
    console.log("canvas element not found");
    throw ("canvas element not found");
  }

  const renderer = new THREE.WebGLRenderer({
    alpha: true,
    canvas: threeCanvas
  });

  renderer.setSize(imageWidth, imageHeight);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(
    60,
    imageWidth / imageHeight,
    0.1,
    1000
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

  loadOccluder((gltf) => {
    scene.add(gltf.scene);
    console.log(gltf.scene);
  })

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

  const fromCube = new THREE.Mesh(new THREE.BoxGeometry(0.05, 5, 0.7), new THREE.MeshBasicMaterial({ color: 0x00ff00 }))

  const toCube = new THREE.Mesh(new THREE.BoxGeometry(0.05, 5, 0.7), new THREE.MeshBasicMaterial({ color: 0x0000ff }))

  const interpolateCube = new THREE.Mesh(new THREE.BoxGeometry(0.05, 5, 0.7), new THREE.MeshBasicMaterial({ color: 0xffff00 }))

  fromCube.position.set(0, -1.5, -5)

  toCube.position.set(0, 1.5, -5)

  interpolateCube.position.set(0, 0, -5)

  scene.add(fromCube)

  scene.add(toCube)

  scene.add(interpolateCube)

  const dummyAxes = new THREE.Object3D();
  dummyAxes.add(new THREE.AxesHelper(5))

  scene.add(dummyAxes)

  fromCube.rotateX(-0.3)
  fromCube.rotateX(0.7)
  fromCube.rotateZ(1)

  toCube.rotateX(1.3)
  toCube.rotateY(-0.3)
  toCube.rotateZ(-0.5)

  interpolateCube.quaternion.set(fromCube.quaternion.x, fromCube.quaternion.y, fromCube.quaternion.z, fromCube.quaternion.w)

  toCube.removeFromParent()

  const posMultiplyer = 2
  
  camera.position.set(30 * posMultiplyer, 20 * posMultiplyer, 10 * posMultiplyer)

  camera.rotation.set(-30 / 180 * Math.PI, 45 / 180 * Math.PI, 0, 'YXZ');

  const startQubeQuat = new THREE.Quaternion(...interpolateCube.quaternion.toArray());

  const extrinsicTestCube = new THREE.Mesh(new THREE.BoxGeometry(3, 3, 3), new THREE.MeshBasicMaterial({ color: 0xff00ff, wireframe: true }));

  const camDirection = new THREE.Mesh(new THREE.BoxGeometry(3, 3, 3), new THREE.MeshBasicMaterial({color: 0xffff00}))
  
  camDirection.position.set(0, 0, -3)
  
  extrinsicTestCube.add(camDirection)

  extrinsicTestCube.add(new THREE.AxesHelper(10));

  extrinsicTestCube.position.set(10, 0, -10)

  scene.add(extrinsicTestCube);

  function animate() {
    requestAnimationFrame(animate);

    const newInterpRotation = interpolateQuaternion(fromCube.quaternion, toCube.quaternion, interpValue);

    const interpCamPos: Position = correctPosition(fromCube.position.toArray(), lerpPos(fromCube.position.toArray(), toCube.position.toArray(), interpValue), [0, 0, -5]) as Position
    const interpCamRot = correctAngle(fromCube.quaternion, interpolateQuaternion(fromCube.quaternion, toCube.quaternion, interpValue), startQubeQuat)

    interpolateCube.rotation.setFromQuaternion(interpCamRot);

    interpolateCube.position.set(...interpCamPos);

    extrinsicTestCube.rotation.set(-90 / 180 * Math.PI, -90 / 180 * Math.PI, 0, 'YXZ');

    extrinsicTestCube.position.set(...testCubePosition);


    extrinsicTestCube.quaternion.multiply(extrinsicEulerAnglesToQuat(testCubeRotation));

    // extrinsicTestCube.quaternion.multiply(new THREE.Quaternion(...testCubeQuat));


    controls.update();

    renderer.render(scene, camera);
  }
  animate();
}

function initButtons() {
  // const pauseButton = document.getElementById("pause") as HTMLButtonElement;

  // pauseButton.addEventListener('click', () => {
  //   shouldContinue = !shouldContinue;
  //   pauseButton.innerHTML = shouldContinue ? 'Pause' : 'Start';
  // });

  // const switchView = document.getElementById("switchView") as HTMLButtonElement;

  // switchView.addEventListener('click', () => {
  //   moveTracker = !moveTracker;

  //   switchView.innerHTML = moveTracker ? 'VPS' : 'top down';
  // });

  const getGlobalEulerEl = document.getElementById('getGlobalEuler');

  getGlobalEulerEl.addEventListener('click', () => {
    const dummyObj = new THREE.Object3D();

    dummyObj.rotation.set(-90 / 180 * Math.PI, -90 / 180 * Math.PI, 0, 'YXZ');

    
    dummyObj.quaternion.multiply(extrinsicEulerAnglesToQuat(testCubeRotation));


    const dEuler = new THREE.Euler();

    const dummyQuat = new THREE.Quaternion();
    
    dummyObj.getWorldQuaternion(dummyQuat);

    dEuler.setFromQuaternion(dummyQuat);

    dEuler.reorder('XYZ')

    console.log('local: ', dummyObj.rotation.toArray().slice(0, 3).map((v: number) => v * 180 / Math.PI));

    console.log('global: ', dEuler.toArray().slice(0, 3).map((v: number) => v * 180 / Math.PI));

  })
  
  const interpolationSlider = document.getElementById("interpolationSlider") as HTMLInputElement;
  interpolationSlider.addEventListener('input', (e) => {
    interpValue = Number.parseFloat((e.target as HTMLInputElement).value);
  });

  ['X', 'Y', 'Z'].forEach((axis, i) => {
    const inputEls: HTMLInputElement[] = Array.from(document.getElementsByClassName(`position${axis}`)) as HTMLInputElement[];

    inputEls.forEach((el) => {
      el.addEventListener('input', (e) => {
        testCubePosition[i] = Number.parseFloat((e.target as HTMLInputElement).value);
      })
    })
  });
  
  ['X', 'Y', 'Z'].forEach((axis, i) => {
    const inputEls: HTMLInputElement[] = Array.from(document.getElementsByClassName(`rotation${axis}`)) as HTMLInputElement[];

    const updateValues = (newVal: number) => {
      inputEls.forEach(el => {
        el.setAttribute('value', newVal.toFixed(3));
        el.value = newVal.toFixed(3);
      })
    }

    inputEls.forEach(inputEl => {
      if (inputEl.type === 'range') {
        inputEl.addEventListener('input', (e) => {
          testCubeRotation[i] = Number.parseFloat((e.target as HTMLInputElement).value);
          updateValues((360 + testCubeRotation[i]) % 360)
        })
      }

      inputEl.addEventListener('change', (e) => {
        testCubeRotation[i] = Number.parseFloat((e.target as HTMLInputElement).value);
        updateValues((360 + testCubeRotation[i]) % 360)
      })
    })
  });

  
  const eulerStringEl = document.getElementById('eulerString') as HTMLInputElement;
  eulerStringEl.addEventListener('change', (e) => {
    const quatStr = (e.target as HTMLInputElement).value;
    testCubeRotation = quatStr.split(',').map(str => +Number.parseFloat(str).toFixed(2)) as [number, number, number];

    (e.target as HTMLInputElement).value = testCubeRotation.map(n => n.toString()).join(', ');
  });
  
  const quatStringEl = document.getElementById('quatString') as HTMLInputElement;

  quatStringEl.addEventListener('change', (e) => {
    const quatStr = (e.target as HTMLInputElement).value;
    testCubeQuat = quatStr.split(',').map(str => +Number.parseFloat(str).toFixed(2)) as [number, number, number, number];

    (e.target as HTMLInputElement).value = testCubeQuat.map(n => n.toString()).join(', ');
  });
  
  ['X', 'Y', 'Z', 'W'].forEach((axis, i) => {
    const inputEls: HTMLInputElement[] = Array.from(document.getElementsByClassName(`quat${axis}`)) as HTMLInputElement[];

    inputEls.forEach((el) => {
      el.addEventListener('input', (e) => {
        testCubeQuat[i] = Number.parseFloat((e.target as HTMLInputElement).value);
      })
    })
  });
}



window.addEventListener('load', () => {
  initThree();
  initButtons();

  const testObj = new THREE.Object3D();

  const angles = [20, 30, 40].map(v => v / 180 * Math.PI) as [number, number, number];

  testObj.rotation.set(...angles, 'XYZ');

  console.log(...testObj.quaternion.toArray().map(v => v.toFixed(2)));

  testObj.rotation.set(0, 0, 0, 'XYZ');

  testObj.rotateX(angles[0])
  testObj.rotateY(angles[1])
  testObj.rotateZ(angles[2])

  console.log(...testObj.quaternion.toArray().map(v => v.toFixed(2)));

  testObj.rotation.set(0, 0, 0, 'XYZ');


  angles.forEach((v, i) => {
    const res = new THREE.Quaternion;
    const newAngles = angles.map((vv, ii) => {
      return ii == i ? vv : 0
    })
    const newQuat = new THREE.Quaternion()
    newQuat.setFromEuler(new THREE.Euler(...newAngles as [number, number, number], 'XYZ'))
    testObj.applyQuaternion(newQuat)
  })

  console.log(...testObj.quaternion.toArray().map(v => v.toFixed(2)))
});
