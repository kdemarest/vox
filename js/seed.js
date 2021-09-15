Module.add('seed',function(extern) {

class Seed extends Map2d {

	initFromData(key,data) {
		this.id = key;
		Object.assign( this, Seed.Defaults, data );
		console.assert( Number.isInteger(this.tall) && tall >= 0 );
		console.assert( Number.isInteger(this.deep) && deep <= 0 );
		this.px = null;
		this.py = null;
	}

	put(z,block) {
		this.map.setVal(
			this.anchor.x + px,
			this.anchor.y + py,
			this.anchor.z + z,
			block
		);
		return this;
	}

	fill(z0,z1,block) {
		for( let z=z0 ; z<z1 ; ++z ) {
			this.put(z,block);
		}
		return this;
	}

	sproutXY(px,py,pip) {
		this.px = px;
		this.py = py;

		if( deep < 0 ) {
			// Put a floor below the pit, and fill it with air.
			this.put( this.deep-1, this.bBase );
			this.fill( this.deep, -1, this.bPit );
		}
		else {
			// There is just a regular floor in this room
			this.put( -1, this.bFloor );
		}

		// Fill the top of the room with air
		this.fill( 0, this.tall, this.bAir );

		// Cap it with a roof
		this.put( px, py, this.tall, this.bRoof );

		pip.sprout(this);
	}

	sprout(map3d,anchor) {
		this.map3d = map3d;
		this.anchor = anchor;
		this.traverse( (x,y) => {
			let pip = this.getVal(x,y);
			if( pip.isUnknown ) {
				continue;
			}
			this.sproutXY(x,y,pip);
		});

	}
}

let SeedData = {};

Seed.Defaults = {
	tall: 5,
	deep: 0,
	bRoof:  "ROOF",
	bAir:   "AIR",
	bFloor: "FLOOR",
	bPit:   "AIR",
	bBase:  "FLOOR",
}

SeedData.CANDLE_NICHE = {
	mapData:
`
# # # 
# d*# 
`;
	hasRoof: false,
	tall: 2,
}

SeedData.SMALL_CHAMBER = {
	mapData:
`
# # # # #
# s s*s #
# d d d #
# d d d #
    +
`; 


	let SeedType = {};
	for (const [key, value] of Object.entries(SeedData)) {
		SeedType[key] = new Seed().initFromData(key,value);
	}




return {
	Seed: Seed,
}

});
