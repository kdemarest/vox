Module.add('pip',function(extern) {

	let Pip = class {
		constructor() {
		}
		initFromData(key,value) {
			Object.assign(this,value);
			this.id = key;
		}
	}

	let PipData = {
		UNKNOWN: {
			symbol: '?',
			isUnknown: true,
		},
		FLOOR: {
			symbol: '.',
			isFloor: true,
			sprout: d => {
				d.put(-1,d.bFloor);
			}
		},
		HALL: {
			symbol: '+',
			isHall: true,
			sprout: d => {
				d.put(-1,d.bFloor);
			}
		},
		DOOR: {
			symbol: 'D',
			isDoor: true,
			sprout: d => {
				d.put(-1,d.bFloor);
				d.fill(0,1,d.bDoor);
			}
		},
		WALL: {
			symbol: '#',
			isWall: true,
			sprout: d => {
				d.fill(d.deep,d.tall,d.bWall);
			}
		},
		PIT: {
			symbol: 'o',
			isPit: true,
		},
		DIAS: {
			symbol: 'd',
			isDias: true,
		},
		SHELF: {
			symbol: 's',
			isShelfß: true,
		},
		BRIDGE: {
			symbol: '=',
			isBridge: true,
		},
		SHAFT: {
			symbol: 'x',
			isShaft: true,
		},
		TUNNEL: {
			symbol: 't',
			isTunnel: true,
		},
		WINDOW: {
			symbol: '^',
			isWindow: true,
		},
		COLUMN: {
			symbol: 'c',
			isColumn: true,
		},
		HITUNNEL: {
			symbol: 'h',
			isTunnel: true,
		}
	}

	let PipType = {};
	for (const [key, value] of Object.entries(PipData)) {
		PipType[key] = new Pip().initFromData(key,value);
	}


return {
	Pip: Pip,
	PipType: PipType,
}

});
