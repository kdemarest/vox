Module.add('head',function() {


	let Rand = Random.Pseudo;

	class Node {
		constructor() {
			this.x = null
			this.y = null;
			this.z = null;
			this.facing   = null;
		}
		set( x, y, z, facing ) {
			console.assert( Coordinate.validateMany(x,y,z) );
			console.assert( Dir.validate(facing) );
			this.x = x;
			this.y = y;
			this.z = z;
			this.facing   = facing;
			return this;
		}
		copy(nodeRef) {
			return Object.assign( this, nodeRef );
		}
		move(dir,slope,dist=1) {
			console.assert( Coordinate.validateValue(this.x) );
			console.assert( Coordinate.validateValue(this.y) );
			console.assert( Number.isInteger(dist) );
			this.x += Dir.add[dir].x * dist;
			this.y += Dir.add[dir].y * dist;
			this.z += slope * dist;
		}
		forward(dist) {
			this.x += Dir.add[this.facing].x * dist;
			this.y += Dir.add[this.facing].y * dist;
			return this;
		}
		left() {
			this.facing = Dir.left(this.facing);
			return this;
		}
		right() {
			this.facing = Dir.right(this.facing);
			return this;
		}
	}

	class Head extends Node {
		constructor() {
			super();
			this.dist     = null;
			this.width    = 1;
			this.loft     = 5;
			this.slope    = 0;
		}
		get halfWidth() {
			return Math.floor(this.width/2);
		}
		copySelf() {
			return (new Head()).copy(this);
		}
		isEdge(i) {
			return i==-this.halfWidth || i==this.halfWidth;
		}
		isCeiling(loft) {
			return loft==this.loft-1;
		}
		isFoot(loft) {
			return loft == 0;
		}
		set( x, y, z, facing, dist, width, loft, slope ) {
			super.set( x, y, z, facing );
			console.assert( Number.isInteger(dist) && dist >= 0 );
			console.assert( Number.isInteger(width) && width >=1 );
			console.assert( Number.isInteger(loft) && loft >=1 );
			console.assert( Number.isFinite(slope) );
			this.dist     = dist;
			this.width    = width;
			this.loft     = loft;
			this.slope    = slope;
			return this;
		}
		advance(dist=1) {
			return this.move( this.facing, this.slope, dist );
		}
	}

	return {
		Node: Node,
		Head: Head,
	}

});
