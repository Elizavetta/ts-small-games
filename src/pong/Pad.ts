import { Assets } from './Assets';
import { Body, Line } from 'p2';
import { PIXEL_TO_METR } from '../physics/constants';
import { App } from '..';
import { GameConfig } from './GameConfig';
export enum PadType {
	PLAYER, BOT
}

export class Pad extends PIXI.Sprite {

	_targetX: number;
	safeZone: PIXI.Rectangle;
	speed: number;

	constructor(res: PIXI.IResourceDictionary, type: PadType = PadType.PLAYER) {
		const pack = res[Assets.Assets["game-atlas"].name].textures;
		let tex = pack["Neeo.png"];
		
		if(type == PadType.BOT) {
			tex = pack["penguin.png"];
		}
		
		super(tex);
		this.anchor.set(0.5);
		if(type == PadType.BOT) {
			this.angle = 180;
		}
		
		this.setBody({
			type: Body.KINEMATIC,
			boundsToShape: false
		});

		const shape = new Line({
			length: this.width * PIXEL_TO_METR,
			collisionGroup : GameConfig.groups.any,
			collisionMask : GameConfig.groups.any
		});
		this.body.addShape(shape, [0, this.height * 0.5 * PIXEL_TO_METR]);

		this.speed = GameConfig.playerSpeed;
		this.safeZone = App.instance.size;
	}

	set targetX(x: number) {
		this._targetX = Math.max(this.safeZone.x, Math.min(this.safeZone.right, x));

		const vel = Math.sign(this._targetX - this.x) * this.speed * PIXEL_TO_METR;
		this.body.velocity = [-vel, 0];
	}

	get targetX() {
		return this._targetX;
	}

	update(ticker: PIXI.Ticker) {
		
		if(this._isNear()){
			this.x = this.targetX;
			this.body.velocity = [0,0];
			return;
		}
	}

	_isNear() {
		const delta = Math.abs(this.x - this._targetX);
		return delta < 10;
	}
}