import "./index.scss";

type Vector2 = [number, number];
type Polygon2 = Vector2[];

type Transform = {
  origin: Vector2;
  scale: Vector2;
  rotation: number;
};

type Shape = {
  transform: Transform;
  polygon: Polygon2;
  color?: string;
};

type Matrix2 = [number, number, number, number];

function lengthVector2(vector: Vector2) {
  return Math.sqrt(vector[0] * vector[0] + vector[1] * vector[1]);
}

function normalizeVector2(vector: Vector2): Vector2 {
  const len = lengthVector2(vector);
  return [vector[0] / len, vector[1] / len];
}

function detMatrix2(mrx: Matrix2) {
  return mrx[0] * mrx[3] - mrx[1] * mrx[2];
}

function dotProductVector2(a: Vector2, b: Vector2) {
  return a[0] * b[0] + a[1] * b[1];
}

function addVector2(a: Vector2, b: Vector2): Vector2 {
  return [a[0] + b[0], a[1] + b[1]];
}

function scaleVector2(vector: Vector2, scale: Vector2): Vector2 {
  return [vector[0] * scale[0], vector[1] * scale[1]];
}

function diffPoint2(a: Vector2, b: Vector2): Vector2 {
  return [a[0] - b[0], a[1] - b[1]];
}

function multiplyScalarPoint2(point: Vector2, scalar: number): Vector2 {
  return [point[0] * scalar, point[1] * scalar];
}

function isPointInsidePolygon(point: Vector2, polygon: Polygon2) {
  let prevPoint = polygon[0];

  let sign = Math.sign(
    detMatrix2([
      ...diffPoint2(point, prevPoint),
      ...diffPoint2(polygon[1], prevPoint),
    ])
  );

  for (let i = 1; i < polygon.length + 1; i++) {
    const nextPoint = polygon[i % polygon.length];

    const newSign = Math.sign(
      detMatrix2([
        ...diffPoint2(point, prevPoint),
        ...diffPoint2(nextPoint, prevPoint),
      ])
    );

    if (newSign === 0) {
      return true;
    }

    if (newSign !== sign) {
      return false;
    }

    prevPoint = nextPoint;
  }

  return true;
}

function getRotationMatrix2(angle: number): Matrix2 {
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);

  return [cos, -sin, sin, cos];
}

function multiplyMatrixVector2(point: Vector2, matrix: Matrix2): Vector2 {
  return [
    point[0] * matrix[0] + point[1] * matrix[1],
    point[0] * matrix[2] + point[1] * matrix[3],
  ];
}

function rotateVector2(vector: Vector2, angle: number): Vector2 {
  return multiplyMatrixVector2(vector, getRotationMatrix2(angle));
}

function transformPolygon(polygon: Polygon2, transform: Transform) {
  const rotationMrx = getRotationMatrix2(transform.rotation);

  const polygonTransformed = polygon.map((point) => {
    const scaledPoint = [
      point[0] * transform.scale[0],
      point[1] * transform.scale[1],
    ] as Vector2;

    return addVector2(
      multiplyMatrixVector2(scaledPoint, rotationMrx),
      transform.origin
    );
  });

  return polygonTransformed;
}

function buildConvexPolytope(points: Vector2[]): Polygon2 {
  let result: Polygon2 = [];

  let startPoint: Vector2 = points[0];

  points.slice(1).forEach((p) => {
    if (p[1] > startPoint[1]) {
      startPoint = p;
    }
  });

  result.push(startPoint);

  let nextDirection: Vector2 = [-1, 0];

  let shouldBreak = false;

  let greatestDotProduct = -2;

  let iterations = 0;

  let potentialNext: Vector2;

  while (!shouldBreak) {
    iterations++;

    if (iterations > 1000) {
      shouldBreak = true;
    }

    points.forEach((p) => {
      if (result.slice(1).includes(p)) {
        return;
      }

      const _p = normalizeVector2(diffPoint2(p, startPoint));

      const nextDP = dotProductVector2(nextDirection, _p);

      if (nextDP > greatestDotProduct) {
        potentialNext = p;
        greatestDotProduct = nextDP;
      }
    });

    if (potentialNext! === result[0]) {
      return result;
    }

    result.push(potentialNext! as Vector2);
    nextDirection = normalizeVector2(diffPoint2(potentialNext!, startPoint));
    startPoint = potentialNext!;

    greatestDotProduct = -2;
  }

  return result;
}

