import { Splash } from "./Splash";
import { Assets } from "./Assets";
import { Tween } from "@tweenjs/tween.js";
import { GameConfig } from "./GameConfig";
import { GameObject, ObjectType, Movable } from './Object';
import { Obstacle } from './Obstacle';
import { Sand, LineType } from './Line';

enum Direction {
	NONE = "none",
	LEFT = "left",
	RIGHT = "right",
	UP = "up",
	DOWN = "down"
}

const DirectionAnimations = {
	up: "Step up",
	down: "Step down",
	left: "Step left",
	right: "Step right"
} as { [key: string]: string };

const EPSILON = 0.05;

export class Player extends PIXI.Container {

    localPos: PIXI.Point = new PIXI.Point(0,0);
	_splash: Splash;
	_spine: PIXI.spine.Spine;
	_prevDirection: Direction = Direction.NONE;
	_tween: Tween;
    _drowned: boolean = false;
    
    _lastLineType: LineType = LineType.SAND;
    _lastHits: PIXI.DisplayObject[];

    _filter: PIXI.filters.AlphaFilter = new PIXI.filters.AlphaFilter(0.6);
    _movableParent: Movable;

    private _nextSandLine: Sand;
    currentSandLine: Sand;

	constructor(res: PIXI.IResourceDictionary) {
		super();

		this._splash = new Splash(res);

		const rig = res[Assets.Assets.player.name].spineData;
		const b = new PIXI.spine.Spine(rig);
		b.pivot.y -= 60;
		this._spine = b;

		this.addChild(b, this._splash);

        
	}

	move(dir: PIXI.Point) {
		if (this.moved || this._drowned) return;

		let dr = Direction.NONE;
		//console.log(dir);

		if (dir.x < -EPSILON) dr = Direction.LEFT;
		if (dir.x > EPSILON) dr = Direction.RIGHT;

		if (dir.y < -EPSILON) dr = Direction.DOWN;
		if (dir.y > EPSILON) dr = Direction.UP;

        if(dr == Direction.NONE){
            this._setAnim(dr);
            return;
        }
		//disable diagonals
        if (Math.abs(dir.y) > EPSILON) dir.x = 0;
        
        const canMove = this._moveNext(dir);
        if(canMove){
            this._setAnim(dr);
        }
    
	}

	drown() {
		this._drowned = true;
        //this._spine.visible = false;
        this._setAnim(Direction.NONE);
        this._splash.spawn({x:0, y:0} as PIXI.IPoint);
        this._spine.tint = 0x216078;
        this._spine.filters = [this._filter];
        
        const alpha = this._filter.alpha;
        const proxy =  {
            val: 1
        }
        
        new Tween(proxy).to({
            val: 0.1
        }, 1000)

        .onUpdate(()=>{
            this._spine.scale.set(proxy.val);
            this._filter.alpha = proxy.val * alpha;
        }).start();

        this.emit("drown", this);
	}

	reset() {
		this._drowned = false;
        this._spine.visible = true;
        this._spine.tint = 0xffffff;
        this._spine.filters = [];
        this._filter.alpha = 0.3;
        this._spine.scale.set(1);
        this.movableParent = undefined;
        this._nextSandLine = undefined;
		this.currentSandLine = undefined;
		this._lastLineType = LineType.SAND;
	}

	get moved() {
		return this._tween && this._tween.isPlaying();
    }
    
    set movableParent(p: Movable) {
        if(p == this._movableParent) return;

        const last = this._movableParent;
        this._movableParent = p;
        
        if(last) {
            this.localPos.x  += last.x;
            this.localPos.y  += last.y;
        }

        if(p) {
            this.localPos.x -= p.x;
            this.localPos.y -= p.y;
        }

        this._updatePos();
    }

    get movableParent(){
        return this._movableParent;
    }

    _updatePos() {
        this.position.x = this.localPos.x;
        this.position.y = this.localPos.y;
        if(this._movableParent) {
            this.position.x += this.movableParent.x;
            this.position.y += this.movableParent.y;
        }
    }

	update(ticker: PIXI.Ticker) {
        this._splash.update(ticker);
        this._updatePos();
	}

	_setAnim(dir: Direction) {
		if (dir === this._prevDirection) return;

		if (dir == Direction.NONE) {
			this._spine.state.clearTracks();
			this._spine.skeleton.setToSetupPose();
		} else {
			this._spine.state.setAnimation(0, DirectionAnimations[dir], true);
			this._spine.state.timeScale = this._spine.state.getCurrent(0).animation.duration / GameConfig.Duration;
		}

		this._prevDirection = dir;
	}

