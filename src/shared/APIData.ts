import { GameApiInterface, GameStateInterface } from "../GameAPI";
import { App } from "../index";
import { BaseGame } from './BaseGame';
export interface ILevel {
	opened: boolean;
	playing: number;
}

export class APIData {
	_name: string;
	_levels: ILevel[] = [
		{
			opened: true,
			playing: 0
		},
		{
			opened: false,
			playing: 0
		},
		{
			opened: false,
			playing: 0
		}
	];

	private _current: number;
	private _loosesAtRun: number;
	private _winsAtRun: number;
	private _apiBridge: GameApiInterface;
	private _inited: boolean;
	private _game: BaseGame;

	constructor(name: string, game: BaseGame) {
		if (!App.instance) {
			throw new Error("Main app must be instanced!");
		}

		this._name = name;
		this._loosesAtRun = 0;
		this._winsAtRun = 0;
		this._apiBridge = App.instance.api;
		this._game = game;
		//this.init();
	}

	init() {
		if (this._inited) return;
		const def = {level : 1, score : 0};

		let data = this._apiBridge.getGameData(this._name);
		data = {...def, ...(data || {})};

		if (data && !data.error) {
			
			if (data.data instanceof Array) {
				for (let i = 0; i < Math.min(data.data.length, this._levels.length); i++) {
					this._levels[i].opened = data.data[i].opened;
					this._levels[i].playing = data.data[i].playing;
				}
				
				this._inited = true;
				return;
			}
			
			for ( let i = 0; i < this._levels.length; i++) {
				this._levels[i].opened = data.level >= i + 1;
				this._levels[i].playing = ~~this._levels[i].opened;	
			}

			this._levels[data.level - 1].playing = 0;
			
		}
		this._inited = true;
	}

	get lastOpenedLevel() {
		this.init();

		let count = 0;
		for (let i = 0; i < this._levels.length; i++) {

			if (this._levels[i].opened)
				count ++;
		}
		return count;
	}

	levelFailed() {
		this._loosesAtRun++;
		this._winsAtRun = 0;

		if (this._current != 0) {
			this._levels[this._current].opened = this._levels[this._current].playing > 0;
		}

		this._apiBridge.setGameData(this._name, {
			level: this.lastOpenedLevel,
			score: (this.lastOpenedLevel - 1) * 200,
			data: this._levels
		});
		this._apiBridge.submitGameState(this._name, {
			type : "other",
			data :  {
				reason : "fail",
				message : "Level failed"
			}
		});

	}

	levelSucsess() {
		this._loosesAtRun = 0;
		this._winsAtRun++;

		this._levels[this._current].playing ++;
		if (this._current + 1 < this._levels.length)
			this._levels[this._current + 1].opened = true;

			
		this._apiBridge.submitGameState(this._name, {
			type : "other",
			data :  {
				reason :  (this._current == this._levels.length - 1) ? "gameComplete" : "success",
				message : "Level success"
			}
		});

		this._apiBridge.setGameData(this._name, {
			level: this.lastOpenedLevel,
			score: (this.lastOpenedLevel - 1) * 2000,
			data: this._levels
		});
		
		
	}
	
	submitLoadingProgress(progress: number, mesg: any) {
		this._apiBridge.submitGameState(this._name, {
			type : "loading",
			progress : progress,
			data :  mesg
		});
	}

	submitState(state: GameStateInterface) {
		this._apiBridge.submitGameState(this._name, state);
	}

	get current() {
		return this._current + 1;
	}

	set current(v: number) {
		this._current = Math.min(this.lastOpenedLevel - 1, v - 1);
	}

	get loosesAtRun() {
		return this._loosesAtRun;
	}
	get winsAtRun() {
		return this._winsAtRun;
	}
}
