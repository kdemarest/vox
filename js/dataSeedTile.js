Module.add('dataSeedTile',function(extern) {

	let SeedTileData = {
		UNKNOWN: {
			symbol: ' ',
			isUnknown: true,
		},
		FLOOR: {
			symbol: '.',
			isFloor: true,
			render: brush => {
				brush.put(-1,brush.bFloor);
			}
		},
		WALL: {
			symbol: '#',
			isWall: true,
			render: brush => {
				brush.fill(brush.zDeep,brush.zTall,brush.bWall);
			}
		},
		DOOR: {
			symbol: '+',
			isDoor: true,
			render: brush => {
				brush.put(-1,brush.bFloor);
				brush.fill(0,1,brush.bDoor);
			}
		},
		PIT: {
			symbol: 'p',
			isPit: true,
			render: brush => {
				brush.fill(brush.zDeep,0,brush.bPitFill);
				brush.put(brush.zDeep-1,brush.bBase);
			}
		},
		COLUMN: {
			symbol: 'O',
			isColumn: true,
			render: brush => {
				brush.fill(brush.zDeep,brush.zTall,brush.bColumn);
			}
		},
		POST: {
			symbol: 'o',
			isPost: true,
			render: brush => {
				brush.fill(brush.zDeep,brush.zTall,brush.bPost);
			}
		},
		SLAB: {
			symbol: ',',
			isSlab: true,
			render: brush => {
				brush.fill(brush.zDeep,brush.zTall,brush.bSlab);
			}
		},
		DIAS: {
			symbol: 'd',
			isDias: true,
			render: brush => {
				brush.put(0,brush.bDias);
			}
		},
		SHELF: {
			symbol: 's',
			isShelf: true,
			render: brush => {
				brush.put(0,brush.bShelf);
				brush.put(1,brush.bShelf);
			}
		},
		BRIDGE: {
			symbol: '=',
			isBridge: true,
			render: brush => {
				brush.put(-1,brush.bBridge);
			}
		},
		TUNNEL: {
			symbol: 't',
			isTunnel: true,
			render: brush => {
				brush.put(0,brush.bTunnel);
				brush.fill(1,brush.zTall,brush.bWall);
			}
		},
		FLUID: {
			symbol: 'w',
			isFluid: true,
			render: brush => {
				brush.fill(Math.min(-1,brush.zDeep),brush.zFluid+1,brush.bFluid);
				brush.put(Math.min(-1,brush.zDeep,brush.zFluid), brush.bFloor );
			}
		},
		WINDOW: {
			symbol: '^',
			isWindow: true,
			render: brush => {
				brush.put(1,brush.bWindow);
				brush.fill(brush.zDeep,1,brush.bWall);
				brush.fill(2,brush.zTall,brush.bWall);
			}
		},
	}

let heights = ['0','1','2','3','4','5','6','7','8','9'];
heights.forEach( symbol => {
	let _altitude = parseInt(symbol)-1;
	SeedTileData[symbol] = {
		symbol: symbol,
		isFloor: true,
		render: brush => {
			let altitudeShift = brush.seed.altitudeShift || 0;
			let altitude = _altitude + altitudeShift;
			brush.fill(brush.zDeep,altitude,brush.seed.hollowBelow ? brush.bTallFill : brush.bWall);
			brush.put(altitude,brush.bFloor);
			if( this.distCursor <= 0 ) {
				brush.fill(altitude+1,altitude+4,brush.bTallFill);
			}
		}
	}
});

return {
	SeedTileData: SeedTileData,
}

});
