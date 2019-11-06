import p2, { Box } from "p2";
import { PIXEL_TO_METR } from "../physics/constants";
import { M2 } from "../shared/M2";
import { Tween } from "@tweenjs/tween.js";
import { BonusObject } from "./BonusObject";
import { GameConfig, PlatformType } from "./GameConfig";

export interface PlatfromTexturePair {
	[index: string]: PIXI.Texture[];
}

export abstract class BasePlatform extends PIXI.Container {
	type: PlatformType;
	child: BonusObject;
	top: number;
	solid: boolean;

	interract(): void {}
	reset(): void {}

	pairBonus(obj: BonusObject) {
		this.child = obj;
	}

	destroy() {
		super.destroy();
		if (this.child) {
			this.child.destroy();
		}
	}
}

export class Platform extends BasePlatform {
	_base: PIXI.Sprite;
	type: PlatformType;

	constructor(pt: PlatformType, textures: PlatfromTexturePair) {
		super();

		let pair = textures[pt];
		if (pair == undefined) {
			pt = PlatformType.NORMAL;
			pair = textures[PlatformType.NORMAL];
		}

		const base = pair[M2.randint(pair.length)];

		this.type = pt;

		this._base = new PIXI.Sprite(base);
		this._base.anchor.set(0.5);
		this.addChild(this._base);

		this.setBody({
			type: p2.Body.STATIC
        });
        this.body.shapes[0].collisionGroup = GameConfig.groups.PLATFORM;
        this.body.shapes[0].collisionMask = GameConfig.groups.PLAYER;
        
		this.solid = true;
	}

	get top() {
		return this.y - this.height * 0.5;
	}
	
	interract(): void {
		let proxy = {
			val: 0
		};

		const delta = 40;
		const start = this._base.y;
		const childStart = this.child ? this.child.y : 0;

		const tween = new Tween(proxy);
		tween
			.to({ val: 1 }, 500)
			.onUpdate(() => {
				const offset = delta * Math.sin(proxy.val * Math.PI * 2) * (1 - proxy.val);
				this._base.y = start + offset;
				if (this.child) {
					this.child.y = childStart + offset;
				}
			})
			.start();
	}

	set solid(v: boolean) {
		if (this.body) {
			this.body.shapes[0].collisionGroup = v ? GameConfig.groups.PLATFORM : GameConfig.groups.NONE;
		}
	}

	get solid() {
		return this.body && this.body.shapes[0].collisionGroup != GameConfig.groups.NONE;
	}

	reset() {}
}
