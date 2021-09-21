Module.add('seed',function(extern) {


class SeedBrush {
	constructor(seed,head,getFn,putFn) {
		console.assert(seed);
		console.assert( typeof putFn === 'function' );
		this.seed    = seed;
		this.head    = head;
		this.getFn   = getFn;
		this.putFn   = putFn;
		this.setPalette({});
		this.xCursor = null;
		this.yCursor = null;
		this.zCursor = null;
		this.distCursor = null;
		this.lrCursor = null;
	}
	get xLen() { return this.seed.xLen; }
	get yLen() { return this.seed.yLen; }
	get zTall() { return this.seed.zTall; }
	get zDeep() { return this.seed.zDeep; }
	get zFluid() { return this.seed.zFluid; }

	get paletteDefault() {
		return PaintPaletteDefault();
	}

	get setUpon() {
		for( let i=this.zDeep ; i<this.zTall ; ++i ) {
			if( this.vertical[i].isGas ) {
				return i;
			}
		}
		return 1;
	}

	setPalette( palette ) {
		Object.assign( this, this.paletteDefault, this.seed.palette, palette );
	}

	setCursor(x,y,z,dist,lr) {
		console.assert( Coordinate.validateMany(x,y,z) );
		this.xCursor = x;
		this.yCursor = y;
		this.zCursor = z;
		this.distCursor = dist;
		this.lrCursor = lr;
		return this;
	}

	get(z) {
		return this.getFn(
			this.xCursor,
			this.yCursor,
			this.zCursor + z
		);
	}

	put(z,blockId) {
		let block = BlockType[blockId];
		console.assert( block && block instanceof Block );
		console.assert( Number.isInteger(z) );
		this.vertical[z] = block;
		this.putFn(
			this.xCursor,
			this.yCursor,
			this.zCursor + z,
			block
		);
		return this;
	}

	putWeak(z,blockId) {
		if( this.get(z).isUnknown ) {
			this.put(z,blockId);
		}
	}

	_fill(_z0,_z1,blockId,weak=false,stopAtKnown=false) {
		console.assert( BlockType[blockId] );
		console.assert( Number.isInteger(_z0) && Number.isInteger(_z1) );
		let z0 = Math.min(_z0,_z1);
		let z1 = Math.max(_z0,_z1);
		for( let z=z0 ; z<z1 ; ++z ) {
			if( !weak || this.get(z).isUnknown ) {
				this.put(z,blockId);
			}
			else if( stopAtKnown ) {
				break;
			}
		}
		return this;
	}

	fill(_z0,_z1,blockId) {
		return this._fill(_z0,_z1,blockId);
	}

	fillWeak( _z0,_z1,blockId) {
		return this._fill(_z0,_z1,blockId,true);
	}

	fillUntilKnown(_z0,_z1,blockId) {
		return this._fill(_z0,_z1,blockId,true,true);
	}

	stroke(seedTile) {
		let seed = this.seed;
		this.vertical = [];

		if( seedTile === null || seedTile.isUnknown ) {
// Put this back in when ready...
//			if( this.distCursor <=0 ) {
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
		this.fill( 0, seed.zTall, this.bTallFill );

		// Cap it with a roof
		this.put( seed.zTall, this.bRoof );

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

let SeedTile = class {
	constructor() {
	}
	initFromData(key,value) {
		Object.assign(this,value);
		this.id = key;
		return this;
	}
}

let SeedTileType = {};
for (const [key, value] of Object.entries(SeedTileData)) {
	SeedTileType[key] = new SeedTile().initFromData(key,value);
}

let Seed = class {
	initFromData(key,data) {
		this.id   = key;
		this.data = data;
		Object.assign( this, SeedDataDefaults, data );
		console.assert( Number.isInteger(this.zTall) && this.zTall >= 0 );
		console.assert( Number.isInteger(this.zDeep) && this.zDeep <= 0 );

		if( this.palette ) {
			for( let key in this.palette ) {
				console.assert( BlockType[ this.palette[key] ] );
			}
		}

		let textMapParser = new TextMapParser(this.textMap,2);
		let [xLen,yLen]   = textMapParser.dimensions;
		console.assert( Number.isInteger(xLen) && Number.isInteger(yLen) );
		this.map2d        = new Map2d(SeedTileType).set(0,0,xLen,yLen);
		textMapParser.parse( (x,y,index,symbol) => {
			if( index == 0 ) {
				let seedTile = symbol=='' ? SeedTileType.UNKNOWN : Object.values(SeedTileType).find( seedTile => seedTile.symbol==symbol );
				if( seedTile === undefined ) {
					debugger;
					console.log( "Unknown SeedTileType symbol ["+symbol+"]" );
					seedTile = SeedTileType.UNKNOWN;
				}
				this.map2d.setVal( x, y, seedTile );
			}
			if( index == 1 ) {
				this.map2d.setVal( x, y, null, symbol );
			}
		});
		return this;
	}
	get xLen() {
		return this.map2d.xLen;
	}
	get yLen() {
		return this.map2d.yLen;
	}
	fitsReach(reach) {
		console.assert( this.xLen && this.yLen );
		console.assert( reach[this.yLen] !== undefined );
		return this.xLen < reach[this.yLen];
	}
}

let SeedType = {};
for (const [key, value] of Object.entries(SeedData)) {
	SeedType[key] = new Seed().initFromData(key,value);
}

return {
	Seed: Seed,
	SeedType: SeedType,
	SeedBrush: SeedBrush
}

});
