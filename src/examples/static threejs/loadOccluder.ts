import * as THREE from "three";

// import {GLTF, GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader';
import { GLTF, GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { OBJLoader } from "three/examples/jsm/loaders/OBJLoader";

export function loadOccluderGLTF(onLoad: (root: GLTF) => void) {
  const objLoader = new GLTFLoader();

  objLoader.load("polytech.glb", onLoad);
}

export function loadOccluderOBJ(onLoad: (root: THREE.Group) => void) {
  const objLoader = new OBJLoader();
  objLoader.load("model.obj", onLoad);
}
