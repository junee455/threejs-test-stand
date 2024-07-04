function vec2Rotate(vec: [number, number], angle: number): [number, number] {
  const [x, y] = vec;

  const a_cos = Math.cos(angle);
  const a_sin = Math.sin(angle);

  const newX = x * a_cos - y * a_sin;
  const newY = x * a_sin + y * a_cos;

  return [newX, newY];
}

function lerp(a0: number, a1: number, w: number) {
  // return (a1 - a0) * w + a0;
  return (a1 - a0) * ((w * (w * 6.0 - 15.0) + 10.0) * w * w * w) + a0;
}

function smoothStep(t: number) {
  // return 6 * t ** 5 - 15 * t ** 4 + 10 * t ** 3
  return 3 * t * t - 2 * t * t * t;
  // return Math.cos(t * Math.PI) * -0.5 + 0.5;
}

function dot(a: number[], b: number[]) {
  let dotProduct = 0;

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
  }

  return dotProduct;
}

function cross3(a: [number, number, number], b: [number, number, number]) {
  return [
    a[1] * b[2] - a[2] * b[1],
    a[2] * b[0] - a[0] * b[2],
    a[0] * b[1] - a[1] * b[0],
  ];
}

function cross2(a: [number, number], b: [number, number]) {
  return cross3([...a, 0], [...b, 0]);
}

function vecLen(vec: number[]) {
  const squares = vec.reduce((prev, curr) => prev + curr * curr, 0);
  return Math.sqrt(squares);
}

class Vector3 {
  constructor(private vec: [number, number, number] = [0, 0, 0]) {}
}

export class Vector2 {
  constructor(public vec: [number, number] = [0, 0]) {}

  public length() {
    return vecLen(this.vec);
  }

  public normalize() {
    const len = this.length();

    this.vec[0] = this.vec[0] / len;
    this.vec[1] = this.vec[1] / len;

    return this;
  }

  public copy() {
    return new Vector2([...this.vec]);
  }

  public static randomUnit() {
    const unit = new Vector2([Math.random() * 2 - 1, Math.random() * 2 - 1]);
    unit.normalize();
    return unit;
  }

  public dot(b: Vector2) {
    return this.vec[0] * b.vec[0] + this.vec[1] * this.vec[1];
  }

  public cross(b: Vector2) {
    return cross2(this.vec, b.vec);
  }

  public rotate(angle: number) {
    const a_cos = Math.cos(angle);
    const a_sin = Math.sin(angle);

    const newX = this.vec[0] * a_cos - this.vec[1] * a_sin;
    const newY = this.vec[0] * a_sin + this.vec[1] * a_cos;

    this.vec[0] = newX;
    this.vec[1] = newY;
  }
}

export class PerlinNoise2d {
  public vectorMesh: Vector2[][];

  private width: number;
  private height: number;

  constructor(
    readonly _width: number,
    readonly _height: number
  ) {
    this.width = _width | 0;
    this.height = _height | 0;

    this.vectorMesh = [];
    for (let y = 0; y < this.height + 1; y++) {
      this.vectorMesh[y] = [];
      for (let x = 0; x < this.width + 1; x++) {
        // this.vectorMesh[y][x] = Vector2.randomUnit();
        this.vectorMesh[y][x] = new Vector2([0, 1]);
      }
    }
  }

  public randomize() {
    for (let y = 0; y < this.height + 1; y++) {
      for (let x = 0; x < this.width + 1; x++) {
        this.vectorMesh[y][x] = Vector2.randomUnit();
      }
    }
  }

  public valueAtPoint(x: number, y: number, wrapAngle = 0): number {
    // const _width = this.width - 1;

    const sx: number[] = [];
    const sy: number[] = [];

    // const local: [number, number] = vec2Rotate(
    //   [(x * this.width) % 1, (y * this.height) % 1],
    //   wrapAngle
    // );

    const local: [number, number] = vec2Rotate(
      [(x * this.width) % 1, (y * this.height) % 1],
      0
    );

    
    sx[0] = (this.width * x) | 0;
    sx[1] = sx[0] + 1;

    sy[0] = (this.height * y) | 0;
    sy[1] = sy[0] + 1;

    let lrp1: number;
    let lrp2: number;

    const lerpFoo = lerp;

    lrp1 = lerpFoo(
      dot(this.vectorMesh[sy[0]][sx[0]].vec, local),
      dot(this.vectorMesh[sy[0]][sx[1]].vec, [local[0] - 1, local[1]]),
      local[0]
    );

    lrp2 = lerpFoo(
      dot(this.vectorMesh[sy[1]][sx[0]].vec, [local[0], local[1] - 1]),
      dot(this.vectorMesh[sy[1]][sx[1]].vec, [local[0] - 1, local[1] - 1]),
      local[0]
    );

    // lrp1 = lerpFoo(
    //   dot(this.vectorMesh[sy[0]][sx[0]].vec, local),
    //   dot(this.vectorMesh[sy[0]][sx[1]].vec, local),
    //   local[0]
    // );

    // lrp2 = lerpFoo(
    //   dot(this.vectorMesh[sy[1]][sx[0]].vec, local),
    //   dot(this.vectorMesh[sy[1]][sx[1]].vec, local),
    //   local[0]
    // );

    function correctLrp(lrp: number) {
      // return lrp + 0.2;
      return (lrp + 0.5) / 2;
      // return (lrp / 1.4 + 1) / 2;
    }

    lrp1 = correctLrp(lrp1);
    lrp2 = correctLrp(lrp2);

    // return lerp(lrp1, lrp2, local[1]);
    return smoothStep(lerpFoo(lrp1, lrp2, local[1]));

    // return lerp(lrp1, lrp2, local[1]);
  }

  public rotate(angle: number) {
    this.vectorMesh.forEach((row) => {
      row.forEach((vec) => {
        vec.rotate(angle);
        vec.normalize();
      });
    });
  }
}
