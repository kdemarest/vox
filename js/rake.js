Module.add('rake',function() {

	let FLAG = {
		LWALL:	1,
		RWALL:	2,
		FLOOR:	4,
		ROOF:	8,
		START:	16,
		END:	32,
		EDGE:	64,
		SHEATH:	128,
		CORNER:	256,
		STAIRS:	512,
	};

	class Rake {
		set(dir,x,y,z,width,loft,sheathXY=0,sheathZ=0) {
			console.assert( Dir.validate(dir) );
			console.assert( Coordinate.validateMany(x,y,z) );
			console.assert( Number.isInteger(width) && width > 0 && width < 1000 );
			console.assert( Number.isInteger(loft) && loft > 0 && loft < 1000 );

			this.dir = dir;
			this.x = x;
			this.y = y;
			this.z = z;
			this.width = width;
			this.loft = loft;
			this.sheathXY = sheathXY;
			this.sheathZ = sheathZ;
			return this;
		}
		get halfWidth() {
			return Math.floor(this.width/2);
		}
		stripe(fn,dist=0,distTotal=0) {
			let ahead = Dir.add[this.dir];
			let right = Dir.add[Dir.right(this.dir)];
			let hw = this.halfWidth;
			let x = this.x + ahead.x*dist - right.x*(hw+this.sheathXY);
			let y = this.y + ahead.y*dist - right.y*(hw+this.sheathXY);
			let z = this.z;
			let flagSE = (dist<0 ? FLAG.START : 0) | (dist>=distTotal ? FLAG.END : 0);

			for( let i=-(hw+this.sheathXY) ; i<=hw+this.sheathXY ; ++i ) {
				let flagLR = flagSE;
				flagLR |= (i==-hw || i==hw) ? FLAG.EDGE : 0;
				flagLR |= (i<-hw || i>hw) ? FLAG.SHEATH : 0;
				flagLR |= (i<-hw ? FLAG.LWALL : 0) | (i>hw ? FLAG.RWALL : 0 );
				for( let loft = -this.sheathZ ; loft<this.loft+this.sheathZ ; ++loft ) {
					let flags = flagLR;
					flags |= (loft==-1 ? FLAG.FLOOR : 0) | (loft>this.loft-1 ? FLAG.ROOF : 0);
					let ok = fn(Math.floor(x),Math.floor(y),Math.floor(z+loft),dist,loft,i,flags);
					if( ok === false ) {
						return false;
					}
				}
				x += right.x;
				y += right.y;
			}
		}
		traverse(fn) {
			return this.stripe(fn,0,0);
		}
	}

	class RakePath extends Rake {
		set(dir,x,y,z,dist,loft,width,slope,sheathXY,sheathZ,capNear,capFar) {
			super.set(dir,x,y,z,width,loft,sheathXY,sheathZ);
			console.assert( Number.isInteger(dist) && dist >= 0 );
			console.assert( typeof slope=='function' || (Number.isFinite(slope) && slope >= -9999 && slope <= 9999) );
			this.dist		= dist;
			this.slope		= slope;
			this.capNear	= capNear;
			this.capFar		= capFar;
			return this;
		}
		traverse(fn) {
			console.log('this.z=',this.z);
			for( let dist=-this.capNear ; dist<this.dist+this.capFar ; ++dist ) {
				this.z += (typeof this.slope == 'function') ? this.slope(dist) : this.slope;
				console.log('after slope this.z=',this.z);
				let ok = this.stripe( fn, dist, this.dist );
				if( ok === false ) {
					return false;
				}

			}
		}
	}

	class RakeReach {
		set(dir,x,y,z) {
			console.assert( Dir.validate(dir) );
			console.assert( Coordinate.validateMany(x,y,z) );
			this.dir = dir;
			this.x = x;
			this.y = y;
			this.z = z;
			return this;
		}
		detect(blockMap,limit0,limit1) {
			let maxReach = 16;
			let reach = [];

			let lateralLimit = Math.min(8,limit0,limit1);
			let ahead = Dir.add[this.dir];
			let right = Dir.add[Dir.right(this.dir)];
			let iOffset = [0, -1, 1, -2, 2, -3, 3, -4, 4, -5, 5, -6, 6, -7, 7, -8, 8, -9, 9 ];

			// WARNING! We do not loft at this time! That is because we expect to conver this to use
			// a 2d map of cached blocks.

			for( let d=0 ; d<maxReach ; ++d ) {
				let mustBeWall = (d==0);
				let i = 0;
				while( Math.abs(iOffset[i]) < lateralLimit ) {
					let x = this.x + ahead.x*d - right.x*iOffset[i];
					let y = this.y + ahead.y*d - right.y*iOffset[i];
					let block = blockMap.getBlock( x, y, this.z );
					if( !blockMap.contains(x,y,this.z) || (!mustBeWall && !block.isUnknown) || (mustBeWall && block.passable) ) {
						lateralLimit = Math.abs( iOffset[i] );
						break;
					}
					i += 1;
				}
				reach[d] = Math.max(0,lateralLimit*2-1);
			}
			return reach;
		}
		traverse(dist,width,distStartOffset,fn) {
			let hw = Math.floor(width/2);
			let ahead = Dir.add[this.dir];
			let right = Dir.add[Dir.right(this.dir)];

			for( let d=0+distStartOffset ; d<dist ; ++d ) {
				for( let i=0 ; i<width ; ++i ) {
					let x = this.x + ahead.x*d - right.x*(i-hw);
					let y = this.y + ahead.y*d - right.y*(i-hw);

					fn( x, y, this.z, d, i, i-hw );
				}
			}
		}
	}

	return {
		FLAG: FLAG,
		RakePath: RakePath,
		RakeReach: RakeReach,
	}
});
