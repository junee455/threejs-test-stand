import { Point2, Line } from "./primitives";

export interface Primitive {
  render: (ctx: CanvasRenderingContext2D) => void;
}

export class CanvasDrawer {
  public ctx: CanvasRenderingContext2D;

  public primitives: Primitive[];

  public lines: Line[] = [];
  public points: Point2[] = [];

  public pivotPoint: Point2 = [0, 0];
  public scale: number = 1;

  constructor(private canvas: HTMLCanvasElement) {
    this.ctx = canvas.getContext("2d") as CanvasRenderingContext2D;

    canvas.setAttribute("height", window.innerHeight.toString());
    canvas.setAttribute("width", window.innerWidth.toString());

    canvas.addEventListener("wheel", (ev) => {
      if (ev.ctrlKey) {
        const prevPoint = this.screenCoordsToCanvasCoords(
          ev.clientX,
          ev.clientY
        );

        ev.preventDefault();
        ev.stopPropagation();

        console.log(ev.deltaY);

        this.scale = this.scale * 10 ** (-ev.deltaY / 10000);

        const nextPoint = this.screenCoordsToCanvasCoords(
          ev.clientX,
          ev.clientY
        );

        const delta = [
          (nextPoint[0] - prevPoint[0]) * this.scale,
          (nextPoint[1] - prevPoint[1]) * this.scale,
        ];

        this.pivotPoint = [
          this.pivotPoint[0] + delta[0],
          this.pivotPoint[1] + delta[1],
        ];

        this.redraw();
      }
    });

    canvas.addEventListener("mousemove", (ev) => {
      // console.log(ev.buttons ^ 4);
      const middlePressed = !(ev.buttons ^ 4);

      if (middlePressed) {
        console.log(ev);
        this.pivotPoint = [
          this.pivotPoint[0] + ev.movementX,
          this.pivotPoint[1] + ev.movementY,
        ];

        this.redraw();
      }
    });
  }

  public screenCoordsToCanvasCoords(x: number, y: number): Point2 {
    const scale = 1 / this.scale;

    return [(x - this.pivotPoint[0]) * scale, (y - this.pivotPoint[1]) * scale];
  }

  public addLine(line: Line) {
    this.lines.push(line);
    this.redraw();
  }

  public addPoint(point: Point2) {
    this.points.push(point);
    this.redraw();
  }

  public redraw() {
    const { ctx } = this;

    ctx.resetTransform();

    ctx.translate(...this.pivotPoint);
    ctx.scale(this.scale, this.scale);

    this.clear();

    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 2;
    ctx.fillStyle = "blue";

    const pointSize = 4 * this.scale;

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
    const from = this.screenCoordsToCanvasCoords(0, 0);
    const to = this.screenCoordsToCanvasCoords(
      this.canvas.width,
      this.canvas.height
    );

    this.ctx.fillStyle = "black";
    this.ctx.clearRect(...from, to[0] - from[0], to[1] - from[1]);

    // this.ctx.clearRect(...from, ...to);
  }
}