import "index.css";

import * as THREE from "three";
import { Quaternion } from "three";
import {
  loadOccluderGLTF,
  loadOccluderOBJ,
} from "examples/static threejs/loadOccluder";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

import { v4 as uuidv4 } from "uuid";

import { environments, sendToVps, constructRequestData } from "helpers/vpsV3";

import { sleep } from "utils";

import * as Helpers from "helpers/helpers";

import * as Mocks from "mockData/mobileVpsMockData";

let shouldContinue = false;

let interpValue = 0;

let testCubeRotation: [number, number, number] = [0, 0, 0];

let testCubePosition: [number, number, number] = [0, 0, 0];

let testCubeQuat: [number, number, number, number] = [0, 0, 0, 1];

let imageWidth = 1900;
let imageHeight = 1000;

let moveTracker = true;

let camFov = 90;

let continueLocalization = false;

const photoName = "8.jpg";

function lerp(from: number, to: number, t: number) {
  return (1 - t) * from + t * to;
}

type Position = [number, number, number];

function interpolatePosition(from: Position, to: Position, t: number) {
  const newPos = [];

  for (let i = 0; i < 3; i++) {
    newPos[i] = lerp(from[i], to[i], t);
  }

  return newPos as Position;
}

const extrinsicEulerAnglesToQuatDummyObj = new THREE.Object3D();

const fakeCanvas = document.createElement(
  "canvas",
) as unknown as HTMLCanvasElement;

const test = new Image();

async function cropImage(
  image: HTMLImageElement,
  width: number,
  height: number,
) {
  // const sx = width > 540 ? (width - 540) / 2 : 0; // 540
  // const sy = height > 960 ? (height - 960) / 2 : 0; // 960

  // const sw = Math.min(width, 540);
  // const sh = Math.min(height, 960)

  // fakeCanvas.width = sw
  // fakeCanvas.height = sh

  // const ctx = fakeCanvas.getContext('2d');

  // ctx.drawImage(image, sx, sy, sw, sh, 0, 0, sw, sh);

  const sx = 0;
  const sy = 0;

  const sw = width;
  const sh = height;

  fakeCanvas.width = 1000;
  fakeCanvas.height = 960;

  const ctx = fakeCanvas.getContext("2d");

  ctx.drawImage(image, sx, sy, sw, sh, 0, 0, 540, 960);

  // console.log(dx, dy, dw, dh)

  // document.body.appendChild(fakeCanvas);

  return new Promise<Blob>((resolve) => {
    fakeCanvas.toBlob((blob) => {
      test.src = URL.createObjectURL(blob);
      resolve(blob);
    });
  });
}

interface VpsPose {
  x: number;
  y: number;
  z: number;
  rx: number;
  ry: number;
  rz: number;
}

let vpsPose: VpsPose = null;

function updateCameraTransforms(data: VpsPose) {
  console.log(data);

  vpsPose = { ...data };
}

async function localize(uuid?: string) {
  const photo = await fetch(photoName).then((r) => r.blob());

  console.log(photo);

  let photoEl = new Image();

  const { width, height } = await new Promise<{
    width: number;
    height: number;
  }>((resolve) => {
    photoEl.onload = function () {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      const { width, height } = this;

      resolve({ width, height });
    };
    photoEl.src = URL.createObjectURL(photo);
  });

  console.log(width, height);

  const cropped = await cropImage(photoEl, width, height);

  const dw = Math.min(width, 540);
  const dh = Math.min(height, 960);

  const prevUuid = uuidv4();

  const formData = constructRequestData(
    cropped,
    dw,
    dh,
    714,
    ["kutuza32-floor11"],
    uuid || prevUuid,
  );
  // const formData = constructRequestData(cropped, dw, dh, 722, ["polytech"], uuid || prevUuid);

  const res = await sendToVps(formData, environments.prod);

  console.log(res.data.status);

  if (res.data.status === "done") {
    updateCameraTransforms(res.data.attributes.vps_pose);
    return;
  }

  // });
  // const result = await axios.post(" https://vps.naviar.io/vps/api/v3", imageData, {
  //@ts-ignore
  // mode: "cors",
  // headers: {
  // accept: "application/json",
  // "Accept-Language": "en-US,en;q=0.8",
  // "Content-Type": "multipart/form-data",
  // },
  // });
  if (!continueLocalization) {
    return;
  }

  setTimeout(() => localize(prevUuid), 1500);
}

