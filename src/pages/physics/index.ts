import "./index.scss";

type Point2 = [number, number];
type Point3 = [number, number, number];

type Line = Point2[];

function dot(a: number[], b: number[]) {
  let dotProduct = 0;

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
  }

  return dotProduct;
}

function matrix2_Det(matrix: [number, number, number, number]) {
  return matrix[0] * matrix[3] - matrix[1] * matrix[2];
}

function cross3(a: Point3, b: Point3): Point3 {
  return [
    a[1] * b[2] - a[2] * b[1],
    a[2] * b[0] - a[0] * b[2],
    a[0] * b[1] - a[1] * b[0],
  ];
}

function cross2(a: Point2, b: Point2) {
  return cross3([...a, 0], [...b, 0]);
}

function vec2Minus(a: Point2, b: Point2): Point2 {
  return [a[0] - b[0], a[1] - b[1]];
}

function normalize<T extends number[]>(vec: T) {
  const len = vecLen(vec);
  const newVec: T = [] as unknown as T;

  vec.forEach((component) => {
    newVec.push(component / len);
  });

  return newVec;
}

function buildConvex(points: Point2[]) {}

function isConvex(line: Line) {
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

function vecLen(vec: number[]) {
  const squares = vec.reduce((prev, curr) => prev + curr * curr, 0);
  return Math.sqrt(squares);
}

interface Primitive {
  render: (ctx: CanvasRenderingContext2D) => void;
}

class LineDrawer {
  public ctx: CanvasRenderingContext2D;

  public primitives: Primitive[];
  
  public lines: Line[] = [];
  public points: Point2[] = [];

  constructor(private canvas: HTMLCanvasElement) {
    this.ctx = canvas.getContext("2d") as CanvasRenderingContext2D;

    canvas.setAttribute("height", window.innerHeight.toString());
    canvas.setAttribute("width", window.innerWidth.toString());
  }

  public addLine(line: Line) {
    this.lines.push(line);
    this.update();
  }

  public addPoint(point: Point2) {
    this.points.push(point);
    this.update();
  }

  public update() {
    const { ctx } = this;

    this.clear();

    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 2;
    ctx.fillStyle = "blue";

    const pointSize = 4;

    this.points.forEach((point) => {
      ctx.fillRect(
        (point[0] - pointSize / 2) | 0,
        (point[1] - pointSize / 2) | 0,
        pointSize,
        pointSize
      );
    });

    this.lines.forEach((line) => {
      ctx.strokeStyle = "#00ff00";

      ctx.beginPath();
      ctx.moveTo(line[0][0], line[0][1]);
      line.slice(1).forEach((point) => {
        ctx.lineTo(...point);
      });
      // ctx.lineTo(line[0][0], line[0][1]);
      ctx.stroke();
    });
  }

  public clear() {
    this.ctx.fillStyle = "black";
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }
}

interface Tool {
  onMouseMove?: (ev: MouseEvent) => void;
  onMouseDown?: (ev: MouseEvent) => void;
  onMouseUp?: (ev: MouseEvent) => void;
}

abstract class BasicTool {
  constructor(protected canvas: LineDrawer) {}
}

class ErazerTool extends BasicTool implements Tool {
  private erasing = false;

  // radius in px;
  private brushSize = 100;

  private removePointsUnderCursor(clientX: number, clientY: number) {
    this.canvas.points = this.canvas.points.filter((pt) => {
      const dist_x = Math.abs(pt[0] - clientX);
      const dist_y = Math.abs(pt[1] - clientY);

      if (dist_x <= this.brushSize / 2 && dist_y <= this.brushSize / 2) {
        return false;
      }

      return true;
    });

    this.canvas.lines;
  }

  private drawBrush(clientX: number, clientY: number) {
    this.canvas.update();

    this.canvas.ctx.fillStyle = "pink";
    const x = (clientX - this.brushSize / 2) | 0;
    const y = (clientY - this.brushSize / 2) | 0;
    this.canvas.ctx.fillRect(x, y, this.brushSize, this.brushSize);
  }

  public onMouseDown(ev: MouseEvent) {
    this.erasing = true;

    this.removePointsUnderCursor(ev.clientX, ev.clientY);

    this.drawBrush(ev.clientX, ev.clientY);
  }

  public onMouseUp(ev: MouseEvent) {
    this.erasing = false;

    this.canvas.update();
  }

  public onMouseMove(ev: MouseEvent) {
    if (!this.erasing) {
      return;
    }

    this.drawBrush(ev.clientX, ev.clientY);
    this.removePointsUnderCursor(ev.clientX, ev.clientY);
  }
}

class LineTool extends BasicTool implements Tool {
  private currentLine?: Line;

  private pixelsPassed = 0;
  private prevPoint?: Point2;

  private segmentDistance = 10;

  public onMouseMove(ev: MouseEvent) {
    if (!this.currentLine || !this.prevPoint) {
      return;
    }

    const lastPoint = this.currentLine.slice(-1)[0];

    const delta =
      ((this.prevPoint[0] - ev.clientX) ** 2 +
        (this.prevPoint[1] - ev.clientY) ** 2) **
      0.5;

    this.pixelsPassed += delta;

    this.prevPoint = [ev.clientX, ev.clientY];

    if (this.pixelsPassed >= this.segmentDistance) {
      this.currentLine.push([ev.clientX, ev.clientY]);
      this.pixelsPassed = 0;
    } else {
      lastPoint[0] = ev.clientX;
      lastPoint[1] = ev.clientY;
    }

    this.canvas.update();
  }

  public onMouseDown(ev: MouseEvent) {
    this.currentLine = [
      [ev.clientX, ev.clientY],
      [ev.clientX, ev.clientY],
    ];
    this.prevPoint = [ev.clientX, ev.clientY];

    this.pixelsPassed = 0;

    this.canvas.addLine(this.currentLine);
  }

  public onMouseUp() {
    this.currentLine = undefined;
  }
}

class PointTool extends BasicTool implements Tool {
  public onMouseDown(ev: MouseEvent) {
    this.canvas.addPoint([ev.clientX, ev.clientY]);
  }
}

window.addEventListener("DOMContentLoaded", () => {
  let drawing = false;

  let prevPoint: Point2 | undefined;
  let distancePassed = 0;

  const drawerElement = document.body;

  const mainCanvasEl = document.getElementById(
    "mainCanvas"
  ) as HTMLCanvasElement | null;

  if (!mainCanvasEl) {
    return;
  }

  let lineDrawer = new LineDrawer(mainCanvasEl);

  let currentTool: Tool | undefined;

  let previousListeners: Tool | undefined;

  let customCursorEl = document.getElementById("cursor");

  if (customCursorEl) {
    document.addEventListener("mouseleave", () => {
      customCursorEl.style.display = "none";
    });

    document.addEventListener("mouseenter", () => {
      customCursorEl.style.display = "block";
    });

    document.addEventListener("mousemove", (ev) => {
      customCursorEl.style.top = `${ev.clientY}px`;
      customCursorEl.style.left = `${ev.clientX}px`;
    });
  }

  function addTools() {
    const tools = [
      {
        label: "point",
        tool: new PointTool(lineDrawer),
      },
      {
        label: "line",
        tool: new LineTool(lineDrawer),
      },
      {
        label: "erazer",
        tool: new ErazerTool(lineDrawer),
      },
    ];

    const toolbarEl = document.getElementById("toolbar");

    function switchTool(tool: Tool) {
      if (previousListeners) {
        // remove all previous event listeners

        if (previousListeners.onMouseDown) {
          drawerElement.removeEventListener(
            "mousedown",
            previousListeners.onMouseDown
          );
        }

        if (previousListeners.onMouseUp) {
          drawerElement.removeEventListener(
            "mouseup",
            previousListeners.onMouseUp
          );
        }

        if (previousListeners.onMouseMove) {
          drawerElement.removeEventListener(
            "mousemove",
            previousListeners.onMouseMove
          );
        }
      }

      currentTool = tool;

      previousListeners = {};

      if (currentTool.onMouseDown) {
        previousListeners.onMouseDown =
          currentTool.onMouseDown.bind(currentTool);

        drawerElement.addEventListener(
          "mousedown",
          previousListeners.onMouseDown!
        );
      }

      if (currentTool.onMouseUp) {
        previousListeners.onMouseUp = currentTool.onMouseUp.bind(currentTool);

        drawerElement.addEventListener("mouseup", previousListeners.onMouseUp!);
      }

      if (currentTool.onMouseMove) {
        previousListeners.onMouseMove =
          currentTool.onMouseMove.bind(currentTool);

        drawerElement.addEventListener(
          "mousemove",
          previousListeners.onMouseMove!
        );
      }
    }

    if (!toolbarEl) {
      return;
    }

    tools.forEach((buttonSettings) => {
      const button = document.createElement("button");
      button.innerHTML = buttonSettings.label;
      button.addEventListener("click", () => {
        switchTool(buttonSettings.tool);

        Array.from(toolbarEl.children).forEach((toolButton) => {
          (toolButton as HTMLElement).style.backgroundColor = "white";
        });

        button.style.backgroundColor = "lightgreen";
      });

      toolbarEl.appendChild(button);
    });
  }

  addTools();

  // // in px
  // const pointsDistance = 30;

  // drawerElement.addEventListener("mousedown", (ev) => {
  //   if (currentTool) nextNewLine = [[ev.clientX, ev.clientY]];
  //   //@ts-ignore
  //   lineDrawer.lines.push(nextNewLine);
  //   drawing = true;
  //   distancePassed = 0;
  // });

  // drawerElement.addEventListener("mouseup", () => {
  //   drawing = false;
  //   prevPoint = undefined;
  //   distancePassed = 0;
  // });

  // drawerElement.addEventListener("mousemove", (ev) => {
  //   if (!drawing) {
  //     return;
  //   }

  //   // if (prevPoint) {
  //   //   const currPoint = [ev.clientX, ev.clientY];

  //   //   const deltaCoords = [
  //   //     currPoint[0] - prevPoint[0],
  //   //     currPoint[1] - prevPoint[1],
  //   //   ];

  //   //   const delta = (deltaCoords[0] ** 2 + deltaCoords[1] ** 2) ** 0.5;

  //   //   if (delta < pointsDistance) {
  //   //     return;
  //   //   }
  //   // }

  //   // prevPoint = [ev.clientX, ev.clientY];

  //   if (!prevPoint) {
  //     prevPoint = [ev.clientX, ev.clientY];
  //   }

  //   const currPoint = [ev.clientX, ev.clientY];

  //   const deltaCoords = [
  //     currPoint[0] - prevPoint[0],
  //     currPoint[1] - prevPoint[1],
  //   ];

  //   const delta = (deltaCoords[0] ** 2 + deltaCoords[1] ** 2) ** 0.5;

  //   distancePassed += delta;

  //   prevPoint = [ev.clientX, ev.clientY];

  //   if (distancePassed < pointsDistance) {
  //     return;
  //   }

  //   distancePassed = 0;

  //   nextNewLine?.push([ev.clientX, ev.clientY]);

  //   console.log(lineDrawer.lines);

  //   lineDrawer.update();

  //   // const newPoint = document.createElement("div");

  //   // newPoint.classList.add("point");

  //   // drawerElement.appendChild(newPoint);

  //   // newPoint.style.left = `${ev.clientX}px`;
  //   // newPoint.style.top = `${ev.clientY}px`;
  // });
});
