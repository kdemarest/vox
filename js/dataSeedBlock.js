Module.add('seedBlock',function(extern) {


let SeedBlockData = {
	UNKNOWN: {
		isUnknown: true,
		toBlock: 'AIR',
	},
	AIR: {
		isAir: true,
		toBlock: 'AIR',
	},
	FLOOR: {
		isFloor: true,
		toBlock: 'PLANK',
	},
	ROOF: {
		isRoof: true,
		toBlock: 'STONE',
	},
	WALL: {
		isWall: true,
		toBlock: 'DIRT',
	},
	STAIR: {
		isStair: true,
		toBlock: 'PLANK',
	},
	DOOR: {
		isDoor: true,
		toBlock: 'GOLD',
	},
	BRIDGE: {
		isDoor: true,
		toBlock: 'PLANK',
	},
	WINDOW: {
		isWindow: true,
		toBlock: 'GLASS',
	},
	FLUID: {
		isFluid: true,
		toBlock: 'WATER',
	},
	MARKER: {
		isMarker: true,
		toBlock: 'IRON',
	},
	LIGHT: {
		isLight: true,
		toBlock: 'TORCH',
	}

}

class SeedBlock {
	initFromData(id,value) {
		this.id = id;
		Object.assign( this, value );
		return this;
	}
}

let SeedBlockType = {};
for (const [key, value] of Object.entries(SeedBlockData)) {
	SeedBlockType[key] = new SeedBlock().initFromData(key,value);
}


return {
	SeedBlockData: SeedBlockData,
	SeedBlock: SeedBlock,
	SeedBlockType: SeedBlockType,
}

});
