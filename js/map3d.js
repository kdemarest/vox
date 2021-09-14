Module.add('map3d',function(extern) {

	let Rand = Random.Pseudo;

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
		left(dir) {
			console.assert( this.validate(dir) );
			return (dir+8-2) % 8;
		}
		right(dir) {
			console.assert( this.validate(dir) );
			return (dir+8+2) % 8;
		}
		reverse(dir) {
			console.assert( this.validate(dir) );
			return (dir+8+4) % 8;
		}
		validate(dir) {
			return Number.isInteger(dir) && dir >=0 && dir < 8;
		}
	}

	let ZoneChar = ' 0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
	let NO_ZONE = -1;

	let Coordinate = new class {
		validateValue(n) {
			return Number.isFinite(n);
		}
		validateMany(...args) {
			let ok = true;
			for( let i=0 ; i<args.length ; ++i ) {
				ok = ok && this.validateValue(args[i]);
			}
			return ok;
		}
		validateRange(a,b) {
			return
				this.validateValue(a) &&
				this.validateValue(b) &&
				a<=b;
		}
	}();


	class Rect2d {
		set(x,y,xLen,yLen) {
			Coordinate.validateMany(x,y,xLen,yLen);
			this.x = x;
			this.y = y;
			this.xLen = xLen;
			this.yLen = yLen;
		}		
		validate() {
			console.assert( Coordinate.validateValue(this.x) );
			console.assert( Coordinate.validateValue(this.y) );
			console.assert( Coordinate.validateValue(this.xLen) );
			console.assert( Coordinate.validateValue(this.yLen) );
		}
		extend(x,y) {
			x = Math.floor(x);
			y = Math.floor(y);
			this.validate();
			if( x < this.x ) this.x = x;
			if( y < this.y ) this.y = y;
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

	class Rect3d {
		set(x,y,z,xLen,yLen,zLen) {
			Coordinate.validateMany(x,y,z,xLen,yLen,zLen);
			this.x = x;
			this.y = y;
			this.z = z;
			this.xLen = xLen;
			this.yLen = yLen;
			this.zLen = zLen;
		}
		get xMin() { return this.x; }
		get yMin() { return this.y; }
		get zMin() { return this.z; }
		get xMax() { return this.x+this.xLen-1; }
		get yMax() { return this.y+this.yLen-1; }
		get zMax() { return this.z+this.zLen-1; }
		get xHalf() { return this.x+Math.floor(this.xLen/2); }
		get yHalf() { return this.y+Math.floor(this.yLen/2); }
		get zHalf() { return this.z+Math.floor(this.zLen/2); }
		validate() {
			console.assert( Coordinate.validateValue(this.x) );
			console.assert( Coordinate.validateValue(this.y) );
			console.assert( Coordinate.validateValue(this.z) );
			console.assert( Coordinate.validateValue(this.xLen) );
			console.assert( Coordinate.validateValue(this.yLen) );
			console.assert( Coordinate.validateValue(this.zLen) );
		}
		contains(x,y,z) {
			return x>=this.xMin && x<=this.xMax && y>=this.yMin && y<=this.yMax && z>=this.zMin && z<=this.zMax;
		}
		extend(x,y,z) {
			x = Math.floor(x);
			y = Math.floor(y);
			z = Math.floor(z);
			this.validate();
			if( x < this.x ) this.x = x;
			if( y < this.y ) this.y = y;
			if( z < this.z ) this.z = z;
			if( x >= this.x + this.xLen ) this.xLen = x - this.x + 1;
			if( y >= this.y + this.yLen ) this.yLen = y - this.y + 1;
			if( z >= this.z + this.zLen ) this.zLen = z - this.z + 1;
		}
		traverse2d(fn) {
			let count = 0;
			for( let x=0 ; x<this.xLen ; ++x ) {
				for( let y=0 ; y<this.yLen ; ++y ) {
					count += fn(this.x+x,this.y+y,this) ? 1 : 0
				}
			}
			return count;
		}
		traverse(fn) {
			let count = 0;
			for( let x=0 ; x<this.xLen ; ++x ) {
				for( let y=0 ; y<this.yLen ; ++y ) {
					for( let z=0 ; z<this.zLen ; ++z ) {
						count += fn(this.x+x,this.y+y,this.z+z,this) ? 1 : 0
					}
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

	class Map3d extends Rect3d {
		constructor(blockList) {
			super();
			this.spot = [];
			this.block = blockList;
			console.assert( this.block );
		}
		attach(otherMap3d) {
			this.spot = otherMap3d.spot;
			this.isAttached = true;
		}
		set(x,y,z,xLen,yLen,zLen) {
			super.set(x,y,z,xLen,yLen,zLen);
			this.fillWeak(this.block.UNKNOWN);
			return this;
		}
		getVal(x,y,z,key) {
			console.assert( Coordinate.validateMany(x,y,z) );
			x = Math.floor(x);
			y = Math.floor(y);
			z = Math.floor(z);
			if( !this.spot[x] ) {
				return;
			}
			if( !this.spot[x][y] ) {
				return;
			}
			if( !this.spot[x][y][z] ) {
				return;
			}
			return key===undefined ? this.spot[x][y][z] : this.spot[x][y][z][key];
		}
		setVal(x,y,z,block,zoneId) {
			console.assert( Coordinate.validateMany(x,y,z) );
			x = Math.floor(x);
			y = Math.floor(y);
			z = Math.floor(z);
			this.extend(x,y,z);
			this.spot[x] = this.spot[x] || [];
			this.spot[x][y] = this.spot[x][y] || [];
			this.spot[x][y][z] = this.spot[x][y][z] || {};
			if( block !== null && block !== undefined ) {
				this.spot[x][y][z].block = block;
			}
			if( zoneId !== null && zoneId !== undefined ) {
				this.spot[x][y][z].zoneId = zoneId;
			}
			return this;
		}
		getBlock(x,y,z) {
			let block = this.getVal(x,y,z,'block');
			return block === undefined ? this.block.UNKNOWN : block || this.block.UNKNOWN;
		}
		getZoneId(x,y,z) {
			let zoneId = this.getVal(x,y,z,'zoneId');
			return zoneId === undefined ? NO_ZONE : zoneId || NO_ZONE;
		}
		areaXY() {
			return this.xLen * this.yLen;
		}
		areaXYZ() {
			return this.xLen * this.yLen * this.zLen;
		}
		traverse(fn,rect) {
			if( !rect ) {
				rect = this;
			}
			// WARNING: Keep these intermediate variables here because otherwise you might endless loop
			// if an operation expands the xMin and xMax. Also, it is likely faster.
			let sx = rect.xMin;
			let ex = rect.xMax;
			let sy = rect.yMin;
			let ey = rect.yMax;
			let sz = rect.zMin;
			let ez = rect.zMax;
			for( let x=sx ; x<=ex ; ++x ) {
				for( let y=sy ; y<=ey ; ++ y ) {
					for( let z=sz ; z<=ez ; ++ z ) {
						let go = fn.call(this,x,y,z,this);
						if( go === false ) {
							return this;
						}
					}
				}
			}
			return this;
		}
		fill(block,zoneId) {
			this.traverse( (x,y,z) => this.setVal(x,y,z,block,zoneId) );
			return this;
		}
		fillWeak(block,zoneId) {
			this.traverse( (x,y,z) => {
				let block = this.getBlock(x,y,z);
				if( !block || block.isUnknown ) {
					this.setVal(x,y,z,block,zoneId);
				}
			});
			return this;
		}
		getKnownExtents() {
			let extent = new Rect3d();
			let any = false;
			this.traverse( (x,y,z) => {
				if( !this.getBlock(x,y,z).isUnknown ) {
					extent.extend(x,y,z);
					any = true;
				}
			});
			if( !any ) {
				// Always return at least 1x1
				extent.set(0,0,0,1,1,1);
			}
			return extent;
		}
	};

return {
	Dir: Dir,
	Coordinate: Coordinate,
	Rect2d: Rect2d,
	Rect3d: Rect3d,
	Map3d: Map3d,
}

});
