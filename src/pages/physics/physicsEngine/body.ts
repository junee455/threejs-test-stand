import { Vector3 } from "./types";

export type BodySettings = any & {
  mass: number;
  centerOfMass: Vector3;
};

export type BodySpaceOverrides = any & {
  acceleration: Vector3;
};

export abstract class Body {
  public abstract intersection(): void;
  public overrides: BodySpaceOverrides;
  public settings: BodySettings;
}
