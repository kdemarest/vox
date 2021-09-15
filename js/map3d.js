Module.add('map3d',function(extern) {

	let Rand = Random.Pseudo;


	let ZoneChar = ' 0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
	let NO_ZONE = -1;

	class Point3d {
		set(x,y,z) {
			Coordinate.validateMany(x,y,z);
			this.x = x;
			this.y = y;
			this.z = z;	
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
		get xMax() { return this.x+this.xLen-1; }
		get yMin() { return this.y; }
		get yMax() { return this.y+this.yLen-1; }
		get zMin() { return this.z; }
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
			if( x < this.x ) { this.xLen += this.x-x; this.x = x; }
			if( y < this.y ) { this.yLen += this.y-y; this.y = y; }
			if( z < this.z ) { this.zLen += this.z-z; this.z = z; }
			if( x >= this.x + this.xLen ) { this.xLen = x - this.x + 1; }
			if( y >= this.y + this.yLen ) { this.yLen = y - this.y + 1; }
			if( z >= this.z + this.zLen ) { this.zLen = z - this.z + 1; }
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
	Rect3d: Rect3d,
	Map3d: Map3d,
}

});
