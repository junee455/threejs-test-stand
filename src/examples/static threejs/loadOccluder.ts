import * as THREE from 'three';

import {GLTF, GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader';

export function loadOccluder(onLoad: (root: GLTF) => void) {
  const objLoader = new GLTFLoader();

  objLoader.load('polytech.glb', onLoad);

}