Module.add('seed',function(extern) {

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
}

});
