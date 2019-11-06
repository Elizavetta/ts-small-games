import { Config } from '../shared/config';

export const Assets = {
    BaseDir: Config.BaseResDir + "/game3",
    Assets : {
        "game-atlas": {
            name:"game-atlas",
            url:'/game3-atlas.json'
        },
        "bg0":{
            name:"bg0",
            url:"/bg0.jpg",
        },
        "bg1":{
            name:"bg1",
            url:"/bg1.jpg",
        },
        "bg2":{
            name:"bg2",
            url:"/bg2.jpg",
        }
    }
}