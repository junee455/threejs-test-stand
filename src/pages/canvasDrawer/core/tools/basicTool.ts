import { CanvasDrawer } from "../canvasDrawer";

export interface Tool {
  onMouseMove?: (ev: MouseEvent) => void;
  onMouseDown?: (ev: MouseEvent) => void;
  onMouseUp?: (ev: MouseEvent) => void;
}

export abstract class BasicTool {
  constructor(protected canvas: CanvasDrawer) {}
}
