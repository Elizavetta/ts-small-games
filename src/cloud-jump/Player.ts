import { Box, Body } from "p2";
import { PIXEL_TO_METR } from "../physics/constants";
import { Assets } from "./Assets";
import { GameConfig } from './GameConfig';
import {Shape} from 'p2';

export enum PlayerAnimPhase {
	NONE = "none",
	JUMP = "Jump",
	LOSE = "Lose",
	WIN = "Win",
	DAMAGE = "Damage"
}

const SIZE = {
	width: 124,
	height: 190
};

export class Player extends PIXI.Container {
	anim: PIXI.spine.Spine;
	sensorShape: p2.Shape;
	jumpVel: number;
	startHeight: number;

	private _jumpMult: number;
	private _jumpAffectApplyed: boolean;

	private _animPhase: PlayerAnimPhase;
	private _damaged: boolean;
	lockMovement: boolean;

	constructor(res: PIXI.IResourceDictionary) {
		super();

		this._jumpMult = 1;
		this._jumpAffectApplyed = false;

		this.lockMovement = false;
		this.pivot.set(SIZE.width * 0.5, SIZE.height * 0.5);

		this._animPhase = PlayerAnimPhase.JUMP;
		const animData = res[Assets.Assets.player.name].spineData;
		const anim = new PIXI.spine.Spine(animData);

		anim.position.set(SIZE.width * 0.5, SIZE.height);
		anim.state.timeScale = 0.75;
		this.anim = anim;

		//anim.state.setAnimation(0, AnimPhase.JUMP, true);

		this.setBody({
			fixedRotation: true,
			mass: 10,
			boundsToShape: false,
			shape: new Box({
				width: SIZE.width * PIXEL_TO_METR,
				height: SIZE.height * PIXEL_TO_METR
			})
		});

		const sensor = new Box({
			width: SIZE.width * PIXEL_TO_METR,
			height: 10 * PIXEL_TO_METR
		});
		sensor.sensor = true;
		//this.body.addShape(sensor, [0, -SIZE.height * 0.5 * PIXEL_TO_METR]);
		//this.sensorShape = sensor;

		this.addChild(anim);

		this.body.shapes.forEach((shape: Shape) => {
			shape.collisionMask = GameConfig.groups.ANY;
			shape.collisionGroup = GameConfig.groups.PLAYER;
		});

		this.startHeight = this.height;
	}

	set face(v: number) {
		if (v > 0) {
			this.anim.scale.x = 1;
		} else if (v < 0) {
			this.anim.scale.x = -1;
		}
	}

	reset() {
		this.animPhase(PlayerAnimPhase.NONE);
		this._damaged = false;
		this.canCollide = true;
		this.lockMovement = false;
	}

	animPhase(phase: PlayerAnimPhase, loop: boolean = false) {
		if (phase == PlayerAnimPhase.NONE) {
			this.anim.state.setEmptyAnimation(0, 0);
			return;
		}
		this.anim.state.setAnimation(0, phase, loop);
	}

	update() {}

	damaged() {
		this._damaged = true;
		this.lockMovement = true;
		this.canCollide = false;
		this.jump();
		this.animPhase(PlayerAnimPhase.DAMAGE, false);
	}

	set canCollide(v: boolean) {
		v = v && !this._damaged;
		this.body.shapes[0].collisionMask = v ? GameConfig.groups.ANY : GameConfig.groups.BORDER;
		//this.body.shapes[1].collisionMask = v ? GameConfig.groups.ANY : GameConfig.groups.BORDER;
	}

	get canCollide() {
		return this.body.shapes[1].collisionGroup != 0;
	}

	jump() {
		if (this.jumpVel <= 0) throw Error("JumpVel must be >0");

		if (this._jumpAffectApplyed) {
			this._jumpMult = 1;
			this._jumpAffectApplyed = false;
		}

		const vel = this.body.velocity[1];
		this.body.applyImpulse([0, (this.jumpVel * this._jumpMult - vel) * this.body.mass]);
		this.animPhase(PlayerAnimPhase.JUMP);

		this._jumpAffectApplyed = this._jumpMult !== 1;
	}

	applyJumpMutiplier(v: number) {
		this._jumpMult = v;
		this._jumpAffectApplyed = false;
	}

	applyStrave(v: number) {
		this.body.velocity[0] = GameConfig.playerMove * PIXEL_TO_METR * v;
	}

	move(v: number) {
		//clamping!
		this.body.velocity[1] = Math.min(this.jumpVel * this._jumpMult, this.body.velocity[1]);
		this.face = v;

		if (this.lockMovement) return;
		this.applyStrave(Math.min(1, Math.max(v, -1)));
	}

	freeze(v: boolean) {
		if (v) {
			this.body.sleep();
		} else {
			this.body.wakeUp();
		}
	}
}
