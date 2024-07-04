import "./index.css";

import { PerlinNoise2d, Vector2 } from "./perlinNoise";

function genRandomColor() {
  const r = ((Math.random() * 16 * 16) | 0) - 1;
  const g = ((Math.random() * 16 * 16) | 0) - 1;
  const b = ((Math.random() * 16 * 16) | 0) - 1;

  const chars = [r, g, b].reduce(
    (prev, curr) => `${prev}${curr.toString(16)}`,
    "#"
  );

  return chars;
}

function genMonoColor(scale: number) {
  let scaleToChar = ((scale * 255) | 0).toString(16);
  scaleToChar = `0${scaleToChar}`;
  scaleToChar = scaleToChar.slice(-2);

  const result = `#${scaleToChar}${scaleToChar}${scaleToChar}`;

  if (result.length !== 7) {
    console.log(result);
  }

  return result;
}

class SquareDrawer {
  private ctx: CanvasRenderingContext2D;

  private sqWidth: number = 1;
  private sqHeight: number = 1;

  constructor(
    private canvas: HTMLCanvasElement,
    readonly width: number,
    readonly height: number
  ) {
    this.ctx = canvas.getContext("2d") as CanvasRenderingContext2D;
    this.sqWidth = canvas.width / width;
    this.sqHeight = canvas.height / height;
  }

  private getRect(x: number, y: number): [number, number, number, number] {
    return [this.sqWidth * x, this.sqHeight * y, this.sqWidth, this.sqHeight];
  }

  public drawSquare(x: number, y: number, color: string) {
    this.ctx.fillStyle = color;
    this.ctx.fillRect(...this.getRect(x, y));
  }

  public drawRange(quadRange: string[][]) {}

  public drawRangeMono(quadRange: number[][]) {
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        const col = genMonoColor(quadRange[y][x]);
        this.drawSquare(x, y, col);
      }
    }
  }

  public clear() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }
}

interface VectorMeshVisualizerSettings {
  vectorColor: string;
  vectorLength: number;
  lineWidth: number;
}

const defaultVectorMeshVisualizerSettings = {
  vectorColor: "#ff0000",
  vectorLength: 20,
  lineWidth: 3,
} as VectorMeshVisualizerSettings;

class VectorMeshVisualizer {
  private ctx: CanvasRenderingContext2D;

  public settings: VectorMeshVisualizerSettings;

  constructor(
    public mesh: Vector2[][],
    private canvas: HTMLCanvasElement,
    _settings: Partial<VectorMeshVisualizerSettings> = {
      ...defaultVectorMeshVisualizerSettings,
    }
  ) {
    this.ctx = this.canvas.getContext("2d") as CanvasRenderingContext2D;
    if (!this.ctx) {
      return;
    }

    this.settings = {
      ...defaultVectorMeshVisualizerSettings,
      ..._settings,
    };
  }

  public clear() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }

  public visualize() {
    if (this.mesh.length < 2) {
      return;
    }

    if (this.mesh[0].length < 2) {
      return;
    }

    const cellStepX = this.canvas.width / (this.mesh[0].length - 1);
    const cellStepY = this.canvas.height / (this.mesh.length - 1);

    const { ctx, settings } = this;

    ctx.strokeStyle = this.settings.vectorColor;
    ctx.lineWidth = this.settings.lineWidth;

    this.mesh.forEach((meshRow, iy) => {
      meshRow.forEach((vec, ix) => {
        ctx.beginPath();
        const startX = ix * cellStepX;
        const startY = iy * cellStepY;
        ctx.moveTo(startX, startY);
        ctx.lineTo(
          startX + vec.vec[0] * settings.vectorLength,
          startY + vec.vec[1] * settings.vectorLength
        );
        ctx.stroke();
      });
    });
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const canvasEl = document.getElementById("mainCanvas") as HTMLCanvasElement;

  if (!canvasEl) {
    return;
  }

  const topOffset = 0;

  canvasEl.setAttribute("height", (window.innerHeight - topOffset).toString());
  canvasEl.setAttribute("width", window.innerWidth.toString());

  const squareDrawerSquareSize = 10;

  const drawer = new SquareDrawer(
    canvasEl,
    window.innerWidth / squareDrawerSquareSize,
    (window.innerHeight - topOffset) / squareDrawerSquareSize
  );

  drawer.clear();

  let monoRange: number[][] = [];

  // const squaresHor = 16;
  const squaresHor = 16;

  let testNoise = new PerlinNoise2d(
    squaresHor,
    window.innerHeight / (window.innerWidth / squaresHor)
  );

  let testNoise2 = new PerlinNoise2d(
    squaresHor,
    window.innerHeight / (window.innerWidth / squaresHor)
  );

  testNoise.randomize();
  testNoise2.randomize();

  let testMeshVisualizer = new VectorMeshVisualizer(
    testNoise.vectorMesh,
    canvasEl
  );

  for (let y = 0; y < drawer.height; y++) {
    monoRange[y] = [];
  }
  // console.log(monoRange);

  // setInterval(() => {

  setInterval(() => {
    drawer.clear();
    for (let y = 0; y < drawer.height; y++) {
      for (let x = 0; x < drawer.width; x++) {
        let _x = x / drawer.width;
        let _y = y / drawer.height;

        let noise1 = testNoise.valueAtPoint(_x, _y);
        let noise2 = testNoise2.valueAtPoint(_x, _y);
        // let noise3 = testNoise3.valueAtPoint(_x, _y, [noise1, noise2]);

        monoRange[y][x] = noise1;
        // monoRange[y][x] = noise3;

        // const col = genRandomColor();
        // console.log(col);
        // drawer.drawSquare(x, y, col);
      }
    }
    drawer.drawRangeMono(monoRange);
    // testMeshVisualizer.visualize();
    testNoise.rotate(0.03);
    testNoise2.rotate(-0.05);
  }, 10);

  // }, 500);
});
