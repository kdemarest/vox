Module.add('dataWright',function() {

	let Rand = Random.Pseudo;

	let Block = {
		UNKNOWN: {
			symbol: '?',
			isUnknown: true,
			toBLOCK: 'AIR',
		},
		AIR: {
			symbol: ' ',
			isAir: true,
			toBLOCK: 'AIR',
		},
		FLOOR: {
			symbol: '.',
			isFloor: true,
			toBLOCK: 'PLANK',
		},
		WALL: {
			symbol: '#',
			isWall: true,
			toBLOCK: 'DIRT',
		},
		STAIR: {
			symbol: '=',
			isStair: true,
			toBLOCK: 'PLANK',
		},
		DOOR: {
			symbol: '+',
			isDoor: true,
			toBLOCK: 'GOLD',
		},
		WINDOW: {
			symbol: '^',
			isWindow: true,
			toBLOCK: 'WINDOW',
		},
		FLUID: {
			symbol: '~',
			isFluid: true,
			toBLOCK: 'WATER',
		},
	}

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
			console.assert( Number.isInteger(dist) && dist > 0 );
			this.x += Dir.add[dir].x * dist;
			this.y += Dir.add[dir].y * dist;
			this.z += slope * dist;
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

	class NodeList {
		constructor() {
			this.nodeList = [];
		}
		add(node) {
			this.nodeList.push(node);
		}
		get extent2d() {
			let rect2d = new Rect2d();
			rect2d.set(0,0,0,0);
			this.nodeList.forEach( node => {
				rect2d.extend(node.x,node.y);
			});
			return rect2d;
		}
		find(x,y,z=null) {
			let result = [];
			this.nodeList.forEach( node => {
				if( node.x==x && node.y==y && (z===null || node.z==z) ) {
					if( result.length <= 0 || result[0].z < node.z ) {
						result.push(node);
					}
					else {
						result.unshift(node);
					}
				}
			});
			return result;
		}
		filter(testFn) {
			let p = new NodeList();
			this.traverse( node=>testFn(node) ? p.add(node) : null );
			return p;
		}
		traverse(fn) {
			this.nodeList.forEach( node => fn(node) );
		}
	}

	class Zone {
		constructor(zoneId,details) {
			this.zoneId  = zoneId;
			this.details = details;
		}
	}

	class ZoneList {
		constructor() {
			this.list = [];
			this.zoneId = 0;
		}
		increment() {
			this.zoneId += 1;
			return this.zoneId;
		}
		add(zone) {
			this.list.unshift(zone);
		}
	}

	class Rake {
		set(dir,x,y,z,width,loft) {
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
			return this;
		}
		stripe(fn,z=this.z,dist=0) {
			let d = Dir.add[Dir.right(this.dir)];
			let x = this.x;
			let y = this.y;
			for( let i=0 ; i<=this.width ; ++i ) {
				for( let loft = 0 ; loft<=this.loft ; ++loft ) {
					let ok = fn(Math.floor(x),Math.floor(y),Math.floor(z+loft),i,loft,dist);
					if( ok === false ) {
						return false;
					}
				}
				x += d.x;
				y += d.y;
			}
		}
		traverse(fn) {
			return this.stripe(fn,this.z,0);
		}
	}

	class RakePath extends Rake {
		set(dir,x,y,z,width,loft,dist,slope) {
			super.set(dir,x,y,z,width,loft);
			console.assert( Number.isInteger(dist) && dist >= 0 );
			console.assert( Number.isFinit(slope) && slope >= -9999 && slope <= 9999 );
			this.dist  = dist;
			this.slope = slope;
			return this;
		}
		traverse(fn) {
			let z = this.z;
			for( let d=0 ; d<this.dist ; ++d ) {
				let ok = this.stripe( fn, z, d );
				if( ok === false ) {
					return false;
				}
				z += this.slope;
			}
		}
	}

	class ChanceTo {
		constructor(chance100) {
			this.chance100 = chance100;
		}
		test() {
			return Rand.chance100(this.chance100);
		}
	}

	class Range {
		constructor(min,max,curve='intRange') {
			console.assert( Rand[curve] );
			if( curve=='intRange' ) {
				console.assert( Number.isInteger(min) && Number.isInteger(max) );
			}
			console.assert( min<=max );
			this.min = min;
			this.max = max;
			this.curve = curve;
		}
		roll() {
			return Rand[this.curve](this.min,this.max);
		}
	}

	class PathControls {
		constructor() {
			this.setDefaults();
		}
		setDefaults() {
			this.rgDist      = new Range(1,5,'intRange');
			this.ctTurn      = new ChanceTo(50);
			this.ctRise      = new ChanceTo(30);
			this.ctFall      = new ChanceTo(30);
			this.rgSlope     = new Range(0.5,1.0,'floatRange');
			this.rgSlopeDist = new Range(1,5,'intRange');
			this.ctWiden     = new ChanceTo(50);
			this.rgWidth     = new Range(1,5,'intRange');
			this.roofMin     = 5;
			return this;
		}
		set(parameters) {
			for( let member in parameters ) {
				console.assert( this[member].constructor.name == parameters[member].constructor.name );
			}
			Object.assign( this, parameters );
			return this;
		}
	}

	let Driver = {};

	Driver.Base = class {
		constructor(map) {
			this.map  = map;
			this.headStack = [new Head()];
			this.nodeList = new NodeList();
			this.zoneList = new ZoneList();
			this.remaining = 0;
		}
		get isDone() {
			return this.remaining <= 0;
		}
		get zone() {
			return this.zoneList.list[0];
		}
		get head() {
			return this.headStack[0];
		}
		rayHit(dir,rx,ry,rz,width,loft,slope) {
			console.assert( Coordinate.validateMany(x,y) );
			console.assert( dir === Dir.NORTH || dir === Dir.EAST || dir === Dir.SOUTH || dir === Dir.WEST );
			if( dir === this.facingForbidden ) {
				return 0;
			}
			let distFound = Number.MAX_VALUE;
			// TO DO : vary the distance by actual dist to edge of map.
			let rake = new RakePath().set(dir,x,y,z,width,loft,slope,20);
			rake.traverse( (x,y,z,i,loft,dist) => {
				let block = this.map.getVal(x,y,z,'block');
				if( !block.isUnknown ) {
					distFound = dist-1;
					return false;
				}
			});

			return distFound < Number.MAX_VALUE ? distFound : true;
		}
	}

	Driver.StraightLine = class extends Driver.Base {
		init(map,pathLength,pathControls) {
			this.map = map;
			// set( x, y, z, facing, dist, width, loft, slope )
			this.head.set( this.map.xMin+1, this.map.yHalf, this.map.zHalf, Dir.EAST, 0, 3, 5, 0 );
			this.pathControls = pathControls || new PathControls().setDefaults();
			this.remaining    = pathLength;
			return this;
		}
		steer() {
			let p = this.pathControls;

			let dist      = p.rgDist.roll();
			let turn      = p.ctTurn.test();
			let slopeMult = p.ctRise.test() ? 1 : p.ctFall.test() ? -1 : 0;
			let slope     = slopeMult==0 ? 0 : p.rgSlope.roll() * slopeMult;
			let slopeDist = slopeMult==0 ? 0 : p.rgSlopeDist.roll();
			let width     = p.ctWiden.test() || this.head.width<=0 ? p.rgWidth.roll() : this.head.width;

			this.head.dist   = dist;
			this.head.turn   = turn;
			this.head.width  = Math.max( 1, Math.min( Math.floor(this.head.dist/2), width ) );
			this.head.facing = Dir.EAST;

			console.log( "Steer dist="+this.head.dist+" width="+this.head.width );
		}
		advancePath() {

			// set(x,y,z,dir,width,loft,slope)
			let h = this.head;
			let rake = new Rake().set( h.facing, h.x, h.y, h.z, h.width, h.loft );
			rake.traverse( (x,y,z,i,loft) => {
				let block = loft==0 ? this.map.block.FLOOR : this.map.block.AIR;
				this.map.setVal(x,y,z,block);
			});

			this.head.advance(1);
			this.head.dist -= 1;
		}

		buildPath() {
			if( this.remaining <= 0 ) {
				debugger;
				return false;
			}
			if( this.head.dist <= 0 ) {
				this.steer();
			}

			this.advancePath();
			this.remaining -= 1;
		}

		advance() {
			let result = this.buildPath();
			return result;
		}
	}
/*
	let Decider = {};

	Decider.Gen = class {
		constructor(driver,distMin,distMax,widthMin) {
			this.driver   = driver;
			this.distMin  = distMin;
			this.distMax  = distMax;
			this.widthMin = widthMin;
		}
		pickStraight(x,y,dir) {
			while( this.width >= this.widthMin ) {
				let ray = this.driver.rayHit( x, y, dir, this.width );
				if( ray === true ) {
					return dir;
				}
				this.width -= 1;
			}
			return false;
		}
		pickTurn(x,y,dir) {
			while( this.width >= this.widthMin ) {
				let left = Dir.left(dir);
				let right = Dir.right(dir);
				let leftRay  = this.driver.rayHit( x, y, left,  this.width );
				let rightRay = this.driver.rayHit( x, y, right, this.width );
				if( leftRay === true && rightRay === true ) {
					return Rand.chance100(50) ? left : right;
				}
				if( leftRay === true ) {
					return left;
				}
				if( rightRay === true ) {
					return right;
				}
				this.width -= 1;
				if( this.isRoom ) {		// crazy convenient violation of coding norms.
					this.dist -= 2;
				}
			}
			return false;
		}
	}

	Decider.Hall = class extends Decider.Gen {
		constructor(driver) {
			super(driver,1,6,0);
			this.chanceToTurnAtStart = 50;
		}
		get isRoom() { return false; }
		get isHall() { return true; }
		init() {
			this.turn       = Rand.chance100(this.chanceToTurnAtStart);
			this.dist       = Math.min( this.driver.remaining, Rand.intRange(this.distMin,this.distMax) );
			this.width      = Math.min( Math.floor((this.dist-1)/2), Rand.intRange( this.widthMin, this.widthMin+2 ) );
			if( this.turn && this.dist < this.width+2 ) {
				this.dist = this.width+2;
			}
			return this.dist >= this.distMin;
		}
	}

	Decider.Room = class extends Decider.Gen {
		constructor(driver) {
			super(driver,3,6,1);
		}
		get isRoom() { return true; }
		init() {
			this.turn       = false;
			this.dist       = Math.min( this.driver.remaining, Rand.intRange(this.distMin,this.distMax) );
			this.width      = Math.max(0, Math.floor( (this.dist-1) / 2 ) );
			return this.dist >= this.distMin;
		}
	}

	Driver.Winding = class extends Driver.StraightLine {
		init(pathLength) {
			super.init(pathLength);
			this.facingForbidden = Dir.reverse(this.head.facing);
		}

		steer() {
			let gen;
			let facing = false;

			let beRoom = !this.head.isRoom;
			if( beRoom ) {
				gen = new Decider.Room(this)
				gen.init();
				facing = gen.pickStraight(this.head.x,this.head.y,this.head.facing);
			}

			if( !beRoom || facing === false ) {
				gen = new Decider.Hall(this)
				gen.init();
				if( gen.turn ) {
					facing = gen.pickTurn(this.head.x,this.head.y,this.head.facing);
					if( facing === false ) {
						gen.turn = false;	// go straight; a turn wasn't possible
					}
				}
				if( !gen.turn )  {
					facing = gen.pickStraight(this.head.x,this.head.y,this.head.facing);
					if( facing === false ) {
						debugger;
						gen.width = 0;
						let temp = gen.pickStraight(this.head.x,this.head.y,this.head.facing);
					}
				}
			}
			Dir.validate(facing);
			console.assert( facing !== false );

			let zoneId = this.zoneList.increment();
			this.zoneList.add( new Zone(zoneId,gen) );
			this.head.zoneId = zoneId;
			this.head.steps  = gen.dist;
			this.head.width  = gen.width;
			this.head.gapEntry = this.head.facing;	// WARNING: set this before setting head.facing!
			this.head.gapExit  = facing;
			this.head.facing   = facing;
			this.head.isRoom = gen.isRoom;
			let policy = this.head.policy;
			if( !this.head.isRoom ) {
				policy.isNarrow = this.head.width>0 ? false : Rand.chance100(50) ? policy.isNarrow : !policy.isNarrow;
			}
		}
	}
*/

	class Wright {
		constructor() {
		}
		init(xLen,yLen,zLen) {
			this.map = new Map3d(Block);
			this.map.set(0,0,0,xLen,yLen,zLen);

			this.driver = new Driver.StraightLine();
			this.driver.init(this.map,10,null);
			return this;
		}
		tick() {
			if( !this.driver.isDone ) {
				this.driver.advance();
				this._renderFn(this.map);
			}
		}
	}

	return {
		Wright: Wright
	}
});
