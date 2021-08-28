Module.add('mapMaker',function(){


let MapMaker = class {
	constructor(mapString) {
		this.map = new SimpleMap( mapString );
		this.map.allowUnknown = true;
	}
	triple() {
		let tFloor = '.';
		let tWall  = '#';
		let tDoor  = '+';

		let target = new SimpleMap(SimpleMap.fillTextMap(this.map.xLen*3,this.map.yLen*3,tFloor));
		target.allowUnknown = true;

		this.map.traverse( (x,y,type) => {
			let tx = x*3;
			let ty = y*3;
			let symbol = this.map.tileSymbolGetFastUnasfe(x,y);
			if( !type ) {
				return;
			}
			let region = [tx,ty,3,3];
			if( type.isWall || type.isPit ) {
				target.traverseRegion(...region,(tx,ty)=>{
					target.tileSymbolSet(tx,ty,symbol);
				});
				return;
			}
			if( symbol==tDoor ) {
				if( this.map.tileSymbolGet(x,y-1)==tFloor ) {
					target.tileSymbolSet(tx+0,ty+1,tWall);
					target.tileSymbolSet(tx+1,ty+1,tDoor);
					target.tileSymbolSet(tx+2,ty+1,tWall);
				}
				if( this.map.tileSymbolGet(x-1,y)==tFloor ) {
					target.tileSymbolSet(tx+1,ty+0,tWall);
					target.tileSymbolSet(tx+1,ty+1,tDoor);
					target.tileSymbolSet(tx+1,ty+2,tWall);
				}
				return;
			}
			if( type.isSingular ) {
				target.tileSymbolSet(tx+1,ty+1,symbol);
			}
		});
		this.map = target;
		return this;
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
			if( type.isFloor ) {
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

			if( type.isLight ) {
//				new Entity.Mesh('itemJustLight').setXY(x,y,1.5);
			}

		});
		return this;
	}
}

return {
	MapMaker: MapMaker
}

});