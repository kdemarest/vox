Module.add('map2d',function(extern) {

	const Dir = new class {
		constructor() {
			this.add = [
				{ x:0,  y:-1 },
				{ x:1,  y:-1 },
				{ x:1,  y:0 },
				{ x:1,  y:1 },
				{ x:0,  y:1 },
				{ x:-1, y:1 },
				{ x:-1, y:0 },
				{ x:-1, y:-1 }
			];
			this.NORTH = 0;
			this.EAST  = 2;
			this.SOUTH = 4;
			this.WEST  = 6;
		}
		translate(x,y,dir,dist) {
			x += this.add[dir].x * dist;
			y += this.add[dir].y * dist;
			return [x,y];
		}
		left(dir) {
			console.assert( this.validate(dir) );
			return (dir+8-2) % 8;
		}
		right(dir) {
			console.assert( this.validate(dir) );
			return (dir+8+2) % 8;
		}
		straight(dir) {
			console.assert( this.validate(dir) );
			return dir;
		}
		reverse(dir) {
			console.assert( this.validate(dir) );
			return (dir+8+4) % 8;
		}
		validate(dir) {
			return Number.isInteger(dir) && dir >=0 && dir < 8;
		}
	}


	class Rect2d {
		set(x,y,xLen,yLen) {
			Coordinate.validateMany(x,y,xLen,yLen);
			this.x = x;
			this.y = y;
			this.xLen = xLen;
			this.yLen = yLen;
		}		
		get xMin() { return this.x; }
		get xMax() { return this.x+this.xLen-1; }
		get yMin() { return this.y; }
		get yMax() { return this.y+this.yLen-1; }
		validate() {
			console.assert( Coordinate.validateValue(this.x) );
			console.assert( Coordinate.validateValue(this.y) );
			console.assert( Coordinate.validateValue(this.xLen) );
			console.assert( Coordinate.validateValue(this.yLen) );
		}
		area() {
			return this.xLen * this.yLen;
		}
		contains(x,y,z) {
			return x>=this.xMin && x<=this.xMax && y>=this.yMin && y<=this.yMax;
		}
		extend(x,y) {
			x = Math.floor(x);
			y = Math.floor(y);
			this.validate();
			if( x < this.x ) { this.xLen += this.x-x; this.x = x; }
			if( y < this.y ) { this.yLen += this.y-y; this.y = y; }
			if( x >= this.x + this.xLen ) this.xLen = x - this.x + 1;
			if( y >= this.y + this.yLen ) this.yLen = y - this.y + 1;
		}
		traverse(fn) {
			let count = 0;
			for( let x=0 ; x<this.xLen ; ++x ) {
				for( let y=0 ; y<this.yLen ; ++y ) {
					count += fn(this.x+x,this.y+y,this) ? 1 : 0
				}
			}
			return count;
		}
	}

	class Circle2d {
		set(cx,cy,radius) {
			this.cx = cx;
			this.cy = cy;
			this.radius = radius;
			return this;
		}
		get xMin() {
			return this.cx-this.radius;
		}
		get yMin() {
			return this.cy-this.radius;
		}
		get xLen() {
			return this.radius*2;
		}
		get yLen() {
			return this.radius*2;
		}
		traverse(fn) {
			function strip(sx,ex,y) {
				console.assert(sx<=ex);
				while( sx <= ex ) {
					count += fn(self,sx,y) ? 1 : 0;
					sx++;
				}
			}
			let self = this;
			let count = 0;
			let x = radius;
			let y = 0;
			let radiusError = 1 - x;

			while (x >= y) {
				strip( x0-x, x0+x, y0-y );
				strip( x0-x, x0+x, y0+y );
				strip( x0-y, x0+y, y0-x );
				strip( x0-y, x0+y, y0+x );
				y++;
				if (radiusError < 0) {
					radiusError += 2 * y + 1;
				}
				else {
					x--;
					radiusError+= 2 * (y - x + 1);
				}
			}
			return count;
		}
	}


	class Map2d extends Rect2d {
		constructor(tileList,_unknown) {
			super();
			this.spot = [];
			this.tile = tileList;
			this.UNKNOWN = _unknown || this.tile.UNKNOWN;
			console.assert( this.tile && this.UNKNOWN );
		}
		set(x,y,xLen,yLen) {
			super.set(x,y,xLen,yLen);
			this.fillWeak(this.UNKNOWN);
			return this;
		}
		getVal(x,y,key=null) {
			console.assert( Coordinate.validateMany(x,y) );
			x = Math.floor(x);
			y = Math.floor(y);
			if( !this.spot[x] ) {
				return;
			}
			if( !this.spot[x][y] ) {
				return;
			}
			return key===null ? this.spot[x][y] : this.spot[x][y][key];
		}
		setVal(x,y,tile,zoneId) {
			console.assert( Coordinate.validateMany(x,y) );
			x = Math.floor(x);
			y = Math.floor(y);
			this.extend(x,y);
			this.spot[x] = this.spot[x] || [];
			this.spot[x][y] = this.spot[x][y] || [];
			if( tile !== null && tile !== undefined ) {
				this.spot[x][y].tile = tile;
			}
			if( zoneId !== null && zoneId !== undefined ) {
				this.spot[x][y].zoneId = zoneId;
			}
			return this;
		}
		getTile(x,y) {
			let tile = this.getVal(x,y,'tile');
			return tile === undefined ? this.UNKNOWN : tile || this.UNKNOWN;
		}
		getZoneId(x,y) {
			let zoneId = this.getVal(x,y,'zoneId');
			return zoneId === undefined ? NO_ZONE : zoneId || NO_ZONE;
		}
		traverse(fn,rect=null) {
			if( rect===null ) {
				rect = this;
			}
			// WARNING: Keep these intermediate variables here because otherwise you might endless loop
			// if an operation expands the xMin and xMax. Also, it is likely faster.
			let sx = rect.xMin;
			let ex = rect.xMax;
			let sy = rect.yMin;
			let ey = rect.yMax;
			for( let x=sx ; x<=ex ; ++x ) {
				for( let y=sy ; y<=ey ; ++ y ) {
					let go = fn.call(this,x,y,this);
					if( go === false ) {
						return this;
					}
				}
			}
			return this;
		}
		fill(tile,zoneId) {
			this.traverse( (x,y) => this.setVal(x,y,tile,zoneId) );
			return this;
		}
		fillWeak(tile,zoneId) {
			this.traverse( (x,y) => {
				let tile = this.getTile(x,y);
				if( !tile || tile==this.UNKNOWN ) {
					this.setVal(x,y,tile,zoneId);
				}
			});
			return this;
		}
		getKnownExtents() {
			let extent = new Rect2d();
			let any = false;
			this.traverse( (x,y) => {
				if( this.getTile(x,y) != this.UNKNOWN ) {
					extent.extend(x,y);
					any = true;
				}
			});
			if( !any ) {
				// Always return at least 1x1
				extent.set(0,0,1,1);
			}
			return extent;
		}
	};

	return {
		Dir: Dir,
		Rect2d: Rect2d,
		Circle2d: Circle2d,
		Map2d: Map2d,
	}

});
