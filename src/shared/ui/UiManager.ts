import { Application } from "../../Application";
import { Progress } from "./Progress";
import { Button } from "./Button";
import { CheckedButton } from "./CheckedButton";
import { PopupDifficulty, PopupType } from './Popup';
import { Assets } from "../AssetsLib";
import { Utils } from "./Utils";
import { Hint } from './Hint';
import { Pause } from './Pause';
import { AnimatedPopup } from "./AnimatedPopup";
import { IUIListener, IPopup } from './IUIListener';
import { Controls } from "./Controls";


export enum ControlsLayout {
	NONE, HOR, FULL
}

export interface IUiOptions {
	showProgress?: boolean;
	showArrows?: boolean;
	progress?: number;
	progressMax?: number;
	level?: number;
	levelHint?:string;
	progressHint?: string;
	controlLayout?: ControlsLayout
}

const DEF_OPTIONS: IUiOptions = {
	progress: 0,
	progressMax: 100,
	showProgress: true,
	showArrows: false,
	level: 1,
	levelHint: "Level {current}/{total}",
	progressHint: "Progress {current}/{total}",
	controlLayout: ControlsLayout.NONE
};

export const EXT_FONT_SETTINGS = {
	dropShadowAlpha: 0.4,
    dropShadowAngle: 0.4,
    dropShadowBlur: 2,
    dropShadowColor: "#260e00",
    dropShadowDistance: 2,
    stroke: "#260e00",
}

export class UiManager extends PIXI.utils.EventEmitter {
	
	public stage: PIXI.Container = new PIXI.Container();
	app: Application;

	hint: Hint;
	popup: PopupDifficulty;
	pause: Pause;
	exit: AnimatedPopup;

	_progress: Progress;
	_pauseBtn: Button;
	_settingBtn: Button;
	
	
	private _controls: Controls;
	private _controls_full: Controls;
	private _uiListener: IUIListener;

	_options: IUiOptions = { ...DEF_OPTIONS };
	constructor(app: Application) {
		super();

		this.app = app;
	}

	init(resources: PIXI.IResourceDictionary, params?: IUiOptions) {
		params = params || DEF_OPTIONS;
		const size = this.app.size;

		const atlas = resources["ui-atlas"].spritesheet;
		const map = resources[Assets.Assets["ui-map"].name].data;
		const uiStage = PIXI.tiled.CreateStage(atlas, map);

		this.popup = new PopupDifficulty(uiStage);
		this.popup.position.set(this.app.width >> 1, this.app.height >> 1);

		this.popup.visible = false;

		this.popup.setOpenedLevel(1);

		this._progress = new Progress(uiStage);
		this._progress.progress = 50;
		this._progress.levelIndex = 2;

		
		this._settingBtn = new CheckedButton(
			Utils.findOn(uiStage, "settings/settings-btn"),
			Utils.findOn(uiStage, "settings/settings-btn:checked")
		);

		this._pauseBtn = new Button(Utils.findOn(uiStage, "settings/pause-btn"));
		
		const hor = uiStage.getChildByName("controls_hor") as PIXI.Container;
		this._controls = new Controls(hor);
		this._controls.pivot.y = this._controls.height;
		this._controls.position.y = this.app.height - 100
		this._controls.visible = false;
		
		const full = uiStage.getChildByName("controls_full") as PIXI.Container;
		this._controls_full = new Controls(full);
		this._controls_full.pivot.y = this._controls_full.height;
		this._controls_full.position.y = this.app.height - 100;
		this._controls_full.visible = false;

		this.hint = new Hint(uiStage, this.app.size);
		this.hint.position.y = this.app.height;

		this.pause = new Pause(uiStage);
		this.pause.position.set(this.app.width >> 1, this.app.height >> 1);
		this.pause.close(true).then();

		const exitp = uiStage.getChildByPath<TiledOG.TiledContainer>("exit");
		
		this.exit = new AnimatedPopup(exitp, {
			buttons:["ok", "cancel"]
		});

		this.exit.position.set(this.app.width >> 1, this.app.height >> 1);
		this.exit.close(true).then();


		uiStage.addChild(
			this._progress,
			this._pauseBtn,
			this._settingBtn,
			this._controls,
			this._controls_full,
			this.popup,
			this.pause,
			this.exit,
			this.hint);

		this.stage.addChild(uiStage);
		this.setOptions({ ...params, ...DEF_OPTIONS });

		this.reset();
	}