function extrinsicEulerAnglesToQuat(angles: [number, number, number]) {
  const blAngles = [angles[1], angles[2], angles[0]];

  extrinsicEulerAnglesToQuatDummyObj.rotation.set(0, 0, 0, "XYZ");

  blAngles.forEach((v, i) => {
    const newAngles = angles.map((vv, ii) => {
      return ii == i ? (vv / 180) * Math.PI : 0;
    });
    const newQuat = new THREE.Quaternion();
    newQuat.setFromEuler(
      new THREE.Euler(...(newAngles as [number, number, number]), "YXZ"),
    );
    extrinsicEulerAnglesToQuatDummyObj.applyQuaternion(newQuat);
  });

  return extrinsicEulerAnglesToQuatDummyObj.quaternion.clone();
}

function interpolateQuaternion(from: Quaternion, to: Quaternion, t: number) {
  let newQuatValues = [
    lerp(from.x, to.x, t),
    lerp(from.y, to.y, t),
    lerp(from.z, to.z, t),
    lerp(from.w, to.w, t),
  ];

  const length =
    newQuatValues.reduce((prev, next) => prev + next * next, 0) ** 0.5;

  newQuatValues = newQuatValues.map((v) => v / length);

  return new THREE.Quaternion(
    ...(newQuatValues as [number, number, number, number]),
  );
}

export function correctPosition(
  lastPos: Position,
  vpsPos: Position,
  currentPos: Position,
) {
  return [
    currentPos[0] + vpsPos[0] - lastPos[0],
    currentPos[1] + vpsPos[1] - lastPos[1],
    currentPos[2] + vpsPos[2] - lastPos[2],
  ];
}

function correctAngle(
  lastAngle: Quaternion,
  vpsAngle: Quaternion,
  currentAngle: Quaternion,
) {
  let quatValues: [number, number, number, number] = [
    currentAngle.x + vpsAngle.x - lastAngle.x,
    currentAngle.y + vpsAngle.y - lastAngle.y,
    currentAngle.z + vpsAngle.z - lastAngle.z,
    currentAngle.w + vpsAngle.w - lastAngle.w,
  ];

  let abs = quatValues.reduce((prev, next) => prev + next * next, 0);
  abs **= 0.5;

  quatValues = quatValues.map((v) => v / abs) as [
    number,
    number,
    number,
    number,
  ];

  return new THREE.Quaternion(...quatValues);
}

function lerpPos(from: Position, to: Position, t: number) {
  const newPos = [];
  for (let i = 0; i < 3; i++) {
    newPos[i] = lerp(from[i], to[i], t);
  }

  return newPos as unknown as Position;
}

// const mockVpsPos: VpsPose = {
//   rx: 149.74812365633193,
//   ry: -34.48743633553862,
//   rz: -16.51976780621637,
//   x: 227.97501770481293,
//   y: -9.448191482883486,
//   z: 38.75021721539888
// }
// for 4
/*
{
    "x": 279.3456504064495,
    "y": -39.75968460885939,
    "z": 39.148654557235226,
    "rx": 89.59261008781128,
    "ry": 1.0531912644444916,
    "rz": -26.618189070855284
}
*/

