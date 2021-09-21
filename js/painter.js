Module.add('painter',function() {

	let PaintPaletteDefault = function() {
		return {
			bTallFill:	'AIR',
			bDeepFill:	'AIR',
			bPitFill:	'AIR',
			bBase:		'STONE',
			bFloor:		'STONE',
			bRoof:		'STONE',
			bWall:		'STONE',
			bDoor: 		'AIR',
			bPost:		'POST',
			bSlab:		'STONE_SLAB',
			bDias:		'PLANK',
			bShelf:		'PLANK',
			bBridge:	'BRIDGE',
			bTunnel:	'AIR',
			bWindow:	'GLASS',
			bColumn:	'STONE',
			bFluid:		'WATER',
			bLight:		'TORCH',
		}
	};
/*
	class PaintPalette {
		constructor() {
			this.id = null;
			Object.assign( this, PaintPaletteDefault() );			
		}
		initFromData(key,value) {
			this.id = key;
			Object.assign( this, value );
			return this;
		}
	}
*/

	class PaintCursor {
		constructor() {
			this.x = this.y = this.z = null;
			this.u = this.v = this.w = null;
			this.flags = 0;
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
			return this.painter.driver.remaining-this.u;
		}
	}


	let Painter = {};
	Painter.Base = class {
		constructor(keyValuePairs) {
			console.assert( !keyValuePairs.palette );	// Always use setPalette instead.
			Object.assign( this, this.parametersDefault, keyValuePairs );
		}
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
				if( !this[key] && typeof palette[key] === 'string' ) {
					this[key] = palette[key];
				}
			}
		}
	}

	return {
		PaintPaletteDefault: PaintPaletteDefault,
		PaintCursor: PaintCursor,
		Painter: Painter
	}
});
