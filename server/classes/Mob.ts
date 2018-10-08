﻿import "../../Interchange/DataStructures";
import {Character, CharacterDataToSync} from "./Character";
import {config, ground} from "../GameState";
import {socketServer} from "../Server";
import {GetDistance} from "../Geometry";
import {Vector2D, MoveData, Rotation} from "../../Interchange/DataStructures";

var startSprites = ["Orc", "Minotaur", "Troll", "Dwarf"];




export class Mob implements Character {
    private syncData = new CharacterDataToSync(startSprites[(Math.random() * 4) | 0]);
    private lastMoveTime = 0;
    private moveDelay = 35000 / this.syncData.Speed;
    private LastAttackTime = 0;
    private AttackDelay = 850;
    private targetChar: Character;
   // private IsDead = false;

    constructor(pos: Vector2D) {
        this.syncData.Position = pos;
    }

    Move(data: MoveData) {
        if (!this.CanMove()) return;
        ground.FreeCollision(this.syncData.Position.x, this.syncData.Position.y);
        this.syncData.Position.x = data.Pos.x;
        this.syncData.Position.y = data.Pos.y;
        ground.SetCollision(this.syncData.Position.x, this.syncData.Position.y);
        socketServer.emit("CharacterMove", { ID: this.syncData.ID, Data: data });
        this.lastMoveTime = Date.now();
    }

    MoveDir(rot: Rotation) {
        var tmpPos = { x: this.syncData.Position.x, y: this.syncData.Position.y };
        if (rot === Rotation.Left) {
            tmpPos.x--;
        }
        if (rot === Rotation.Top) {
            tmpPos.y--;
        }
        if (rot === Rotation.Right) {
            tmpPos.x++;
        }
        if (rot === Rotation.Down) {
            tmpPos.y++;
        }

        var data = { Rot: rot, Pos: tmpPos };
        this.Move(data);
    }

    GetJSON() {
        return this.syncData.toJSON();
    }

    GetID(): string {
        return this.syncData.ID;
    }

    Dispose() {
        socketServer.emit("DeleteCharacters", [this.syncData.ID]);
        ground.FreeCollision(this.syncData.Position.x, this.syncData.Position.y);
    }

    SelfAnnouce() {
        socketServer.emit("NewCharacters", [this.GetJSON()]);
        ground.SetCollision(this.syncData.Position.x, this.syncData.Position.y);
    }

    Target(char: Character) {
        this.targetChar = char;
    }

    Untarget() {
        this.targetChar = null;
    }

    GetHP(): number {
        return this.syncData.HP;
    }

    AttackTarget() {
        if (!this.targetChar) return;
        if (this.targetChar.GetHP() < 0) {
            this.Untarget();
            return;
        }
        if (!this.CanAttack()) return;
        var dist = GetDistance(this.syncData.Position, this.targetChar.GetJSON().Position);
        if (dist > 1.5) return;
        var dmg = Math.random() * 5 | 0 + 1;
        this.targetChar.Hit(dmg);
    
        this.LastAttackTime = Date.now();
    }


    Hit(dmg: number): { Exp: number } {
        socketServer.sockets.emit("ApplyDommage", { AttackType: 0, TargetID: this.syncData.ID, HitPoints: dmg });
        this.syncData.HP -= dmg;
        if (this.syncData.HP < 0) {
            this.Kill();
            return { Exp: this.syncData.ExpAtDead };
        }

       
    }

    Kill() {
        this.Dispose();
        socketServer.sockets.emit("Animation", { Sprites: config.Mobs[this.GetJSON().Race].DeadSprites, Pos: this.syncData.Position, TicksPerFrame: 100 });
    }

    IsDead() {
        return this.syncData.HP < 0;
    }

    MoveByVector(desiredMoveV: Vector2D) {
        if (!this.CanMove()) return;
        var dataArr = new Array<any>(4);
        var radians = Math.atan2(desiredMoveV.y, desiredMoveV.x);
        dataArr[Rotation.Left] = ({
            can: ground.GetCollision(this.syncData.Position.x - 1, this.syncData.Position.y),
            desire: Math.cos(radians)
        });
        dataArr[Rotation.Down] = ({
            can: ground.GetCollision(this.syncData.Position.x, this.syncData.Position.y + 1),
            desire: Math.cos(radians + (Math.PI / 2))
        });
        dataArr[Rotation.Right] = ({
            can: ground.GetCollision(this.syncData.Position.x + 1, this.syncData.Position.y),
            desire: Math.cos(radians + Math.PI)
        });
        dataArr[Rotation.Top] = ({
            can: ground.GetCollision(this.syncData.Position.x, this.syncData.Position.y - 1),
            desire: Math.cos(radians + (Math.PI / 2 * 3))
        });

        var mostdesire = -1;
        var result = -1;
        for (var i = 0; i < 4; i++) {
            if (!dataArr[i].can && dataArr[i].desire > -0.1) {
                if (dataArr[i].desire > mostdesire) {
                    result = i;
                    mostdesire = dataArr[i].desire;
                }
            }
        }

        if (result !== -1) {
            this.MoveDir(result);
        }
    }

    IdleMoving() {
        if (!this.CanMove()) return;
        if (Math.random() > 0.95) {
            this.MoveByVector({ x: Math.sin(Math.random() * Math.PI * 2), y: Math.sin(Math.random() * Math.PI * 2) });
        }
    }

    CanMove() {
        return ((Date.now() - this.lastMoveTime) > this.moveDelay) && !this.IsDead();
    }

    CanAttack() {
        return ((Date.now() - this.LastAttackTime) > this.AttackDelay) && !this.IsDead();
    }
}