function generateRandomPoints() {
  let polygon: Polygon2 = [];

  for (let i = 0; i < 20; i++) {
    polygon.push([Math.random() * 20 - 10, Math.random() * 20 - 10]);
  }

  return polygon;
}

function getSupportPoint(polygon: Polygon2, direction: Vector2): Vector2 {
  let greatestProduct = dotProductVector2(direction, polygon[0]);
  let greatestProductVector: Vector2 = polygon[0];

  for (let i = 0; i < polygon.length; i++) {
    const product = dotProductVector2(direction, polygon[i]);

    if (product > greatestProduct) {
      greatestProduct = product;
      greatestProductVector = polygon[i];
    }
  }

  return greatestProductVector;
}

function transformPoint(point: Vector2, transform: Transform) {
  const rotationMrx = getRotationMatrix2(transform.rotation);

  const scaledPoint = [
    point[0] * transform.scale[0],
    point[1] * transform.scale[1],
  ] as Vector2;

  return addVector2(
    multiplyMatrixVector2(scaledPoint, rotationMrx),
    transform.origin
  );
}

function polygonAverage(polygon: Polygon2) {
  let average: Vector2 = [0, 0];

  polygon.forEach((p) => {
    average = addVector2(average, p);
  });

  average = multiplyScalarPoint2(average, polygon.length);

  return average;
}

function findVectorToLine(from: Vector2, pointA: Vector2, pointB: Vector2) {
  const lineVector = diffPoint2(pointB, pointA);

  const fromTranslated = diffPoint2(from, pointA);
}

function findVectorFromLineToOrigin(pointA: Vector2, pointB: Vector2) {
  const lineVector = diffPoint2(pointB, pointA);
  const toOriginVector = diffPoint2([0, 0], pointA);

  const toOriginDirection = Math.sign(
    detMatrix2([...lineVector, ...toOriginVector])
  );

  const result = normalizeVector2([-lineVector[1], lineVector[0]]);

  const resultDirection = Math.sign(detMatrix2([...lineVector, ...result]));

  return multiplyScalarPoint2(result, toOriginDirection * resultDirection);
}

function findDistanceFromLineToOrigin(pointA: Vector2, pointB: Vector2) {
  const translatedB = diffPoint2(pointB, pointA);
  const translatedOrigin = diffPoint2([0, 0], pointA);

  const det = detMatrix2([...translatedB, ...translatedOrigin]);

  return det / lengthVector2(translatedB);
}

function findSideClosestToOrigin(polygon: Polygon2) {
  let pair: [Vector2, Vector2] = [polygon[0], polygon[1]];

  let distance = findDistanceFromLineToOrigin(...pair);

  for (let i = 1; i < polygon.length; i++) {
    const nextPair: [Vector2, Vector2] = [
      polygon[i],
      polygon[(i + 1) % polygon.length],
    ];

    const nextDistance = findDistanceFromLineToOrigin(...nextPair);

    if (nextDistance < distance) {
      distance = nextDistance;
      pair = nextPair;
    }
  }

  return pair;
}

function areSameVector2(a: Vector2, b: Vector2) {
  return Math.abs(lengthVector2(diffPoint2(a, b))) <= Number.EPSILON;
}

