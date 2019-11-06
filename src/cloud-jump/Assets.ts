import { Config } from '../shared/config';
export const Assets = {
    BaseDir: Config.BaseResDir + "/game0/",
    Assets: {
        "game-atlass":{
            name: "game-atlass",
            url : "./game0-atlas.json"
        },
        "back-tile":{
            name: "back-tile",
            url: "./tile.jpg"
        },
        "player":{
            name:"player",
            url:"./Animate/Game Character/Game Character.json"
        },
        "bricable": {
            name:"bricable",
            url: "./Animate/Platform/Game Platform.json"
        },
        "monster":{
            name: "monster",
            url: "./Animate/Monster/Monster.json"
        }
    }
}