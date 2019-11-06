import { Assets } from './Assets';
import { GameConfig } from './GameConfig';

export enum ObjectType {
	OBSTACLE = "obstacle",
	MOVABLE = "walkable",
	NONE = "none"
}

export enum ObstacleVariant {
	STONE = "stone",
	RAAD = "raad",
	BUSH = "bush"
}

export enum MovableVariant {
	TIMBER = "timber",
	TURTLE = "turtle"
}

export const VARIAN2TEXTURE = {
	[ObstacleVariant.STONE]: "stone.png",
	[ObstacleVariant.RAAD]: "raad.png",
	[ObstacleVariant.BUSH]: "bush.png"
};

export interface GameObject {
	type: ObjectType;
	variant: ObstacleVariant | MovableVariant;
}

export class Movable extends PIXI.Container implements GameObject {
	type: ObjectType = ObjectType.MOVABLE;
	variant: ObstacleVariant | MovableVariant;
	speed: number;
	_anchors: PIXI.Point[] = [new PIXI.Point(0,0)];

	getNearAnchor(point: PIXI.Point) {
		
		let min = 1000;
		let anchor;
		const spos = this.position;

		for(let a of this._anchors) {
			const copy = a.clone()
			copy.x += spos.x;
			copy.y += spos.y;

			const m = Math.abs(copy.x - point.x);
			if(m < min) {
				anchor = copy;
				min = m;
			}
		}

		return anchor;
	}
}

export class Timber extends Movable {
	_sprite: PIXI.Sprite;
	varaint: MovableVariant = MovableVariant.TIMBER;
	speed: number = 1;

	constructor(res: PIXI.IResourceDictionary){
		super()
		const atlas = res[Assets.Assets["game-atlass"].name].textures;
		this._sprite = new PIXI.Sprite(atlas["timber.png"]);
		
		this._sprite.anchor.set(0.5);
		this.addChild(this._sprite);

		for(let i = 0; i < 3; i++) {
			this._anchors[i] = new PIXI.Point( (i - 1) * GameConfig.LineHeight, 0);
		}
	}
}

export class Turtle extends Movable {

	_spine: PIXI.spine.Spine;
	varaint: MovableVariant = MovableVariant.TURTLE;
	_speed: number = 1;
	
	constructor(res: PIXI.IResourceDictionary){
		super();

		const rig = res[Assets.Assets.turtle.name].spineData;
		this._spine = new PIXI.spine.Spine(rig);
		this._spine.pivot.y = -this._spine.width >> 1;
		this._spine.angle = 90;
		this._spine.state.setAnimation(0, "Move", true);

		this.addChild(this._spine);
	}

	set speed(v: number) {
		this._spine.angle = 90 * Math.sign(v);
		this._spine.state.timeScale = Math.abs(v * 0.5);
		this._speed = v;
	}
	get speed() {
		return this._speed;
	}
}