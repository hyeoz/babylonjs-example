import { Schema, type, MapSchema } from "@colyseus/schema";
import { Player } from "../entities/Players";

export class StateHandler extends Schema {
  @type({ map: Player }) players = new MapSchema<Player>();
}