function findMinimumMinkowskyDiff(
  shapeA: Shape,
  shapeB: Shape
): {
  resultShape: Shape;
  fullMinkowskyDiffPolygon: Polygon2;
  intersecting: boolean;
} {
  const resultShape: Shape = {
    transform: {
      origin: [0, 0],
      rotation: 0,
      scale: [1, 1],
    },
    polygon: [],
  };

  const shapeATransformed = transformPolygon(shapeA.polygon, shapeA.transform);
  const shapeBTransformed = transformPolygon(shapeB.polygon, shapeB.transform);

  // find average origins
  const fullMinkowskyDiffPolygon = findFullMinkowskyDiff(shapeA, shapeB)[1];

  let fromPoint = polygonAverage(shapeATransformed);
  let toPoint = polygonAverage(shapeBTransformed);

  // let fromPoint = shapeA.transform.origin;
  // let toPoint = shapeB.transform.origin;

  let minkowskiPoints: Vector2[] = [];

  let direction = normalizeVector2(diffPoint2(toPoint, fromPoint));

  const findNewPointInDirection = () => {
    const farA = getSupportPoint(shapeATransformed, direction);
    const farB = getSupportPoint(
      shapeBTransformed,
      multiplyScalarPoint2(direction, -1)
    );

    minkowskiPoints.push(diffPoint2(farA, farB));
  };

  // find first two points

  findNewPointInDirection();

  direction = normalizeVector2(multiplyScalarPoint2(minkowskiPoints[0], -1));

  findNewPointInDirection();

  if (dotProductVector2(minkowskiPoints[0], minkowskiPoints[1]) > 0) {
    resultShape.polygon = minkowskiPoints;
    minkowskiPoints.push(minkowskiPoints[1]);
    return { resultShape, fullMinkowskyDiffPolygon, intersecting: false };
  }

  // find last point and intersection;

  let intersecting = false;

  const findNextDirectionAndPoint = () => {
    const lastLine = findSideClosestToOrigin(minkowskiPoints);

    direction = findVectorFromLineToOrigin(...lastLine);

    findNewPointInDirection();

    minkowskiPoints = [
      // ...minkowskiPoints.slice(0, 2),
      ...minkowskiPoints.slice(-3),
    ];
  };

  let iterations = 0;

  findNextDirectionAndPoint();

  let lastPoint = minkowskiPoints[2];

  do {
    if (isPointInsidePolygon([0, 0], minkowskiPoints)) {
      intersecting = true;
      break;
    }

    iterations++;

    lastPoint = minkowskiPoints[2];

    findNextDirectionAndPoint();

    if (iterations > 100) {
      console.log("fuck fuck fuck");
      break;
    }
  } while (!areSameVector2(lastPoint, minkowskiPoints[2]));

  resultShape.polygon = minkowskiPoints;

  return { resultShape, fullMinkowskyDiffPolygon, intersecting };
}

function findFullMinkowskyDiff(
  shapeA: Shape,
  shapeB: Shape
): [Shape, Polygon2] {
  const resultShape: Shape = {
    transform: {
      origin: [0, 0],
      rotation: 0,
      scale: [1, 1],
    },
    polygon: [],
  };

  const points: Vector2[] = [];

  const shapeATransformed = transformPolygon(shapeA.polygon, shapeA.transform);
  const shapeBTransformed = transformPolygon(shapeB.polygon, shapeB.transform);

  shapeATransformed.forEach((pa) => {
    shapeBTransformed.forEach((pb) => {
      points.push(diffPoint2(pa, pb));
    });
  });

  // const points =
  //  buildConvexPolytope()
  resultShape.polygon = buildConvexPolytope(points);

  return [resultShape, points];
}

class CanvasDrawer {
  public ctx: CanvasRenderingContext2D;
  constructor(private canvas: HTMLCanvasElement) {
    this.ctx = canvas.getContext("2d") as CanvasRenderingContext2D;

    canvas.setAttribute("height", window.innerHeight.toString());
    canvas.setAttribute("width", window.innerWidth.toString());

    this.ctx.resetTransform();

    this.ctx.scale(1, -1);
    this.ctx.translate(window.innerWidth / 2, -window.innerHeight / 2);
  }

  public drawPoint(point: Vector2) {
    const { ctx } = this;
    ctx.fillStyle = "red";

    ctx.fillRect(point[0] - 3, point[1] - 3, 6, 6);
  }

  // public findMinkowskySumm(shapeA: Shape, shapeB: Shape): Shape {

  // }