// in unity
const mockVpsPos: VpsPose = {
  x: -279.3756284167099,
  y: 39.15314778878681,
  z: 39.8041554122348,
  rx: 0.37841034839626747,
  ry: -153.7716512231402,
  rz: -0.22276625146572562,
};

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

  // imageWidth = window.innerWidth;
  // imageHeight = window.innerHeight;

  imageHeight = 960;
  imageWidth = 540;

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

  loadOccluderGLTF((obj) => {
    occluder = obj.scene;
    occluder.rotation.set(0, (270 / 180) * Math.PI, 0, "XYZ");
    occluder.position.set(0, 0, 0);

    occluder.traverse((child) => {
      try {
        (child as THREE.Mesh).material = new THREE.MeshNormalMaterial();
      } catch {}
    });

    worldRig.add(occluder);
  });

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

  function animate() {
    requestAnimationFrame(animate);

    camera.fov = camFov;
    camera.updateProjectionMatrix();

    const newInterpRotation = interpolateQuaternion(
      fromCube.quaternion,
      toCube.quaternion,
      interpValue,
    );

    const interpCamPos: Position = correctPosition(
      fromCube.position.toArray(),
      lerpPos(
        fromCube.position.toArray(),
        toCube.position.toArray(),
        interpValue,
      ),
      [0, 0, -5],
    ) as Position;
    const interpCamRot = correctAngle(
      fromCube.quaternion,
      interpolateQuaternion(
        fromCube.quaternion,
        toCube.quaternion,
        interpValue,
      ),
      startQubeQuat,
    );

    interpolateCube.rotation.setFromQuaternion(interpCamRot);

    interpolateCube.position.set(...interpCamPos);

    // extrinsicTestCube.rotation.set(-90 / 180 * Math.PI, -90 / 180 * Math.PI, 0, 'YXZ');

    // extrinsicTestCube.position.set(...testCubePosition);

    // extrinsicTestCube.quaternion.multiply(extrinsicEulerAnglesToQuat(testCubeRotation));

    // extrinsicTestCube.quaternion.multiply(new THREE.Quaternion(...testCubeQuat));

    const actualCamPos = Helpers.cameraPosBlenderToThree([...testCubePosition]);
    const actualCamRot = Helpers.blenderCameraRotationToThreeQuaternion([
      ...testCubeRotation,
    ]);
    const rigTransform = Helpers.getWorldRigTransform(
      extrinsicTestCube.position,
      new THREE.Vector3(...actualCamPos),
      extrinsicTestCube.quaternion,
      actualCamRot,
    );
    worldRig.position.copy(rigTransform.position);
    worldRig.quaternion.copy(rigTransform.rotation);

    controls.update();

    // const p = vpsPose || mockVpsPos;

    // if (p) {
    // camera.position.set(...Helpers.camPosUnityToThree([p.x, p.y, p.z]));
    // camera.quaternion.copy( Helpers.unityCameraRotationToThreeQuaternion([p.rx, p.ry, p.rz]));

    // const actualCamPos = Helpers.cameraPosBlenderToThree([p.x, p.y, p.z]);
    // const actualCamRot = Helpers.cameraRotationToThreeQuaternion([p.rx, p.ry, p.rz]);

    // const rigTransform = Helpers.getWorldRigTransform(camera.position, new THREE.Vector3(...actualCamPos), camera.quaternion, actualCamRot);

    // worldRig.position.copy(rigTransform.position);
    // worldRig.quaternion.copy(rigTransform.rotation);

    // camera.position.copy(new THREE.Vector3(...actualCamPos));
    // camera.quaternion.copy(actualCamRot);

    camera.updateProjectionMatrix();
    camera.updateMatrixWorld();
    // }

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

  const getGlobalEulerEl = document.getElementById("getGlobalEuler");

  getGlobalEulerEl.addEventListener("click", () => {
    const dummyObj = new THREE.Object3D();

    dummyObj.rotation.set(
      (-90 / 180) * Math.PI,
      (-90 / 180) * Math.PI,
      0,
      "YXZ",
    );

    dummyObj.quaternion.multiply(extrinsicEulerAnglesToQuat(testCubeRotation));

    const dEuler = new THREE.Euler();

    const dummyQuat = new THREE.Quaternion();

    dummyObj.getWorldQuaternion(dummyQuat);

    dEuler.setFromQuaternion(dummyQuat);

    dEuler.reorder("XYZ");

    console.log(
      "local: ",
      dummyObj.rotation
        .toArray()
        .slice(0, 3)
        .map((v: number) => (v * 180) / Math.PI),
    );

    console.log(
      "global: ",
      dEuler
        .toArray()
        .slice(0, 3)
        .map((v: number) => (v * 180) / Math.PI),
    );
  });

  const interpolationSlider = document.getElementById(
    "interpolationSlider",
  ) as HTMLInputElement;
  interpolationSlider.addEventListener("input", (e) => {
    interpValue = Number.parseFloat((e.target as HTMLInputElement).value);
  });

  ["X", "Y", "Z"].forEach((axis, i) => {
    const inputEls: HTMLInputElement[] = Array.from(
      document.getElementsByClassName(`position${axis}`),
    ) as HTMLInputElement[];

    inputEls.forEach((el) => {
      el.addEventListener("input", (e) => {
        testCubePosition[i] = Number.parseFloat(
          (e.target as HTMLInputElement).value,
        );
      });
    });
  });

  ["X", "Y", "Z"].forEach((axis, i) => {
    const inputEls: HTMLInputElement[] = Array.from(
      document.getElementsByClassName(`rotation${axis}`),
    ) as HTMLInputElement[];

    const updateValues = (newVal: number) => {
      inputEls.forEach((el) => {
        el.setAttribute("value", newVal.toFixed(3));
        el.value = newVal.toFixed(3);
      });
    };

    inputEls.forEach((inputEl) => {
      if (inputEl.type === "range") {
        inputEl.addEventListener("input", (e) => {
          testCubeRotation[i] = Number.parseFloat(
            (e.target as HTMLInputElement).value,
          );
          updateValues((360 + testCubeRotation[i]) % 360);
        });
      }

      inputEl.addEventListener("change", (e) => {
        testCubeRotation[i] = Number.parseFloat(
          (e.target as HTMLInputElement).value,
        );
        updateValues((360 + testCubeRotation[i]) % 360);
      });
    });
  });

  const eulerStringEl = document.getElementById(
    "eulerString",
  ) as HTMLInputElement;
  eulerStringEl.addEventListener("change", (e) => {
    const quatStr = (e.target as HTMLInputElement).value;
    testCubeRotation = quatStr
      .split(",")
      .map((str) => +Number.parseFloat(str).toFixed(2)) as [
      number,
      number,
      number,
    ];

    (e.target as HTMLInputElement).value = testCubeRotation
      .map((n) => n.toString())
      .join(", ");
  });

  const quatStringEl = document.getElementById(
    "quatString",
  ) as HTMLInputElement;

  quatStringEl.addEventListener("change", (e) => {
    const quatStr = (e.target as HTMLInputElement).value;
    testCubeQuat = quatStr
      .split(",")
      .map((str) => +Number.parseFloat(str).toFixed(2)) as [
      number,
      number,
      number,
      number,
    ];

    (e.target as HTMLInputElement).value = testCubeQuat
      .map((n) => n.toString())
      .join(", ");
  });

  ["X", "Y", "Z", "W"].forEach((axis, i) => {
    const inputEls: HTMLInputElement[] = Array.from(
      document.getElementsByClassName(`quat${axis}`),
    ) as HTMLInputElement[];

    inputEls.forEach((el) => {
      el.addEventListener("input", (e) => {
        testCubeQuat[i] = Number.parseFloat(
          (e.target as HTMLInputElement).value,
        );
      });
    });
  });

  const opacityEl = document.getElementById(
    "opacityControls",
  ) as HTMLInputElement;
  const imageEl = document.getElementById("testImage");
  opacityEl.addEventListener("input", (e) => {
    imageEl.style.opacity = (e.target as HTMLInputElement).value;
  });

  const localizeEl = document.getElementById("localize") as HTMLButtonElement;

  localizeEl.addEventListener("click", () => {
    continueLocalization = true;
    localize();
  });

  const stopLocalizeEl = document.getElementById(
    "stopLocalization",
  ) as HTMLButtonElement;

  stopLocalizeEl.addEventListener("click", () => {
    continueLocalization = false;
  });

  const fovLabelEl = document.getElementById("fovLabel") as HTMLDivElement;
  const fovControlsEl = document.getElementById(
    "fovControls",
  ) as HTMLInputElement;

  fovControlsEl.addEventListener("input", (e) => {
    camFov = Number((e.target as HTMLInputElement).value);
    fovLabelEl.innerHTML = `fov: ${(e.target as HTMLInputElement).value}`;
  });
}