	_testStep(target: {x: number, y: number}) {
		const self = new PIXI.Rectangle(target.x - 20, target.y - 40, 40, 80);
		let test = new PIXI.Rectangle();

		const all = this.parent.children;
        let hits: PIXI.DisplayObject[] = [];
        
		for (let i = 0; i < all.length; i++) {
            const obj = all[i];
            
            if (obj == this)
                continue;
            
            //соряяян
            obj.getLocalBounds(test);
            test.x += obj.x;
            test.y += obj.y;
            test.width *= obj.scale.x;
            test.height *= obj.scale.y;
            
            if(test.width == 0 || test.height == 0)
                continue;
            
            test.fit(self);
			if (test.width > 0 && test.height > 0) {
				hits.push(obj);
			}

			//release
			test.width = test.height = 0;
        }

        return hits;
    }
    
    _testIsSand(target: PIXI.Point) {

        let pos = this.position.clone();
        pos.x += target.x * GameConfig.StepSand;
        pos.y += target.y * GameConfig.StepSand;
        
        const hits = this._testStep(pos);
        if(hits[0] instanceof Sand) 
            return hits;
        return undefined;
    }

    // НЕ ТРОГАТЬ! ВРОДЕ РАБОТАЕТ
	_moveNext(dir: PIXI.Point) {
        
        let hits = this._testIsSand(dir);
        let target = dir.clone();
        
        //detach from parent
        let lastParent = this.movableParent;
        this.movableParent = undefined;

        let isSand = !!hits;
        if(!isSand || this._lastLineType == LineType.RIVER) {
            
            target.x *= GameConfig.HorizontalStep;
            target.y *= GameConfig.StepRiver;

            hits = this._testStep({
                x: this.x + target.x,
                y: this.y + target.y
            });
        
        } else {
            
            target.x *= GameConfig.HorizontalStep;
            target.y *= GameConfig.StepSand;
        }

        this._lastHits = hits;

        target.x += this.x;
        target.y += this.y;

        let breakAnim = false;
        let forceDrown = false;

        for(let obj of hits) {
            
            if(obj instanceof Obstacle){
                breakAnim = true;
            }
            
            if(obj instanceof Movable) {

				const corr = obj.speed * GameConfig.Duration * GameConfig.RiverSpeed;
				// так как бревно уезжает за это время, то вносим коррекцию
				// но только на движение поперек
				// так как смещения вдоль учитываются в локальных координатах
				target.x -= corr * Math.abs(dir.y);

                const anchor = obj.getNearAnchor(target);
				target.y = anchor.y;
				
				//console.log("target anchor corr" , target.x, anchor.x, corr);
                //каастыль
                if(Math.abs(target.x - anchor.x) <= 0.5 * GameConfig.HorizontalStep 
                    || this._lastLineType == LineType.SAND){
					
					// anchor не учитывает коррекцию
                    target.x = anchor.x + corr;
                
                } else {
                    target.x = anchor.x + GameConfig.StepRiver * dir.x;
                    forceDrown = true;
                }
            }

            if(this._lastLineType == LineType.RIVER){
                if(obj instanceof Sand){
                    target = obj.getAnchor(target);
                    this._nextSandLine = obj;
                }
            }

            isSand = isSand || (obj instanceof Sand);
        }

        this._lastLineType = isSand? LineType.SAND : LineType.RIVER;

        if(breakAnim){
            this.movableParent = lastParent;
            return false;
        }
    

		this.movableParent = undefined;
		
		//target.x -= this.localPos.x;
		//target.y -= this.localPos.y;

        this._tween = new Tween(this.localPos);
		this._tween
			.to(
				{
					x: target.x,// + this.localPos.x,
					y: target.y// + this.localPos.y
				},
				GameConfig.Duration * 1000
            )
            .onComplete(()=>{
                this._postMove(forceDrown);
            })
            .start();
        
        return true;
    }

    _postMove(forceDrown: boolean = false) {
        
        this.currentSandLine = this._nextSandLine;

        if(!this._lastHits || this._lastHits.length == 0 || forceDrown) {
            console.log("Drowing");
            this.drown();
            this.movableParent = undefined;
            return;
        }

        this.movableParent = undefined;
        if(this._lastLineType == LineType.RIVER) {
            for(let o of this._lastHits) {
                if(o instanceof Movable){
                    this.movableParent = o;
                    break;
                }
            }
        }
    }
}