  public drawShape(shape: Shape) {
    const { ctx } = this;

    ctx.strokeStyle = shape.color || "#ffffff";
    ctx.lineWidth = 2;
    ctx.fillStyle = "blue";

    if (shape.polygon.length < 3) {
      return;
    }

    const pointsTransformed = transformPolygon(shape.polygon, shape.transform);

    ctx.beginPath();

    ctx.moveTo(...pointsTransformed[0]);

    pointsTransformed.forEach((point) => {
      ctx.lineTo(...point);
    });

    ctx.lineTo(...pointsTransformed[0]);

    ctx.stroke();

    const pointSize = 4;

    const originRect = [
      (shape.transform.origin[0] - pointSize / 2) | 0,
      (shape.transform.origin[1] - pointSize / 2) | 0,
      pointSize,
      pointSize,
    ] as [number, number, number, number];

    ctx.fillRect(...originRect);
  }

  public clear() {
    const from = [-window.innerWidth / 2, -window.innerHeight / 2] as Vector2;
    const to = [this.canvas.width, this.canvas.height] as Vector2;

    this.ctx.fillStyle = "black";
    this.ctx.clearRect(...from, to[0] - from[0], to[1] - from[1]);

    this.ctx.fillStyle = "#00FF00";
    this.ctx.fillRect(-1, -20, 2, 40);

    this.ctx.fillStyle = "#FF0000";
    this.ctx.fillRect(-20, -1, 40, 2);
  }
}