export async function base64VectorToBlob(base64Vector: string) {
  const byteChars = atob(base64Vector);

  const byteNumbers = new Array(byteChars.length);

  const chunkSize = byteChars.length;

  const byteArray = new Promise((resolve) => {
    for (let i = 0; i < chunkSize; i++) {
      byteNumbers[i] = byteChars.charCodeAt(i);
    }

    resolve(new Blob([new Uint8Array(byteNumbers)]));
  });

  return byteArray;
}

window.addEventListener("load", async () => {
  initThree();
  initButtons();

  const testObj = new THREE.Object3D();

  const angles = [20, 30, 40].map((v) => (v / 180) * Math.PI) as [
    number,
    number,
    number,
  ];

  testObj.rotation.set(...angles, "XYZ");

  console.log(...testObj.quaternion.toArray().map((v) => v.toFixed(2)));

  testObj.rotation.set(0, 0, 0, "XYZ");

  testObj.rotateX(angles[0]);
  testObj.rotateY(angles[1]);
  testObj.rotateZ(angles[2]);

  console.log(...testObj.quaternion.toArray().map((v) => v.toFixed(2)));

  testObj.rotation.set(0, 0, 0, "XYZ");

  angles.forEach((v, i) => {
    const res = new THREE.Quaternion();
    const newAngles = angles.map((vv, ii) => {
      return ii == i ? vv : 0;
    });
    const newQuat = new THREE.Quaternion();
    newQuat.setFromEuler(
      new THREE.Euler(...(newAngles as [number, number, number]), "XYZ"),
    );
    testObj.applyQuaternion(newQuat);
  });

  await sleep(3000);

  console.log(...testObj.quaternion.toArray().map((v) => v.toFixed(2)));

  const vector = JSON.parse(Mocks.mockData).base64Vector;

  const binary = await base64VectorToBlob(vector);

  console.log(binary);
  // document.getElementById('testImage').setAttribute('src', photoName);
});
