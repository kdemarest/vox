Module.add('brush',function() {

	let BrushPaletteDefault = function() {
		return {
			bTallFill:	'AIR',
			bDeepFill:	'AIR',
			bPitFill:	'AIR',
			bBase:		'STONE',
			bFloor:		'WOOD',
			bRoof:		'STONE',
			bWall:		'STONE',
			bDoor: 		'AIR',
			bPost:		'POST',
			bSlab:		'STONE_SLAB',
			bDias:		'PLANK',
			bShelf:		'SHELF',
			bBridge:	'BRIDGE',
			bTunnel:	'AIR',
			bWindow:	'GLASS',
			bSupport:	'STONE',
			bColumn:	'COLUMN',
			bFluid:		'WATER',
			bLight:		'TORCH',
		}
	};

	class BrushCursor {
		constructor() {
			this.x = this.y = this.z = null;
			this.u = this.v = this.w = null;
			this.flags = 0;
			this.brush = null;
		}
		attach(getFn,putFn) {
			console.assert( typeof getFn == 'function' );
			console.assert( typeof putFn == 'function' );
			this.getFn   = getFn;
			this.putFn   = putFn;
		}
		set( x, y, z, u, v, w, flags ) {
			this.x = x;
			this.y = y;
			this.z = z;
			this.u = u;
			this.v = v;
			this.w = w;
			this.flags = flags;
		}
		get uGlobal() {
			// Tells how far along you are overall, while .u only tells how far along the current hallway.
			return this.brush.driver.remaining-this.u;
		}

		get(z) {
			console.assert( Coordinate.validateValue(z) );
			return this.getFn( this.x, this.y, this.z+z );
		}

		getNext(dir,slope=0) {
			return this.getFn(
				this.x + Dir.add[dir].x,
				this.y + Dir.add[dir].y,
				this.z + slope
			);
		}

		put(z,blockId) {
			let block = BlockType[blockId];
			console.assert( block && block instanceof Block );
			this.putFn( this.x, this.y, this.z+z, block );
			return this;
		}

		putOnPassable(z,blockId) {
			if( this.get(z).passable ) {
				this.put(z,blockId);
				return true;
			}
		}

		putWeak(z,blockId) {
			if( this.get(z).isUnknown ) {
				this.put(z,blockId);
				return true;
			}
		}

		_fill(_z0,_z1,blockId,check=null,stopWhenBlocked=false) {
			console.assert( BlockType[blockId] );
			console.assert( Number.isInteger(_z0) && Number.isInteger(_z1) );
			let z0 = Math.min(_z0,_z1);
			let z1 = Math.max(_z0,_z1);
			for( let z=z0 ; z<z1 ; ++z ) {
				if( !check || this.get(z)[check] ) {
					this.put(z,blockId);
				}
				else if( stopWhenBlocked ) {
					break;
				}
			}
			return this;
		}

		fill(_z0,_z1,blockId) {
			return this._fill(_z0,_z1,blockId);
		}

		fillWeak( _z0,_z1,blockId) {
			return this._fill(_z0,_z1,blockId,'isUnknown');
		}

		fillPassable( _z0,_z1,blockId) {
			return this._fill(_z0,_z1,blockId,'passable');
		}

		fillUntilKnown(_z0,_z1,blockId) {
			return this._fill(_z0,_z1,blockId,'isUnknown',true);
		}

	}


	let Brush = {};
	Brush.Base = class extends BrushCursor {
		constructor(keyValuePairs) {
			super();
			console.assert( !keyValuePairs.palette );	// Always use setPalette instead.
			Object.assign( this, this.parameterData, keyValuePairs );
			this.textureHash = {};	// a hash of named textures that the brush can use at will.
		}
		get paletteDefault() {
			return BrushPaletteDefault();
		}
		get parameterData()	{
			return {};
		}
		get paletteData() {
			return {};
		}
		setPalette(_palette) {
			// Overwrite only the bThings that haven't been set by the class, which controls.
			// At the same time, KEEP the palette around so that functions that overload bThing can use it.
			let palette = Object.assign( {}, this.paletteDefault, this.paletteData || {}, _palette );
			this.palette = palette;
			for( let key in palette ) {
				// Since there is no reliable way to detect whether a getter is already defined, but V8 can tell,
				// just let it exception and ignore it.
				if( !this[key] && typeof palette[key] === 'string' ) {
					try {
						this[key] = palette[key];
					} catch(e) {}
				}
			}
		}
		begin() {
		}
		sample2d(textureName,u,v,uStride,vStride) {
			if( !this.textureHash[textureName] ) {
				let t = new TextMapParser( this[textureName].textMap );
				let m = new Map2d(BlockType,'UNKNOWN').set(0,0,t.dimensions[0],t.dimensions[1]);
				t.parse( (x,y,index,symbol) => {
					let block = this[textureName].lookup[symbol];
					console.assert(block);
					m.setVal( x, y, block );
				});
				this.textureHash[textureName] = m;
			}

			let texture = this.textureHash[textureName];
			// This business with adding uStride*10 just gets us out of the negative numbers,
			// in case we're either below ground level, or before the start of the hall
			let x = Math.floor( ((u+uStride*10) % uStride) / uStride * texture.xLen );
			let y = Math.floor( ((v+vStride*10) % vStride) / vStride * texture.yLen );
			console.assert( x >= 0 && x < texture.xLen );
			console.assert( y >= 0 && y < texture.yLen );
			return texture.getTile(x,y);
		}
	}

	return {
		BrushPaletteDefault: BrushPaletteDefault,
		BrushCursor: BrushCursor,
		Brush: Brush
	}
});
