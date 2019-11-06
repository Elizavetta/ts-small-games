import { Utils } from "./Utils";
import { Button } from "./Button";
import { AnimatedPopup } from './AnimatedPopup';

export enum PopupType {
	START = "start",
	LOSE = "lose",
	WIN = "win"
}

export class PopupDifficulty extends AnimatedPopup {
	levelButtons: Button[];
	exitButton: Button;
	_titles: {[ke: string] : PIXI.Sprite};

	constructor(ref: TiledOG.TiledContainer) {

		const popup = Utils.findOn<TiledOG.TiledContainer>(ref, "popup");
		super(popup, {
			buttons : [
				"menu",
				"level-0",
				"level-1",
				"level-2",
			],
		});

		this.levelButtons = [];
		
		for(let i = 0; i < 3; i++ ) {
			let btn = this.buttons["level-" + i ];
			this.levelButtons[i] = btn;
		}

		for(let b in this.buttons) {
			this.buttons[b].on('b-click', ()=>{
				console.log(b)
			});
		}

		this.exitButton = this.buttons['menu'];

		const titles = [PopupType.WIN, PopupType.LOSE, PopupType.START];

		this._titles = {};
		for (var t of titles) {
			this._titles[t] = this.getChildByPath(`title-${t}`);
		}

		const bg = this.getChildByPath<PIXI.Container>("bg");
		this.pivot.x = bg.x + (bg.width >> 1);
		this.pivot.y = bg.y - (bg.height >> 1);
	}

	show(type: PopupType = PopupType.START,
			immediate: boolean = false) : Promise<void> {

		for (const key in this._titles) {
			this._titles[key].visible = type == key;
		}

		return super.open(immediate);
	}

	reset() {
		super.reset();
		this.close(true);

		this.removeAllListeners();
		for (const name in this.buttons) {
			this.buttons[name].reset();
		}

		this.levelButtons.forEach((v, i)=>{
			const index = i + 1;
			v.on("b-click", ()=>{
				this.emit("level-click", index);
			});
		});

		this.interactiveChildren = true;
	}

	setOpenedLevel(level: number) {
		for (let i = 0; i < this.levelButtons.length; i++) {
			this.levelButtons[i].disabled = i + 1 > level;
		}
	}

	applyTranslation(btns : string[]) {
		
		for(let i = 0 ; i < 3; i++) {
			const btn = this.buttons['level-' + i];
			const txt = btns[i];
			if(btn && txt)
				btn._text.text = txt;
		}
	}
}