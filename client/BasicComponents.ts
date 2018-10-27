﻿import {IComponent} from "./Game";
import {config} from "./Init";
import {GameObj} from "./GameObj";
import {Vector2D, Rotation} from "../Interchange/DataStructures";

export const enum Componenets {
    Position = 1, Movement = 2, Sprite = 4, CharacterAnimation = 8,
    Camera = 16, SimpleAnimation = 32, Input = 64, RenderMap = 128, PlayerNetwork = 256,
    CharacterMessage = 512, Health = 1024
}

export class PositionComponent implements IComponent {
    Name = Componenets.Position;
    TilePosition: Vector2D;
    PixelPosition: Vector2D;
    Rotation: Rotation;

    constructor(TilePosX: number, TilePosY: number, rot = Rotation.Down) {
        this.TilePosition = { x: TilePosX | 0, y: TilePosY | 0 };
        this.PixelPosition = { x: this.TilePosition.x * config.TileSize, y: this.TilePosition.y * config.TileSize };
        this.Rotation = rot;
    }

    SetPosition(tilePosX: number, tilePosY: number) {
        this.TilePosition.x = tilePosX;
        this.TilePosition.y = tilePosY;
        this.PixelPosition.x = tilePosX * config.TileSize;
        this.PixelPosition.y = tilePosY * config.TileSize;
    }
}

export class MovementComponent implements IComponent {
    Name = Componenets.Movement;
    IsMoving = false;
    RemoveOnDone = false;
    Speed = 100;
    TargetTilePosition = { x: 0, y: 0 };
    TargetPixelPosition = { x: 0, y: 0 };
    constructor(speed = 100) {
        this.Speed = speed;
    } 

    SetTarget(tileX: number, tileY: number) {
        //if (this.IsMoving) return;
        this.TargetTilePosition.x = tileX;
        this.TargetTilePosition.y = tileY;
        this.TargetPixelPosition.x = tileX * config.TileSize;
        this.TargetPixelPosition.y = tileY * config.TileSize;
        this.IsMoving = true;
    }
}

export class SpriteComponent implements IComponent {
    Name = Componenets.Sprite;
    RenderingSprite: number;
    SpriteOnTilePos: Vector2D;
    constructor(sprite: number, SpriteOnTilePos = { x: 0, y: 0 }) {
        this.RenderingSprite = sprite;
        this.SpriteOnTilePos = SpriteOnTilePos;
    }
}

export class CharacterAnimationComponent implements IComponent {
    Name = Componenets.CharacterAnimation;
    SpriteList: Array<number>;
    CurrSprite = 0;
    TicksPerFrame: number;
    constructor(aliveSpriteList: Array<number>, TicksPerFrame = 5) {
        this.SpriteList = aliveSpriteList;
        this.TicksPerFrame = TicksPerFrame;
    }
}

export class CameraComponent implements IComponent {
    Name = Componenets.Camera;

}

export class InputComponent implements IComponent {
    Name = Componenets.Input;
    TargetedEntitiy: GameObj;
    Experience = 0;
    Level = 1;
    IsAlive = true;
    SetTargetEntity(GameObj) {
        if (this.TargetedEntitiy) {
            (<HealthComponent>this.TargetedEntitiy.ComponentList[Componenets.Health]).IsTargeted = false;
        }
        this.TargetedEntitiy = GameObj
    }

    FreeTargetedEntity() {
        if (this.TargetedEntitiy) {
            (<HealthComponent>this.TargetedEntitiy.ComponentList[Componenets.Health]).IsTargeted = false;
        }
        this.TargetedEntitiy = null;
    }
}

export class RenderMapComponent implements IComponent {
    Name = Componenets.RenderMap;
    Tiles: number[];
    Width: number;
    Height: number;

    constructor(tiles: number[], width: number, height: number) {
        this.Tiles = tiles;
        this.Width = width;
        this.Height = height;
    }
}

export class SimpleAnimationComponent implements IComponent {
    Name = Componenets.SimpleAnimation;
    AnimationList = new Array<number>();
    IsContinuous = false;
    CurrentFrame = 0;
    TicksPerFrame = 4;
    constructor(spriteArray: Array<number>, IsContinous: boolean, TicksPerFrame: number) {
        this.AnimationList = spriteArray;
        this.IsContinuous = IsContinous;
        this.TicksPerFrame = TicksPerFrame;
    }
}

export class CharacterMessageComponent implements IComponent {
    Name = Componenets.CharacterMessage;
    Str = "";
    TextObj = null;

    constructor(str: string) {
        this.Str = str;
    }
}

export class HealthComponent implements IComponent {
    Name = Componenets.Health;
    HP: number;
    MaxHP: number;
    IsTargeted = false;
    constructor(currHP: number, maxHP: number) {
        this.HP = currHP;
        this.MaxHP = maxHP;
    }

    LoseHP(dmg: number) {
        this.HP -= dmg;
    }
}