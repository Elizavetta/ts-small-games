import { Body, Circle, vec2 } from 'p2';
import { PIXEL_TO_METR } from '../physics/constants';
import { Assets } from './Assets';
import { PhysicContainer } from '../physics/PhysicContainer';
import { GameConfig } from './GameConfig';
import { BeginContactEvent } from '../physics/p2Events';
import { Boost } from './Boost';
import { BoostType } from './BoostType';

export class Ball extends PIXI.Sprite {

	_speed: number;
	_initialSpeed: number;
	_booster: BoostType = BoostType.NONE;

	constructor(tex: PIXI.Texture) {
		super(tex);
		this.scale.set(0.75);
		this.anchor.set(0.5);

		const shape = new Circle({ radius: tex.width * 0.5 * PIXEL_TO_METR * 0.75 });
		shape.material = null;
		shape.collisionGroup = GameConfig.groups.ball;
		shape.collisionMask = GameConfig.groups.any & ~GameConfig.groups.ball;
		
		this.setBody({
			mass: 1,
			fixedRotation: false,
			damping: 0,
			shape: shape
		});
	}

	push(impulse: {x: number, y: number}) {
		const f :[number, number] = [-impulse.x * PIXEL_TO_METR, -impulse.y * PIXEL_TO_METR];
		this._speed = vec2.len(f);
		this._initialSpeed = this._speed;
		this.body.applyImpulse(f);
	}

	freeze() {
		this.body.velocity = [0,0];
	}

	OnTouch(event: BeginContactEvent) {

		//if(event.bodyA.display instanceof Boost || event.bodyB.display instanceof Boost)
		//	return;

		const eq = event.contactEquations[0];

		let normal :[number, number] = [0, 0];

		if (event.bodyB === this.body) {
			normal = eq.normalA;
		} else {
			normal = [-eq.normalA[0], -eq.normalA[1]];
		}

		const dir = vec2.clone (this.body.velocity);
		vec2.normalize(dir, dir);
		vec2.reflect(dir, dir, normal);

		if(this.booster == BoostType.BOUND){
			this._speed *= 1.25;
			this._speed = Math.min(this._initialSpeed * 5, this._speed);
		}

		this.body.velocity[0] = dir[0] * this._speed;
		this.body.velocity[1] = dir[1] * this._speed;


	}

	scaleSpeed(mult: number = 1) {
		this._speed = this._initialSpeed * mult;

		const len = vec2.len(this.body.velocity);
		this.body.velocity[0] *= this._speed / len;
		this.body.velocity[1] *= this._speed / len;
	}

	set booster (b: BoostType) {
		this._booster = b;
		if(this.booster == BoostType.SPEED) {
			this.scaleSpeed(2);
		} else {
			this.scaleSpeed(1);
		}
		
	}

	get booster() {
		return this._booster;
	}
}

export class BallFabric {
	
	ballTex: PIXI.Texture;
	parent: PhysicContainer;
	balls: Ball[] = [];

	constructor(res: PIXI.IResourceDictionary) {

		const pack = res[Assets.Assets["game-atlas"].name].textures;
		this.ballTex = pack["snowball.png"];
	}

	getBall(pos?:{x: number, y: number}){
		
		const ball = new Ball(this.ballTex);
		ball.zIndex = 100;

		if(pos) {
			ball.position.set(pos.x, pos.y);
			ball.body.update();
		}
		
		this.parent.addChild(ball);
		this.balls.push(ball);
		return ball;
	}

	releaseAll() {
		for(let b of this.balls) {
			if(b) {
				b.destroy();
			}
		}

		this.balls = [];
	}
}