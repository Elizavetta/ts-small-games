import { Config } from '../shared/config';

export const Assets = {
	BaseDir: Config.BaseResDir + "/game5",
	Assets : {
		"game-atlas": {
			name : "game-atlas",
			url : '/game5-atlas.json'
		},
		"bg0":{
			name : "bg0",
			url : "/LVL1.jpg",
		},
		"bg1":{
			name : "bg1",
			url : "/LVL2.jpg",
		},
		"bg2":{
			name : "bg2",
			url : "/LVL3.jpg",
		}
	}
}