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
				blocks[bx][by][wz-3] = BLOCK.BEDROCK;
				blocks[bx][by][wz-2] = BLOCK.AIR;
				blocks[bx][by][wz-1] = BLOCK.AIR;
				blocks[bx][by][wz+0] = BLOCK.PLANK;
				blocks[bx][by][wz+1] = BLOCK.AIR;
				blocks[bx][by][wz+2] = BLOCK.AIR;
				blocks[bx][by][wz+3] = BLOCK.AIR;
			} else
			if( type.isWall ) {
				if( this.map.tileTypeGetDir(x,y,0).isDoor || this.map.tileTypeGetDir(x,y,2).isDoor || this.map.tileTypeGetDir(x,y,4).isDoor || this.map.tileTypeGetDir(x,y,6).isDoor ) {
					blocks[bx][by][wz+1] = BLOCK.BRICK;
					blocks[bx][by][wz+2] = BLOCK.BRICK;
					blocks[bx][by][wz+3] = BLOCK.BRICK;
				}
			} else
			if( type.isWindow ) {
				blocks[bx][by][wz+2] = BLOCK.GLASS;
			} else
			if( type.isTunnel ) {
				blocks[bx][by][wz+1] = BLOCK.AIR;
				blocks[bx][by][wz+0] = BLOCK.PLANK
			} else
			if( type.isDoor ) {
				blocks[bx][by][wz+1] = BLOCK.AIR;
				blocks[bx][by][wz+2] = BLOCK.AIR;
				blocks[bx][by][wz+3] = BLOCK.BRICK;
			} else
			if( type.isWater ) {
				blocks[bx][by][wz-1] = BLOCK.WATER;
				blocks[bx][by][wz+0] = BLOCK.WATER;
				blocks[bx][by][wz+1] = BLOCK.AIR;
				blocks[bx][by][wz+2] = BLOCK.AIR;
				blocks[bx][by][wz+3] = BLOCK.AIR;
			} else
			if( type.isPit ) {
				blocks[bx][by][wz-3] = BLOCK.BEDROCK;
				blocks[bx][by][wz-2] = BLOCK.AIR;
				blocks[bx][by][wz-1] = BLOCK.AIR;
				blocks[bx][by][wz+0] = BLOCK.AIR;
				blocks[bx][by][wz+1] = BLOCK.AIR;
				blocks[bx][by][wz+2] = BLOCK.AIR;
				blocks[bx][by][wz+3] = BLOCK.AIR;
			} else
			if( type.isFloor && !type.isBridge ) {
				let height = Random.Pseudo.intBell(3, 5);
				for( let z=0 ; z<height ; ++z ) {
					blocks[bx][by][wz+1+z] = BLOCK.AIR;
				}
				blocks[bx][by][wz+0] = type.block || BLOCK.DIRT;
			} else {
				blocks[bx][by][wz+1] = BLOCK.AIR;
				blocks[bx][by][wz+2] = BLOCK.AIR;
				blocks[bx][by][wz+3] = BLOCK.AIR;
			}

			if( type.isLight || ((type.isWall || type.isBridge || type.isPit) && Random.Pseudo.chance100(2)) ) {
				blocks[bx][by][wz+4] = BLOCK.TORCH;
			}

		});
		return this;
	}
}

return {
	MapMaker: MapMaker
}

});