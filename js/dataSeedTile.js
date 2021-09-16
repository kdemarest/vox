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
				brush.fill(brush.zDeep,0,brush.bPit);
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
			isFLUID: true,
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
			}
		},
	}

return {
	SeedTileData: SeedTileData,
}

});
