import { BasicTool, Tool } from "./basicTool";

export class PointTool extends BasicTool implements Tool {
  public onMouseDown(ev: MouseEvent) {
    const point = this.canvas.screenCoordsToCanvasCoords(
      ev.clientX,
      ev.clientY
    );

    this.canvas.addPoint(point);
  }
}