window.addEventListener("DOMContentLoaded", () => {
  const canvasEl = document.getElementById("mainCanvas");

  if (!canvasEl) {
    return;
  }

  const canvasDrawer = new CanvasDrawer(canvasEl as HTMLCanvasElement);

  canvasDrawer.clear();

  const testPolygon: Polygon2 = [
    [20, 20],
    [30, 0],
    [20, -20],
    [-20, -20],
    [-20, 20],
  ];

  const testPolygon2: Polygon2 = [
    [30, 20],
    [40, 0],
    [30, -20],
    [0, -30],
    [-30, -20],
    [-30, 20],
    [0, 30],
  ] as Polygon2;

  const testShape: Shape = {
    transform: {
      origin: [100, 100],
      scale: [2, 2],
      rotation: 0.5,
    },
    polygon: testPolygon,
  };

  const testShape2: Shape = {
    transform: {
      origin: [-300, -200],
      scale: [3, 3],
      rotation: 0,
    },
    polygon: testPolygon2.map((vec) => addVector2(vec, [70, 20])),
  };

  const floorShape: Shape = {
    transform: {
      origin: [window.innerWidth / 2, 200],
      scale: [1, 1],
      rotation: 0,
    },
    polygon: [
      [window.innerWidth / 2.5, 10],
      [window.innerWidth / 2.5, -10],
      [-window.innerWidth / 2.5, -10],
      [-window.innerWidth / 2.5, 10],
    ],
  };

  const vectorShape: Shape = {
    transform: {
      origin: [window.innerWidth / 2, window.innerHeight / 2],
      scale: [1, 5],
      rotation: 0,
    },
    polygon: [
      [0, 10],
      [-5, 10],
      [0, 15],
      [5, 10],
      [0, 10],
      [0, -10],
    ],
  };

  let cursorPosition: Vector2 = [0, 0];

  canvasDrawer.drawShape(testShape);

  const isInsideEl = document.getElementById("isInside") as HTMLElement;

  window.addEventListener("mousemove", (ev) => {
    cursorPosition = diffPoint2(
      [ev.clientX, ev.clientY],
      testShape2.transform.origin
    );

    if (isPointInsidePolygon(cursorPosition, testShape2.polygon)) {
      isInsideEl.innerHTML = "true";
    } else {
      isInsideEl.innerHTML = "false";
    }
  });

  let shape2Velocity = 0;

  const acceleration = -98;

  const unitVector: Vector2 = [0, 1];

  const randomPoints = generateRandomPoints();

  const randomShape: Shape = {
    transform: {
      origin: [-200, 200],
      scale: [10, 10],
      rotation: 0,
    },
    polygon: buildConvexPolytope(randomPoints),
  };

  let delta = (191 * Math.PI) / 180;

  document.getElementById("rotationInput")?.addEventListener("input", (ev) => {
    delta = Number((ev.target as HTMLInputElement).value);
    delta = (delta * Math.PI) / 180;
  });

  let cubeLocalRotation = 0;

  document
    .getElementById("rotationLocalInput")
    ?.addEventListener("input", (ev) => {
      cubeLocalRotation = Number((ev.target as HTMLInputElement).value);
      cubeLocalRotation = (cubeLocalRotation * Math.PI) / 180;
    });

  let dragging = false;

  function mouseCoordsToSpaceCoords(clientX: number, clientY: number) {
    return [
      clientX - window.innerWidth / 2,
      window.innerHeight - clientY - window.innerHeight / 2,
    ] as Vector2;
  }

  document.addEventListener("wheel", (ev) => {
    const testMeshTransformed = transformPolygon(
      testShape.polygon,
      testShape.transform
    );

    const mouseCoords: Vector2 = mouseCoordsToSpaceCoords(
      ev.clientX,
      ev.clientY
    );

    const isMouseInside = isPointInsidePolygon(
      mouseCoords,
      testMeshTransformed
    );

    if (isMouseInside) {
      testShape.transform.rotation += 0.1 * Math.sign(ev.deltaY);
    }
  });

  document.addEventListener("mousedown", (ev) => {
    const testMeshTransformed = transformPolygon(
      testShape.polygon,
      testShape.transform
    );

    const mouseCoords: Vector2 = mouseCoordsToSpaceCoords(
      ev.clientX,
      ev.clientY
    );

    const isMouseInside = isPointInsidePolygon(
      mouseCoords,
      testMeshTransformed
    );

    dragging = isMouseInside;
  });
  document.addEventListener("mouseup", () => {
    dragging = false;
  });

  document.addEventListener("mousemove", (ev) => {
    if (dragging) {
      const origin = mouseCoordsToSpaceCoords(ev.clientX, ev.clientY);

      testShape.transform.origin = origin;
    }
  });

  setInterval(() => {
    // testShape.transform.rotation += 0.01;

    vectorShape.transform.rotation -= 0.02;

    canvasDrawer.clear();

    // testShape.transform.origin[0] = Math.cos(delta) * 200;
    // testShape.transform.origin[1] = Math.sin(delta) * 200;

    // testShape.transform.rotation = cubeLocalRotation;

    canvasDrawer.drawShape(testShape2);

    const testDiff = findMinimumMinkowskyDiff(testShape, testShape2);

    testShape.color = testDiff.intersecting ? "green" : "white";

    canvasDrawer.drawShape(testShape);

    if (testDiff.intersecting) {
      isInsideEl.innerHTML = "true";
    } else {
      isInsideEl.innerHTML = "false";
    }

    canvasDrawer.drawShape(testDiff.resultShape);

    testDiff.fullMinkowskyDiffPolygon.forEach((p) => canvasDrawer.drawPoint(p));

    // canvasDrawer.drawShape(randomShape);

    // randomPoints.forEach((p) => {
    //   canvasDrawer.drawPoint(
    //     addVector2(
    //       scaleVector2(p, randomShape.transform.scale),
    //       randomShape.transform.origin
    //     )
    //   );
    // });

    // canvasDrawer.drawPoint

    const supportPoint = getSupportPoint(
      testShape2.polygon,
      rotateVector2(unitVector, vectorShape.transform.rotation)
    );

    canvasDrawer.drawPoint(
      addVector2(
        scaleVector2(supportPoint, testShape2.transform.scale),
        testShape2.transform.origin
      )
    );

    canvasDrawer.drawShape;
    // canvasDrawer.drawShape(floorShape);

    canvasDrawer.drawShape(vectorShape);

    canvasDrawer.drawShape({
      ...vectorShape,
      transform: {
        ...vectorShape.transform,
        scale: [0.7, 3],
        origin: testShape2.transform.origin,
      },
    });

    shape2Velocity += acceleration * 0.01;

    // if (testShape2.transform.origin[1] >= 0) {
    //   testShape2.transform.origin = addPoint2(testShape2.transform.origin, [
    //     0,
    //     shape2Velocity * 0.01,
    //   ]);
    // }
  }, 10);
});
