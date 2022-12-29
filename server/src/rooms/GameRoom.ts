import { Room, Client, ISendOptions } from "colyseus";

import { StateHandler } from "./StateHandler";
import { Player, PressedKeys } from "../entities/Players";
import { Schema } from "@colyseus/schema";

export class GameRoom extends Room<StateHandler> {
  maxClients = 8;

  onCreate(options) {
    this.setSimulationInterval(() => this.onUpdate());
    this.setState(new StateHandler());

    this.onMessage("key", (client, message) => {
      this.state.players.get(client.sessionId).pressedKeys = message;
    });
  }

  onJoin(client) {
    console.log(client.sessionId, "===> JOINED!");

    const player = new Player();
    player.name = `Player ${this.clients.length}`;
    player.position.x = Math.random();
    player.position.y = Math.random();
    player.position.z = Math.random();

    this.state.players.set(client.sessionId, player);
  }

  onUpdate() {
    this.state.players.forEach((player, sessionId) => {
      // console.log(sessionId);

      player.position.x += player.pressedKeys.x * 0.1;
      player.position.z -= player.pressedKeys.y * 0.1;
    });
  }

  onLeave(client: Client) {
    console.log(client.sessionId, "===> LEAVED!");
    this.state.players.delete(client.sessionId);
  }

  onDispose() {}
}
