import { Point2, Line, matrix2_Det, vec2Minus } from "./primitives";

export function buildConvex(points: Point2[]) {}

export function isConvex(line: Line) {
  if (line.length < 3) {
    return true;
  }

  // let a = line[index];
  // let b = line[(index + 1) % line.length];
  // let c = line[(index + 2) % line.length];

  let prevDiff = Math.sign(
    matrix2_Det([
      ...vec2Minus(line[1], line[0]),
      ...vec2Minus(line[2], line[1]),
    ])
  );

  for (let index = 1; index < line.length; index++) {
    const a = line[index];
    const b = line[(index + 1) % line.length];
    const c = line[(index + 2) % line.length];

    const currLineFrag = vec2Minus(b, a);

    const nextLineFrag = vec2Minus(c, b);
    const nextDiff = Math.sign(matrix2_Det([...currLineFrag, ...nextLineFrag]));

    // if dotProduct ~= -1
    if (Math.abs(prevDiff + nextDiff) <= Number.EPSILON) {
      return false;
    }

    prevDiff = nextDiff;
  }
  return true;
}
