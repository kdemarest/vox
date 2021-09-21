Module.add('painter',function() {

	let PaintPaletteDefault = function() {
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

	class PaintCursor {
		constructor() {
			this.x = this.y = this.z = null;
			this.u = this.v = this.w = null;
			this.flags = 0;
			this.painter = null;
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
			return this.painter.driver.remaining-this.u;
		}
	}


	let Painter = {};
	Painter.Base = class {
		constructor(keyValuePairs) {
			console.assert( !keyValuePairs.palette );	// Always use setPalette instead.
			Object.assign( this, this.parametersDefault, keyValuePairs );
			this.textureHash = {};	// a hash of named textures that the painter can use at will.
		}
		get parametersDefault()	{ return {}; }
		get paletteDefault()	{ return {}; }
		setCursor(cursor) {
			this.cursor = cursor;
			this.cursor.painter = this;
		}
		setPalette(_palette) {
			// Overwrite only the bThings that haven't been set by the class, which controls.
			// At the same time, KEEP the palette around so that functions that overload bThing can use it.
			let palette = Object.assign( {}, PaintPaletteDefault(), this.paletteDefault || {}, _palette );
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
		PaintPaletteDefault: PaintPaletteDefault,
		PaintCursor: PaintCursor,
		Painter: Painter
	}
});