	public bindListener(lst: IUIListener) {
		this.reset();
		this._uiListener = lst;

	}

	public postInit() {
		//@ts-ignore
		this.popup.applyTranslation(this._uiListener.lang["levels_button"])

	}

	public update(ticker: PIXI.Ticker) {}

	setOptions(params: IUiOptions) {
		this._options = { ...this._options,  ...params };
		
		this.level = this._options.level;
		this.progress = this._options.progress;
		
		// Set progress bar parameters

		this._progress.maxValue = this._options.progressMax;
		this._progress.levelHint = this._options.levelHint;
		this._progress.progressHint = this._options.progressHint;
		this._progress.visible = this._options.showProgress;

		
		this._controls.visible = this._options.controlLayout == ControlsLayout.HOR && this._options.showArrows;
		this._controls_full.visible = this._options.controlLayout == ControlsLayout.FULL  && this._options.showArrows;

		this.visible = true;
	}

	reset() {

		this.removeAllListeners();
		this._pauseBtn.reset();
		//this._settingBtn.removeAllListeners();
		this.visible = false;
		this.pause.reset();
		this.popup.reset();
		this.exit.reset();
		this._controls.reset();
		this._controls_full.reset();
		

		// bind popups button in self
		// open exit popup

		this.popup.exitButton.on("b-click",()=>{
			
			if(this.controls)
				this.controls.interactiveChildren = false;
			
			this.pause.interactiveChildren = false;
			this.popup.interactiveChildren = false;
			this.exit.interactiveChildren = true;
			
			this.popup.close();
			this.exit.open().then(()=>{
				this._uiListener.popupOpened(IPopup.CLOSING);
			});
		});

		// close exit popup 
		this.exit.buttons["cancel"].on("b-click", ()=>{
			
			if(this.controls)
				this.controls.interactiveChildren = true;
			
			this.pause.interactiveChildren = true;
			this.popup.interactiveChildren = true;
			this.exit.interactiveChildren = true;
			this.popup.open();
			this.exit.close();
		});

		// emit closing event

		this.exit.buttons["ok"].on("b-click", ()=>{
			this.app.stop();
		});

		// open pause popup

		this._pauseBtn.on("b-click", ()=>{
			this.onPause(false);
		});

		this.pause.playButton.on("b-click", ()=>{
			this.pause.close();
			this._uiListener.softResume();
		});

		this.pause.reloadButton.on("b-click", ()=>{
			this.pause.close();
			this._uiListener.reload();
			this._uiListener.softResume();
		});

		this.pause.menuButton.on("b-click", ()=>{
			this.pause.close();
			this.setOptions({
				showArrows: false,
				showProgress: false
			});
			this.popup.show(PopupType.START).then(()=>{
				this._uiListener.popupOpened(IPopup.MENU);
			});
		});

		this.popup.on("level-click", (l: number)=>{
			this._uiListener.setLevel(l);
			this._uiListener.softResume();
			this.popup.close();
		});
	}

	onPause(immediate: boolean = true) {
		this.emit("soft-pause");
		const allow = this._uiListener.softPause();
		if(allow) {
			this.pause.open(immediate).then(()=>{
				this._uiListener.popupOpened(IPopup.PAUSE);
			});
		}	
	}

	onResume() {

	}

	get visible(){
		return this.stage.visible;
	}
	
	set visible(v: boolean) {
		this.stage.visible = v;
	}

	set progress(v: number) {
		this._progress.progress = v;
	}
	
	get progress() {
		return this._progress.progress;
	}

	set level(v: number) {
		this._progress.levelIndex = v;
		this.popup.setOpenedLevel(v);
	}

	get level() {
		return this._progress.levelIndex;
	}

	get controls(): Controls {
		if(this._options.controlLayout == ControlsLayout.NONE) return undefined;
		return this._options.controlLayout == ControlsLayout.HOR ? this._controls : this._controls_full;
	}

}
