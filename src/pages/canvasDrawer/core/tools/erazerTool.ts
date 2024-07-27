import { BasicTool, Tool } from "./basicTool";

export class ErazerTool extends BasicTool implements Tool {
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
    this.canvas.redraw();

    this.canvas.ctx.fillStyle = "pink";
    const x = (clientX - this.brushSize / 2) | 0;
    const y = (clientY - this.brushSize / 2) | 0;
    this.canvas.ctx.fillRect(x, y, this.brushSize, this.brushSize);
  }

  public onMouseDown(ev: MouseEvent) {
    this.erasing = true;

    const point = this.canvas.screenCoordsToCanvasCoords(
      ev.clientX,
      ev.clientY
    );

    this.removePointsUnderCursor(...point);

    this.drawBrush(...point);
  }

  public onMouseUp(ev: MouseEvent) {
    this.erasing = false;

    this.canvas.redraw();
  }

  public onMouseMove(ev: MouseEvent) {
    if (!this.erasing) {
      return;
    }

    const point = this.canvas.screenCoordsToCanvasCoords(
      ev.clientX,
      ev.clientY
    );

    this.drawBrush(...point);
    this.removePointsUnderCursor(...point);
  }
}
