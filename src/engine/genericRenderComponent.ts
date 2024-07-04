import * as Utils from ".";

export interface IRenderComponent {
  componentSetup(context: Utils.ThreeContext): void;
  componentCleanup(context: Utils.ThreeContext): void;
  onRender(context: Utils.IThreeContext): void;
  enabled: boolean;
}

export abstract class GenericRenderComponent implements IRenderComponent {
  enabled = true;

  componentSetup(context: Utils.ThreeContext): void {
    context.addComponent(this);
  }

  componentCleanup(context: Utils.ThreeContext): void {
    context.removeComponent(this);
  }

  abstract onRender(context: Utils.ThreeContext): void;
}
