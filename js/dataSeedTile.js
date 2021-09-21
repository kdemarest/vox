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
				brush.fill(0,brush.zTall,brush.bTallFill);
			}
		},
		WALL: {
			symbol: '#',
			isWall: true,
			render: brush => {
				brush.fillPassable(brush.zDeep,brush.zTall,brush.bWall);
			}
		},
		DOOR: {
			symbol: '+',
			isDoor: true,
			render: brush => {
				brush.put(-1,brush.bFloor);
				brush.fill(0,brush.zDoor,brush.bDoor);
				brush.fillPassable(brush.zDoor,brush.zTall,brush.bWall);
			}
		},
		PIT: {
			symbol: 'p',
			isPit: true,
			render: brush => {
				brush.fill(brush.zDeep,0,brush.bPitFill);
				brush.fill(0,brush.zTall,brush.bTallFill);
				brush.put(brush.zDeep-1,brush.bBase);
			}
		},
		SUPPORT: {
			symbol: 'O',
			isSupport: true,
			render: brush => {
				brush.fill(brush.zDeep,brush.zTall,brush.bSupport);
			}
		},
		COLUMN: {
			symbol: 'o',
			isColumn: true,
			render: brush => {
				brush.fill(brush.zDeep,brush.zTall,brush.bColumn);
			}
		},
		POST: {
			symbol: '|',
			isPost: true,
			render: brush => {
				brush.fill(brush.zDeep,brush.zTall,brush.bPost);
			}
		},
		SLAB: {
			symbol: ',',
			isSlab: true,
			render: brush => {
				let zSlab = brush.zSlab || brush.seed.zSlab || 0;
				brush.put(zSlab,brush.bSlab);
				brush.fill(zSlab+1,brush.zTall,brush.bTallFill);
			}
		},
		DIAS: {
			symbol: 'd',
			isDias: true,
			render: brush => {
				let zDias = brush.zDias || brush.seed.zDias || 0;
				brush.put(zDias,brush.bDias);
				brush.fill(zDias+1,brush.zTall,brush.bTallFill);
			}
		},
		SHELF: {
			symbol: 's',
			isShelf: true,
			render: brush => {
				let zShelf    = brush.zShelf || brush.seed.zShelf || 0;
				let zShelfTop = brush.zShelfTop || brush.seed.zShelfTop || 2;
				brush.fill(zShelf,zShelfTop,brush.bShelf);
				brush.fill(zShelfTop,brush.zTall,brush.bTallFill);
			}
		},
		BRIDGE: {
			symbol: '=',
			isBridge: true,
			render: brush => {
				let zBridge = brush.zBridge || brush.seed.zBridge || -1;
				brush.put(zBridge,brush.bBridge);
				brush.fill(zBridge+1,brush.zTall,brush.bTallFill);

			}
		},
		TUNNEL: {
			symbol: 't',
			isTunnel: true,
			render: brush => {
				let zTunnel = brush.zTunnel || brush.seed.zTunnel || 0;
				brush.put(zTunnel,brush.bTunnel);
				brush.fillPassable(zTunnel+1,brush.zTall,brush.bWall);
			}
		},
		FLUID: {
			symbol: 'w',
			isFluid: true,
			render: brush => {
				brush.fill(Math.min(-1,brush.zDeep),brush.zFluid+1,brush.bFluid);
				brush.fill(brush.zFluid+2,brush.zTall,brush.bTallFill);
				brush.put(Math.min(-1,brush.zDeep,brush.zFluid), brush.bFloor );
			}
		},
		WINDOW: {
			symbol: '^',
			isWindow: true,
			render: brush => {
				brush.put(1,brush.bWindow);
				brush.fillPassable(brush.zDeep,1,brush.bWall);
				brush.fillPassable(2,brush.zTall,brush.bWall);
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
			brush.fillPassable(brush.zDeep,altitude,brush.seed.hollowBelow ? brush.bTallFill : brush.bWall);
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
