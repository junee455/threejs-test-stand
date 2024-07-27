import { Vector3 } from "./types";
import {} from "./body"

export type SpaceSettings = any & {
  acceleration: Vector3;
};

export class Space {
  public bodies: Body[];

  public settings: SpaceSettings;

  public simulate() {}
}
