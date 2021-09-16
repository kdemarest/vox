Module.add('mapMaker',function(){


let MapMaker = class {
	constructor(mapString) {
		this.map = new SimpleMap( mapString );
		this.map.allowUnknown = true;
	}
	makeIntoWorld(world) {
		let wz = 7;
		let blocks = world.blocks;

		this.map.traverse( (x,y,type) => {
			let bx = x;
			let by = this.map.yLen -1 - y;

			if( type.isSpawn ) {
				world.spawnPoint = new Vector( bx + 0.5, by + 0.5, wz+1 );
			}

			if( type.isBridge ) {
				blocks[bx][by][wz-3] = BlockType.BEDROCK;
				blocks[bx][by][wz-2] = BlockType.AIR;
				blocks[bx][by][wz-1] = BlockType.AIR;
				blocks[bx][by][wz+0] = BlockType.PLANK;
				blocks[bx][by][wz+1] = BlockType.AIR;
				blocks[bx][by][wz+2] = BlockType.AIR;
				blocks[bx][by][wz+3] = BlockType.AIR;
			} else
			if( type.isWall ) {
				if( this.map.tileTypeGetDir(x,y,0).isDoor || this.map.tileTypeGetDir(x,y,2).isDoor || this.map.tileTypeGetDir(x,y,4).isDoor || this.map.tileTypeGetDir(x,y,6).isDoor ) {
					blocks[bx][by][wz+1] = BlockType.BRICK;
					blocks[bx][by][wz+2] = BlockType.BRICK;
					blocks[bx][by][wz+3] = BlockType.BRICK;
				}
			} else
			if( type.isWindow ) {
				blocks[bx][by][wz+2] = BlockType.GLASS;
			} else
			if( type.isTunnel ) {
				blocks[bx][by][wz+1] = BlockType.AIR;
				blocks[bx][by][wz+0] = BlockType.PLANK
			} else
			if( type.isDoor ) {
				blocks[bx][by][wz+1] = BlockType.AIR;
				blocks[bx][by][wz+2] = BlockType.AIR;
				blocks[bx][by][wz+3] = BlockType.BRICK;
			} else
			if( type.isWater ) {
				blocks[bx][by][wz-1] = BlockType.WATER;
				blocks[bx][by][wz+0] = BlockType.WATER;
				blocks[bx][by][wz+1] = BlockType.AIR;
				blocks[bx][by][wz+2] = BlockType.AIR;
				blocks[bx][by][wz+3] = BlockType.AIR;
			} else
			if( type.isPit ) {
				blocks[bx][by][wz-3] = BlockType.BEDROCK;
				blocks[bx][by][wz-2] = BlockType.AIR;
				blocks[bx][by][wz-1] = BlockType.AIR;
				blocks[bx][by][wz+0] = BlockType.AIR;
				blocks[bx][by][wz+1] = BlockType.AIR;
				blocks[bx][by][wz+2] = BlockType.AIR;
				blocks[bx][by][wz+3] = BlockType.AIR;
			} else
			if( type.isFloor && !type.isBridge ) {
				let height = Random.Pseudo.intBell(3, 5);
				for( let z=0 ; z<height ; ++z ) {
					blocks[bx][by][wz+1+z] = BlockType.AIR;
				}
				blocks[bx][by][wz+0] = type.block || BlockType.DIRT;
			} else {
				blocks[bx][by][wz+1] = BlockType.AIR;
				blocks[bx][by][wz+2] = BlockType.AIR;
				blocks[bx][by][wz+3] = BlockType.AIR;
			}

			if( type.isLight || ((type.isWall || type.isBridge || type.isPit) && Random.Pseudo.chance100(2)) ) {
				blocks[bx][by][wz+4] = BlockType.TORCH;
			}

		});
		return this;
	}
}

return {
	MapMaker: MapMaker
}

});