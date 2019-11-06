import { ILevelData } from './GameConfig';
import { IContractData } from './Contract';
export  class LevelGenerator {
    
    static generate(col: number, row: number): ILevelData {

        const levelData: ILevelData = 
            {
                col,
                row,
                data: [],
                contracts : [],
                targetScore: col * row * 2
            };
        

        for(let i = 0; i < col * row; i++)
           levelData.data.push(Math.random() * 4 | 0);
        
        this.generateContracts(levelData, 2);
        return levelData;
    }

    static generateContracts(data: ILevelData, max: number = 2) {
        
        const count = Math.min(max, max - data.contracts.length, 4);
        const existed = data.contracts.map( e => e.type );
        
        let canBeMore = false;
        
        for(let i = 0; i < count; i++) {
            
            let type = Math.random() * 4 | 0;
            while(existed.indexOf(type) > -1 )
                type = (type + 1) % 4;
            
            let amount = 2 + Math.random() * Math.sqrt(data.data.length) * 1.5 | 0;
            if(!canBeMore) {
                const typed = data.data.filter( e => e == type);
                if(typed.length < 2) {
                    i --;
                    continue;
                }
                amount = typed.length;
            }

            data.contracts.push(
                {
                    type :  type,
                    amount : amount
                }
            )
            existed.push(type);
            canBeMore = true;
        }
    }
}