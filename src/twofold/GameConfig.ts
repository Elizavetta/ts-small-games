import { LevelGenerator } from './LevelGenerator';

export interface ILevelData {
	row: number;
	col: number;
	data: Array<number>;
	targetScore: number;
	contracts: Array<{type: number, amount: number}>
}

function _generate(x: number, y: number) {
	let data = []

	for(let i = 0; i < x * y; i++) {
		data.push(Math.random() * 4 | 0);
	}

	return data;
}

export const GameConfig = {
	cellSize: 240,
	arrowOffset:  80,
	lineColor: 0x2e7a05,
	lineStroke: 0x008d00, 
	lineWidth: 100,
	contractColor: 0x00c600,
	contractTextColor: 0xffa800,
	levels:[ 
		LevelGenerator.generate(4, 4),
		LevelGenerator.generate(6, 6),
		LevelGenerator.generate(8, 8),
	]
}
