import { BasePlatform } from "./Platform";
import { Body, Box } from "p2";
import { GameConfig, PlatformType } from "./GameConfig";
import { PIXEL_TO_METR } from "../physics/constants";
import { Tween } from "@tweenjs/tween.js";
import { BonusObjectType } from './BonusObject';

export class BrickablePlatform extends BasePlatform {
	_animation: PIXI.spine.Spine;
	_cloud: PIXI.Sprite;

	constructor(data: PIXI.spine.core.SkeletonData, cloud?: PIXI.Texture) {
		super();

		this._animation = new PIXI.spine.Spine(data);

		this._animation.y += this._animation.height * 0.5;
		this._animation.state.timeScale = 2;
		this.addChild(this._animation);

		if (cloud) {
			this._cloud = new PIXI.Sprite(cloud);
			this._cloud.anchor.set(0.5);
			this._cloud.y = this._cloud.height * 0.5;
			this.addChild(this._cloud);
		}

		this.setBody({
			boundsToShape: false,
			type: Body.STATIC,
			mass: 2,
			shape: new Box({
				width: GameConfig.platformWidth * PIXEL_TO_METR,
				height: GameConfig.platformHeight * PIXEL_TO_METR
			})
		});
		
        this.body.shapes[0].collisionGroup = GameConfig.groups.PLATFORM;
        this.body.shapes[0].collisionMask = GameConfig.groups.PLAYER;

		this.solid = true;
	}
	
	get top() {
		return this.y - this._animation.height * 0.5;
	}

	interract() {
		this.solid = false;
		this.type = PlatformType.DISABLED;
		if (!this.visible) return;

		this._animation.state.setAnimation(0, "Platform 1", false);
		this._animation.state.addListener({
			complete: () => {
				this.visible = false;
			}
		});

		if (this._cloud) {
			new Tween(this._cloud).to({ alpha: 0 }, 0.5 * 1000).start();
		}
		if (this.child) {
			this.child.visible = false;
			this.child.type = BonusObjectType.NONE;
		}
	}

	set solid(v: boolean) {
		if (this.type == PlatformType.DISABLED) return;

		if (this.body) {
			this.body.shapes[0].collisionGroup = v ? GameConfig.groups.PLATFORM : GameConfig.groups.NONE;
		}
	}

	get solid() {
		return this.body && this.body.shapes[0].collisionGroup != GameConfig.groups.NONE;
	}

	reset() {
		super.reset();

		console.log("Platfrom reset");

		this.visible = true;
		this.type = PlatformType.BRICABLE;
		this._animation.state.clearTrack(0);
		this._animation.skeleton.setToSetupPose();

		if (this._cloud) {
			this._cloud.alpha = 1;
		}
		if (this.child) {
			this.child.visible = true;
		}
	}
}
