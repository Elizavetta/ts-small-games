import { BaseGame, GameState } from '../shared/BaseGame';
import { PhysicContainer } from "../physics/PhysicContainer";
import { Box, Body } from "p2";
import { Background } from "./Background";
import { Assets } from "./Assets";
import { Pad, PadType } from "./Pad";
import { BallFabric, Ball } from "./Ball";
import { PIXEL_TO_METR, METR_TO_PIXEL } from "../physics/constants";
import { APIData } from "../shared/APIData";
import { GameConfig } from "./GameConfig";
import { App } from "..";
import { BoostView } from "./Boost";
import { BoostType } from "./BoostType";
import { Tween } from "@tweenjs/tween.js";
import { BeginContactEvent } from "../physics/p2Events";
import { IUIListener, IPopup } from '../shared/ui/IUIListener';
import { UiManager } from '../shared/ui/UiManager';
import { PopupType } from '../shared/ui/Popup';
import { M2 } from '../shared/M2';

export class Pong extends BaseGame implements IUIListener {
	

	private physic: PhysicContainer;
	private botWinnings : number = 0;
	private playerWinnings: number = 0;

	private ui: UiManager;
	private boostManager: BoostView;

	private _bot: Pad;
	private _player: Pad;
	private _back: Background;
	private _spawner: BallFabric;
	private _ballSpeed = 2;
	
	
	constructor() {
		super();
		
		this.apiData = new APIData("Pong", this);
		this.stage = new PIXI.Container();
		this.physic = new PhysicContainer({ gravity: [0, 0] });

		this.physic.world.defaultContactMaterial.friction = 0;

		this.loader = new PIXI.Loader(Assets.BaseDir);
	}

	preload(): PIXI.Loader {
		//@ts-ignore
		this.loader.add(Object.values(Assets.Assets));
		return super.preload();
	}

	init(app: App): void {
		super.init(app);
		
		this.lang = this.app.multilang.getTextBase('Pong');
		this.gameState.on("enter", this.onStateEnter, this);

		this.ui = this.app.uiManager;
		this.ui.setOptions({
            showArrows: false,
            showProgress: false,
			level: this.apiData.lastOpenedLevel,
			levelHint: this.lang.levels[0],
            progressHint: this.lang.progress[0],
		});

		const res = this.loader.resources;
		this.boostManager = new BoostView(res);
		this.boostManager.x = app.width - 200;
		this.boostManager.y = 200;

		//this._boostView.activate(BoostType.SPEED, 4);

		this._back = new Background(res);
		this._back.height = app.height;

		this._spawner = new BallFabric(res);
		this._spawner.parent = this.physic;

		this._bot = new Pad(res, PadType.BOT);
		this._player = new Pad(res, PadType.PLAYER);

		this._bot.x = this._player.x = app.width * 0.5;
		this._player.y = app.height - this._player.height * 0.5 - GameConfig.padding.bottom;
		this._bot.y = this._bot.height * 0.5 + GameConfig.padding.top;

		//b.push({x: 100, y: 100})

		this.stage.interactive = true;
		this.stage.on("mousemove", this.move, this);
		this.stage.on("touchmove", this.move, this);

		let borders = [];

		for (let i = 0; i < 2; i++) {
			const b = new PIXI.DisplayObject();
			b.x = i * app.width;
			b.y = app.height * 0.5;

			b.setBody({
				type: Body.STATIC,
				shape: new Box({
					width: 10 * PIXEL_TO_METR,
					height: app.height * PIXEL_TO_METR,
					collisionGroup: GameConfig.groups.any,
					collisionMask: GameConfig.groups.any
				} as any)
			});
			borders.push(b);
		}

		this.physic.addChild(...borders, this._player, this._bot);

		//this.spawnBoost({ x: 400, y: 400 }, BoostType.BOUND, 5);

		this.physic.world.on("beginContact", this.beginContact, this);

		this.stage.addChild(this._back, this.physic as PIXI.Container, this.boostManager);

		// open leevel view
		this.gameState.current = GameState.PRE;
		this.ui.hint.open(this.lang.hello);
	}

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
					showArrows: false,
					level : this.apiData.current,
					progressMax: 3
				});
				this.ui.progress = 0;
				break;
			}

			case GameState.PREWIN: {
				this.gameState.current = GameState.WIN;
				break;	
			}

			case GameState.WIN: {
				this.apiData.levelSucsess();
				this.ui.setOptions({
					showProgress: false,
					progress : 0,
					showArrows: false,
					level : this.apiData.lastOpenedLevel
				});
				
				this.ui.popup.show(PopupType.WIN);
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

	beginContact(event: BeginContactEvent) {
		if ((event.bodyA.display as any).OnTouch) {
			(event.bodyA.display as any).OnTouch(event);
		}

		if ((event.bodyB.display as any).OnTouch) {
			(event.bodyB.display as any).OnTouch(event);
		}
	}

	spawnBoost(pos: { x: number; y: number }, type: BoostType, dur: number) {
		const b = this.boostManager.spawn(pos, type, dur);
		b.body.shapes[0].sensor = true;
		b.scale.set(0.1);
		this.stage.addChild(b);

		const proxy = {
			val: 0.1
		};

		new Tween(proxy)
			.to({ val: 1 }, 200)
			.onUpdate(() => {
				b.scale.set(proxy.val);
			})
			.onComplete(() => {
				b.body.shapes[0].sensor = false;
				//b.push({x: 100, y: 100});
			})
			.start();
		//
	}

	spawnBall(pushDelay: number) {
		const b = this._spawner.getBall(new PIXI.Point(this.app.width * 0.5, this.app.height * 0.5));
		
		setTimeout(() => 
			{
				b.push({x: this._ballSpeed * METR_TO_PIXEL, y: this._ballSpeed * METR_TO_PIXEL});
			}, pushDelay);
	}

	setLevel(level: number): void {
		this.reset(true);
		this.apiData.current = level;
		this.gameState.current = GameState.GAME;
		
		this.spawnBall(1000);
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
		return super.softPause();
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

	reset(full : boolean) {
		this._spawner.releaseAll();
		this._bot.x = this._player.x = this.app.width * 0.5;
		if(full) {
			this.botWinnings = this.playerWinnings = 0;
			this.ui.progress = 0;
		}
	}

	ballLost(playerWin: boolean) {

		if(playerWin){
			this.playerWinnings ++;
			if(this.playerWinnings >= 3) {
				this.gameState.current = GameState.PREWIN;
				return;
			}
			this.ui.progress = this.playerWinnings;	
		} else  {
			this.botWinnings ++;
			if(this.botWinnings >= 3) {
				this.gameState.current = GameState.LOSE;
				return;
			}
		}

		this.reset(false);
		this.spawnBall(1000);
	}

	update(ticker: PIXI.Ticker): void {
		if(this._isPaused)
			return;
		
		if(this.gameState.current === GameState.GAME) {
			this._player.update(ticker);
			this.updateBalls();

			this.physic.update(ticker.FPS, 5);
		}
	}

	updateBalls() {
		for(let b of this._spawner.balls) {
			const y = b.position.y;
			if(y >= this._player.y) {
				this.ballLost(false);
				return;
			} else if(y < this._bot.y) {
				this.ballLost(true)
				return;
			}
		}
	}

	move(event: PIXI.interaction.InteractionEvent) {
		const pos = M2.clamp(event.data.global.x, this._player.width * 0.5, this.app.width - this._player.width * 0.5)
		this._player.targetX = pos;
	}
}
