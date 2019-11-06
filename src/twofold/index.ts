import { BaseGame, GameState } from '../shared/BaseGame';
import { APIData } from '../shared/APIData';
import { App } from "..";
import { PhysicContainer } from '../physics/PhysicContainer';
import { Assets } from './Assets';
import { GameConfig, ILevelData } from './GameConfig';
import { M2 } from "../shared/M2";
import { PopupType } from '../shared/ui/Popup';
import { UiManager } from '../shared/ui/UiManager';
import { IUIListener, IPopup } from '../shared/ui/IUIListener';
import { LevelBuilder } from './LevelBuilder';
import { LevelView } from "./LevelView";
import { Contract, IContractData } from './Contract';
import { Tween } from '@tweenjs/tween.js';

export class Twofold extends BaseGame implements IUIListener{

	ui: UiManager;
	tex: PIXI.ITextureDictionary;
	stage: PIXI.Container;
	physics: PhysicContainer;
	res: PIXI.IResourceDictionary;
	levelData: ILevelData;
	bg: PIXI.Sprite;
	builder: LevelBuilder;
	level: LevelView;
	contracts: Array<Contract> = [];

	constructor() {
		super();
		
		this.apiData = new APIData("Twofold", this);
		this.stage = new PIXI.Container();
		this.loader = new PIXI.Loader(Assets.BaseDir);
	}

	init(app: App){
		this.app = app;
        this.lang = this.app.multilang.getTextBase('Twofold');
		// IMPORTANT
		app.renderer.plugins.interaction.moveWhenInside = true;

		this.gameState.on("enter", this.onStateEnter, this);
		
		this.ui = this.app.uiManager;

		this.ui.setOptions({
			showArrows: false,
			showProgress: false,
			level: this.apiData.lastOpenedLevel,
			levelHint: this.lang.levels[0],
			progressHint: this.lang.progress[0],
		});

		this.ui.popup.show(PopupType.START, true);
		this.res = this.loader.resources;

		this.builder = new LevelBuilder(this.res[Assets.Assets["game-atlas"].name].textures);
		
		this.level = new LevelView();

		this.bg = new PIXI.Sprite(this.res["bg0"].texture);
		this.bg.width = app.width;
		this.bg.height = app.height;


		this.stage.addChild(this.bg, this.level);
		
		this.app.uiManager.hint.open(this.lang.hello);

		super.init(app);
		super.start();
	}

	preload(): PIXI.Loader {
		
		//@ts-ignore
		this.loader.add(Object.values(Assets.Assets));
		return super.preload();
	}

	reset() {

	}

	// --- UI Listener impementing

	setLevel(level: number): void {
		this.apiData.current = level;
		this.levelData = GameConfig.levels[level - 1];
		this.bg.texture = this.res["bg" + (level - 1)].texture;
		this.reset()

		this.level = this.builder.build(GameConfig.levels[level - 1], this.level);
	
		this.level.scale.set((this.app.width - GameConfig.arrowOffset) / this.level.width);
		this.level.x = this.app.width  / 2;
		this.level.y = Math.max(this.level.height * 0.5 + 500, this.app.height * 0.5);
		
		this.level.off("oncontractsupdated", this.updateContracts, this);
		this.level.on("oncontractsupdated", this.updateContracts, this);

		this.updateContracts(this.level.contracts);
		this.gameState.current = GameState.GAME;
	}

	updateContracts(contr: Array<IContractData>) {

		
		this.ui.progress = this.level.totalContractsScore;

		if(this.level.totalContractsScore >= this.level.totalContractsAmount)
		{
			this.gameState.current = GameState.PREWIN;
			return;
		}

		this.contracts.forEach(e => e.destroy());
		this.contracts = [];

		for(let i = 0;  i < contr.length; i++) {

			const ctr = this.builder.createContract(contr[i]);
			
			const tx = 100 + i * 100
			ctr.x = -100;
			ctr.y = 320;

			new Tween(ctr.position)
				.to({
					x: tx
				}, 250)
				.start();

			this.contracts.push(ctr);
		}

		if(contr.length > 0)
			this.stage.addChild(...this.contracts);

	}

	reload(): void {
		this.setLevel(this.apiData.current);
	}

	popupOpened(popup: IPopup): void {
		
		if(popup == IPopup.MENU){
			this.app.uiManager.setOptions({
				showArrows: false,
				level: this.apiData.lastOpenedLevel
			});
		}
	}
	
	softPause(): boolean {
		this.level.pause();
		return super.softPause();
	}
	// --- End

	onStateEnter(state: GameState) {
		switch(state) {

			case GameState.PRE: {

				this.ui.setOptions({
					showProgress: false,
					progress : 0,
					level : this.apiData.lastOpenedLevel
				});
				this.ui.popup.show(PopupType.START);
				break;
			}

			case GameState.GAME: {

				this.ui.setOptions({
					showProgress: true,
					progress : 0,
					level : this.apiData.current,
					progressMax: this.level.totalContractsAmount
				});
				this.ui.progress = 0;
				break;
			}

			case GameState.PREWIN: {

				this.apiData.levelSucsess();
				this.ui.setOptions({
					showProgress: false,
					progress : 0,
					level : this.apiData.lastOpenedLevel
				});
				
				this.ui.popup.show(PopupType.WIN);
				this.gameState.current = GameState.WIN;

				break;	
			}

			case GameState.WIN: {
				
				setTimeout(()=>{
					if(this.gameState.current !== GameState.WIN)
						return;
					this.ui.hint.open(this.lang.endings)
				}, 1000);
				

				break;
			}
			case GameState.LOSE: {

				this.apiData.levelFailed();
				this.ui.setOptions({
					showProgress: false,
					progress : 0,
					showArrows: false,
					level : this.apiData.lastOpenedLevel
				});

				this.ui.popup.show(PopupType.LOSE);
				
				setTimeout(()=>{
					if(this.gameState.current !== GameState.LOSE)
						return;
					let three = this.apiData.loosesAtRun % 3 == 0 && this.apiData.loosesAtRun > 0;
					this.ui.hint.open(three ?  this.lang.falling_3times  : this.lang.falling);
				}, 1000);
				break;
				
			}
		}
	}

	// its real pause, when tab changed
	pause(): void {
		this.app.uiManager.onPause();
		super.pause();
	}

	// real resume
	resume(): void {
		
		this.app.uiManager.onResume();
		super.resume();
	}

	update(ticker: PIXI.Ticker): void {
		if(this._isPaused)
			return;
		
		if(this.gameState.current == GameState.GAME)
		{

		}

	}
}
