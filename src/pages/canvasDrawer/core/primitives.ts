export type Point2 = [number, number];
export type Point3 = [number, number, number];

export type Line = Point2[];

export function vecLen(vec: number[]) {
  const squares = vec.reduce((prev, curr) => prev + curr * curr, 0);
  return Math.sqrt(squares);
}

export function dot(a: number[], b: number[]) {
  let dotProduct = 0;

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
  }

  return dotProduct;
}

export function matrix2_Det(matrix: [number, number, number, number]) {
  return matrix[0] * matrix[3] - matrix[1] * matrix[2];
}

export function cross3(a: Point3, b: Point3): Point3 {
  return [
    a[1] * b[2] - a[2] * b[1],
    a[2] * b[0] - a[0] * b[2],
    a[0] * b[1] - a[1] * b[0],
  ];
}

export function cross2(a: Point2, b: Point2) {
  return cross3([...a, 0], [...b, 0]);
}

export function vec2Minus(a: Point2, b: Point2): Point2 {
  return [a[0] - b[0], a[1] - b[1]];
}

export function normalize<T extends number[]>(vec: T) {
  const len = vecLen(vec);
  const newVec: T = [] as unknown as T;

  vec.forEach((component) => {
    newVec.push(component / len);
  });

  return newVec;
}
