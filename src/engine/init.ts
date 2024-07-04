import * as THREE from "three";

import { IRenderComponent } from "./genericRenderComponent";

export type ThreeContextCallback = (context: IThreeContext) => void;

export interface IThreeContext {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  renderer: THREE.WebGLRenderer;
  canvas: HTMLCanvasElement;
  deltaTime: number;
  time: number;
}

export class ThreeContext implements IThreeContext {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  renderer: THREE.WebGLRenderer;
  canvas: HTMLCanvasElement;
  deltaTime: number;
  time: number;
  components: IRenderComponent[] = [];
  callbacks: ThreeContextCallback[] = [];

  constructor(
    scene: THREE.Scene,
    camera: THREE.PerspectiveCamera,
    renderer: THREE.WebGLRenderer,
    canvas: HTMLCanvasElement
  ) {
    this.scene = scene;
    this.camera = camera;
    this.renderer = renderer;
    this.canvas = canvas;
  }

  public removeComponent(component: IRenderComponent) {
    this.components = this.components.filter((c) => c != component);
  }

  public addComponent(component: IRenderComponent) {
    this.components.push(component);
  }
}

export function initThree(elId: string): ThreeContext {
  const canvas = document.getElementById(elId) as HTMLCanvasElement;

  const renderWidth = document.body.offsetWidth;
  const renderHeight = document.body.offsetHeight;

  canvas.width = renderWidth;
  canvas.height = renderHeight;
  const renderer = new THREE.WebGLRenderer({
    alpha: true,
    canvas,
  });

  renderer.setSize(renderWidth, renderHeight);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(
    60,
    renderWidth / renderHeight,
    0.0001,
    1000
  );

  const clock = new THREE.Clock(true);

  const threeContext = new ThreeContext(scene, camera, renderer, canvas);

  function animate() {
    requestAnimationFrame(animate);

    const deltaTime = clock.getDelta();
    const time = clock.getElapsedTime();

    threeContext.components.forEach((c) => {
      try {
        c.onRender({
          scene,
          camera,
          renderer,
          deltaTime,
          canvas,
          time,
        });
      } catch {}
    });

    threeContext.callbacks.forEach((c) => {
      try {
        c({
          scene,
          camera,
          renderer,
          deltaTime,
          canvas,
          time,
        });
      } catch (e) {
        console.log(e);
      }
    });

    renderer.render(scene, camera);
  }
  setTimeout(animate, 0);

  return threeContext;
}
