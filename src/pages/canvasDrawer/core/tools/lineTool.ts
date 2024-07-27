import { BasicTool, Tool } from "./basicTool";

import { Line, Point2 } from "../primitives";

export class LineTool extends BasicTool implements Tool {
  private currentLine?: Line;

  private pixelsPassed = 0;
  private prevPoint?: Point2;

  private segmentDistance = 10;

  public onMouseMove(ev: MouseEvent) {
    if (!this.currentLine || !this.prevPoint) {
      return;
    }

    if (ev.buttons ^ 1) {
      return;
    }

    const point = this.canvas.screenCoordsToCanvasCoords(
      ev.clientX,
      ev.clientY
    );

    const lastPoint = this.currentLine.slice(-1)[0];

    const delta =
      ((this.prevPoint[0] - point[0]) ** 2 +
        (this.prevPoint[1] - point[1]) ** 2) **
      0.5;

    this.pixelsPassed += delta;

    this.prevPoint = [...point];

    if (this.pixelsPassed >= this.segmentDistance) {
      this.currentLine.push([...point]);
      this.pixelsPassed = 0;
    } else {
      lastPoint[0] = point[0];
      lastPoint[1] = point[1];
    }

    this.canvas.redraw();
  }

  public onMouseDown(ev: MouseEvent) {
    if (ev.buttons ^ 1) {
      return;
    }

    const point = this.canvas.screenCoordsToCanvasCoords(
      ev.clientX,
      ev.clientY
    );

    this.currentLine = [[...point], [...point]];
    this.prevPoint = [...point];

    this.pixelsPassed = 0;

    this.canvas.addLine(this.currentLine);
  }

  public onMouseUp() {
    this.currentLine = undefined;
  }
}
