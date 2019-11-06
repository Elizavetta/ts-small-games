export class LevelCell extends PIXI.Sprite {
	
	type: number;
	
	neighbours: Array<LevelCell> = [];
	
	private _sscalse: PIXI.IPoint;
	private _start: PIXI.IPoint;
	private _target: PIXI.IPoint;
	private _clone: PIXI.Sprite;
	private _teleportMode: boolean;
	private _needTween: boolean;
	private _highlighted: boolean = true;

	constructor(tex: PIXI.Texture) {
		super(tex);

		this.highlighted = true;
	}

	reset() {
		this.scale.set(1);
		if(this._clone)
			this._clone.scale.set(1);
		
	}

	moveTo(pos: PIXI.IPoint) {
		this._needTween = true;
		this._start = this.position.clone();
		this._target = pos.clone();
		this._teleportMode = false;
	}

	teleportTo(pos: PIXI.IPoint) {
		this._needTween = true;
		this._sscalse = this.scale.clone();

		if (!this._clone) {
			this._clone = new PIXI.Sprite(this.texture);
			this._clone.anchor.copyFrom(this.anchor);
		}
		
		this.highlighted = this.highlighted;

		if (this.parent)
			this.parent.addChildAt(this._clone, 0);

		this._clone.position.copyFrom(this.position);
		this.position.copyFrom(pos);
		this.scale.set(0.01);

		this._teleportMode = true;
	}

	tweenComplete() {
		if (this._teleportMode) {
			this.parent.removeChild(this._clone);
		}
		this._needTween = false;
	}


	set twenning(p: number) {
		if (!this._needTween) return;

		if (this._teleportMode) {
			
			let scale = Math.max(0.01, p * this._sscalse.x);
			this.scale.set(scale);
			this._clone.scale.set(this._sscalse.x - scale);

		} else {
			this.x = this._start.x + p * (this._target.x - this._start.x);
			this.y = this._start.y + p * (this._target.y - this._start.y);
		}
	}

	set highlighted(h: boolean) {
		this.tint = h ?  0xffffff : 0xcccccc;
		if(this._clone){
			this._clone.tint = this.tint;
		}
		this._highlighted = h;
	}

	get highlighted() {
		return this._highlighted;
	}
}
