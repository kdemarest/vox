Module.add('brushSeed',function(extern) {


class SeedBrush extends Brush.Base {
	constructor(seed,head) {
		super({
			seed: seed,
			head: head
		});
		console.assert(seed);
		this.vertical = null;
		this.cursor = null;
	}
	get xLen() { return this.seed.xLen; }
	get yLen() { return this.seed.yLen; }
	get zTall() { return this.seed.zTall; }
	get zDeep() { return this.seed.zDeep; }
	get zDoor() { return this.seed.zDoor; }
	get zFluid() { return this.seed.zFluid; }

	put(z,blockId) {
		super.put(z,blockId);
		this.vertical[z] = BlockType[blockId];
	}

	get setUpon() {
		for( let i=this.zDeep ; i<this.zTall ; ++i ) {
			if( this.vertical[i].isGas ) {
				return i;
			}
		}
		return 1;
	}

	stroke(seedTile) {
		let seed = this.seed;
		this.vertical = [];

		if( seedTile === null || seedTile.isUnknown ) {
// Put this back in when ready...
//			if( this.dist <=0 ) {
//				this.fillUntilKnown( seed.zDeep, seed.zTall, this.bWall );
//				this.fill( this.head.loft, seed.zTall, this.bWall );
//			}
			return this;
		}

		if( seed.zDeep < 0 ) {
			// Put a floor below the pit, and fill it with air.
			this.put( seed.zDeep-1, this.bBase );
			this.fill( seed.zDeep, -1, this.bDeepFill );
		}
		else {
			// There is just a regular floor in this room
			this.put( -1, this.bFloor );
		}

		// Fill the top of the room with air
		// Nope: let the tile figure this out instead.
		//this.fill( 0, seed.zTall, this.bTallFill );

		// Cap it with a roof
		this.putOnPassable( seed.zTall, this.bRoof );

		//console.log(seedTile.id);
		seedTile.render(this);
		return this;
	}

	markup(symbol) {
		if( symbol == NO_ZONE ) {
			return this;
		}
		if( symbol == '*' ) {
			this.put( 1, this.bLight );
		}
		if( symbol >= '0' && symbol <= '9' ) {
			this.put( parseInt(symbol), this.bLight );
		}
		if( symbol == 'r' ) {
			this.put( this.zTall-1, this.bLight );
		}
		if( symbol == 'f' ) {
			this.put( this.zDeep, this.bLight );
		}
		if( symbol == 's' ) {
			this.put( this.setUpon, this.bLight );
		}
		return this;
	}

}

return {
	SeedBrush: SeedBrush
}

});
