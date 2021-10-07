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
			return this;
		}
		setMinMax(xMin,yMin,zMin,xMax,yMax,zMax) {
			Coordinate.validateMany(xMin,yMin,zMin,xMax,yMax,zMax);
			this.x = Math.min(xMin,xMax);
			this.y = Math.min(yMin,yMax);
			this.z = Math.min(zMin,zMax);
			this.xLen = Math.abs(xMax-xMin)+1;
			this.yLen = Math.abs(yMax-yMin)+1;
			this.zLen = Math.abs(zMax-zMin)+1;
			return this;
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

	class OrientedRect3d {
		set(xOrigin,yOrigin,zOrigin,facing,length,width,zDeep,zTall) {
			Coordinate.validateMany(xOrigin,yOrigin,zOrigin,length,width,zDeep,zTall);
			this.xOrigin = xOrigin;
			this.yOrigin = yOrigin;
			this.zOrigin = zOrigin;
			this.facing  = facing;
			this.length  = length;
			this.width   = width;
			this.zDeep   = zDeep;
			this.zTall   = zTall;
			this._rect3d = null;
			return this;
		}
		get halfWidth() {
			return Math.floor(this.width/2);
		}
		validate() {
			console.assert( Coordinate.validateValue(this.xOrigin) );
			console.assert( Coordinate.validateValue(this.yOrigin) );
			console.assert( Coordinate.validateValue(this.zOrigin) );
			console.assert( Coordinate.validateValue(this.length) );
			console.assert( Coordinate.validateValue(this.width) );
			console.assert( Coordinate.validateValue(this.zDeep) );
			console.assert( Coordinate.validateValue(this.zTall) );
		}
		toCoord(u,v,w) {
			let x = this.xOrigin + (Dir.add[this.facing].x * u) + (Dir.add[Dir.right(this.facing)].x * w);
			let y = this.yOrigin + (Dir.add[this.facing].y * u) + (Dir.add[Dir.right(this.facing)].y * w);
			let z = this.zOrigin + v;
			return [x,y,z];
		}
		get rect3d() {
			if( !this._rect3d ) {
				let c0 = this.toCoord(0,this.zDeep,-this.halfWidth);
				let c1 = this.toCoord(this.length,this.zTall,this.halfWidth);
				this.cachedRect = new Rect3d().set(
					Math.min(c0[0],c1[0]),
					Math.min(c0[1],c1[1]),
					Math.min(c0[2],c1[2]),
					Math.abs(c0[0]-c1[0])+1,
					Math.abs(c0[1]-c1[1])+1,
					Math.abs(c0[2]-c1[2])+1
				);
			}
			return this._rect3d;
		}
		containsXYZ(x,y,z) {
			let r = this.rect3d;
			return r.contains(x,y,z);
		}
		containsUVW(u,v,w) {
			return u>=0 && u<this.length && w>=-this.halfWidth && w>=this.halfWidth && v>=this.zDeep && v<=this.zTall;
		}
		traverseXYZ(fn) {
			return this.rect3d.traverse(fn);
		}
		traverseUVW(fn) {
			let count = 0;
			for( let u=0 ; u<this.length ; ++u ) {
				for( let w=-this.halfWidth ; w<=this.halfWidth ; ++w ) {
					for( let v=this.zDeep ; v<this.zTall ; ++v ) {
						count += fn(u,v,w,this) ? 1 : 0
					}
				}
			}
			return count;
		}
	}

	class Map3d extends Rect3d {
		constructor(blockType) {
			super();
			this.spot = [];
			this.blockType = blockType;
			console.assert( this.blockType );
		}
		attach(otherMap3d) {
			this.spot = otherMap3d.spot;
			this.isAttached = true;
		}
		set(x,y,z,xLen,yLen,zLen) {
			super.set(x,y,z,xLen,yLen,zLen);
			this.fillWeak(this.blockType.UNKNOWN);
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
		setVal(x,y,z,...keyValuePair) {
			console.assert( Coordinate.validateMany(x,y,z) );
			x = Math.floor(x);
			y = Math.floor(y);
			z = Math.floor(z);
			this.extend(x,y,z);
			this.spot[x] = this.spot[x] || [];
			this.spot[x][y] = this.spot[x][y] || [];
			this.spot[x][y][z] = this.spot[x][y][z] || {};
			for( let i=0 ; i < keyValuePair.length ; i += 2 ) {
				let key		= keyValuePair[i];
				let value	= keyValuePair[i+1];
				if( value !== null && value !== undefined ) {
					this.spot[x][y][z][key] = value;
				}
			}
			return this;
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
	NO_ZONE: NO_ZONE,
}

});
