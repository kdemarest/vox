Module.add('seedBlock',function(extern) {


let SeedBlockData = {
	UNKNOWN: {
		isUnknown: true,
		toBLOCK: 'AIR',
	},
	AIR: {
		isAir: true,
		toBLOCK: 'AIR',
	},
	FLOOR: {
		isFloor: true,
		toBLOCK: 'PLANK',
	},
	ROOF: {
		isRoof: true,
		toBLOCK: 'STONE',
	},
	WALL: {
		isWall: true,
		toBLOCK: 'DIRT',
	},
	STAIR: {
		isStair: true,
		toBLOCK: 'PLANK',
	},
	DOOR: {
		isDoor: true,
		toBLOCK: 'GOLD',
	},
	BRIDGE: {
		isDoor: true,
		toBLOCK: 'PLANK',
	},
	WINDOW: {
		isWindow: true,
		toBLOCK: 'WINDOW',
	},
	FLUID: {
		isFluid: true,
		toBLOCK: 'WATER',
	},
	MARKER: {
		isMarker: true,
		toBLOCK: 'IRON',
	},
	LIGHT: {
		isLight: true,
		toBLOCK: 'TORCH',
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
