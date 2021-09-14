Module.add('dataWright',function() {

	let Rand = Random.Pseudo;

	let Block = {
		UNKNOWN: {
			isUnknown: true,
			toBLOCK: 'AIR',
		},
		AIR: {
			isAir: true,
			toBLOCK: 'AIR',
		},
		FLOOR: {
			isFloor: true,
			toBLOCK: 'PLANK',
		},
		WALL: {
			isWall: true,
			toBLOCK: 'DIRT',
		},
		STAIR: {
			isStair: true,
			toBLOCK: 'PLANK',
		},
		DOOR: {
			isDoor: true,
			toBLOCK: 'GOLD',
		},
		WINDOW: {
			isWindow: true,
			toBLOCK: 'WINDOW',
		},
		FLUID: {
			isFluid: true,
			toBLOCK: 'WATER',
		},
		MARKER: {
			isMarker: true,
			toBLOCK: 'IRON',
		},
		LIGHT: {
			isLight: true,
			toBLOCK: 'TORCH',
		}

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
			console.assert( Number.isInteger(dist) && dist >= 0 );
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
			console.assert( !this.list[zone.zoneId] );
			this.list[zone.zoneId] = zone;
		}
	}

	let FLAG = {
		LWALL:	1,
		RWALL:	2,
		FLOOR:	4,
		ROOF:	8,
		START:	16,
		END:	32
	};

	class ChanceTo {
		constructor(chance100) {
			this.chance100 = chance100;
		}
		test() {
			return Rand.chance100(this.chance100);
		}
	}

	class Range {
		constructor(rMin,rMax,curve='intRange',offset=0,stride=1) {
			console.assert( Rand[curve] );
			if( curve=='intRange' || curve=='intBell' ) {
				console.assert( Number.isInteger(rMin) && Number.isInteger(rMax) );
				console.assert( Number.isInteger(offset) && Number.isInteger(stride) );
			}
			console.assert( rMin<=rMax );
			this.rMin = rMin;
			this.rMax = rMax;
			this.curve = curve;
			this.offset = offset;
			this.stride = stride;
		}
		get min() {
			return this.offset+this.rMin*this.stride;
		}
		get max() {
			return this.offset+this.rMax*this.stride;
		}
		roll() {
			return this.offset+Rand[this.curve](this.rMin,this.rMax)*this.stride;
		}
	}

	class Often {
		constructor(chance100,value,otherRoller) {
			this.chance100 = chance100;
			this.value = value;
			this.otherRoller = otherRoller;
		}
		roll() {
			return Rand.chance100(this.chance100) ? this.value : this.otherRoller.roll();
		}
	}

	class PathControls {
		constructor() {
			this.setDefaults();
		}
		setDefaults() {
			this.rgDist      = new Range(2,20,'intBell');
			this.ctTurn      = new ChanceTo(50);
			this.ctRise      = new ChanceTo(30);
			this.ctFall      = new ChanceTo(30);
			this.rgSlope     = new Often(50,1,new Range(1/4,1,'floatRange'));
			this.ctWiden     = new ChanceTo(100);
			this.rgWidth     = new Range(0,3,'intRange',1,2);
			this.roofMin     = 5;
			this.lightSpacing = 20;
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

	class Rake {
		set(dir,x,y,z,width,loft,sheath=0) {
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
			this.sheath = sheath;
			return this;
		}
		get fullWidth() {
			return this.width+(this.sheath*2);
		}
		stripe(fn,z=this.z,dist=0,distTotal=0) {
			let ahead = Dir.add[this.dir];
			let right = Dir.add[Dir.right(this.dir)];
			let hw = Math.floor(this.width/2);
			let x = this.x + ahead.x*dist - right.x*(hw+this.sheath);
			let y = this.y + ahead.y*dist - right.y*(hw+this.sheath);
			let flagSE = (dist<0 ? FLAG.START : 0) | (dist>distTotal ? FLAG.END : 0);

			for( let i=-(hw+this.sheath) ; i<=hw+this.sheath ; ++i ) {
				let flagLR = flagSE;
				flagLR |= (i<-hw ? FLAG.LWALL : 0) | (i>hw ? FLAG.RWALL : 0 );
				for( let loft = -this.sheath ; loft<this.loft+this.sheath ; ++loft ) {
					let flags = flagLR;
					flags |= (loft<0 ? FLAG.FLOOR : 0) | (loft>this.loft-1 ? FLAG.ROOF : 0);
					let ok = fn(Math.floor(x),Math.floor(y),Math.floor(z+loft),i,loft,dist,flags);
					if( ok === false ) {
						return false;
					}
				}
				x += right.x;
				y += right.y;
			}
		}
		traverse(fn) {
			return this.stripe(fn,this.z,0,0);
		}
	}

	class RakePath extends Rake {
		set(dir,x,y,z,width,loft,dist,slope,sheath,capNear,capFar) {
			super.set(dir,x,y,z,width,loft,sheath);
			console.assert( Number.isInteger(dist) && dist >= 0 );
			console.assert( typeof slope=='function' || (Number.isFinite(slope) && slope >= -9999 && slope <= 9999) );
			this.dist      = dist;
			this.slope     = slope;
			this.capNear = capNear;
			this.capFar  = capFar;
			this.zFinal = null;
			return this;
		}
		traverse(fn) {
			let z = this.z;
			for( let d=-this.capNear ; d<this.dist+this.capFar ; ++d ) {
				this.zFinal = z;
				let ok = this.stripe( fn, z, d, this.dist );
				if( ok === false ) {
					return false;
				}

				z += (typeof this.slope == 'function') ? this.slope(d) : this.slope;
			}
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
			return this.zoneList.list[this.zoneList.list.length-1];
		}
		get head() {
			return this.headStack[0];
		}
		get last() {
			return this.headStack[0].last;
		}
		getZone(zoneId) {
			return this.zoneList.list[zoneId];
		}
		zoneCreate() {
			let zoneId = this.zoneList.list.length;
			let newZone = new Zone(zoneId);
			this.zoneList.list.push( newZone );
			return newZone;
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
			rake.traverse( (x,y,z,i,loft,dist,flags) => {
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
			this.facingForbidden = Dir.reverse(this.head.facing);
			this.pathControls = pathControls || new PathControls().setDefaults();
			this.remaining    = pathLength;
			return this;
		}
		findSafeTurn(facing) {
			let left  = Dir.left(facing);
			let right = Dir.right(facing);
			let turn;
			if( left == this.facingForbidden ) {
				turn = 'right';
			}
			else
			if( right == this.facingForbidden ) {
				turn = 'left';
			}
			else {
				turn = Rand.chance100(50) ? 'left' : 'right';
			}
			return turn;
		}
		steer() {
			let p = this.pathControls;
			let head = this.head;
			let lastSlope = head.last ? head.last.slope : 0;
			console.log('lastSlope='+lastSlope);
			head.last = (new Head()).copy(head);

			let dist      = p.rgDist.roll();
			let turn      = p.ctTurn.test();
			let slopeMult = (p.ctRise.test() && lastSlope >=0) ? 1 : (p.ctFall.test() && lastSlope<=0) ? -1 : 0;
			let slope     = p.rgSlope.roll() * slopeMult;

			let width;
			if( !turn ) {
				width = Math.max(p.rgWidth.min,head.width);
			}
			else {
				width = p.ctWiden.test() || head.width<p.rgWidth.min ? p.rgWidth.roll() : head.width;
				dist = Math.max(width+1,dist);
			}
			turn = !turn ? turn : this.findSafeTurn(head.facing);

			let wallToggle = !this.zone ? true : !this.zone.wallToggle;
			let zone = this.zoneCreate();
			zone.wallToggle = wallToggle;
			head.zoneId = zone.zoneId;

			head.total  = dist;
			head.dist   = dist;
			head.turn   = turn;
			head.width  = width;
			head.slope  = slope;
			// Note that head.facing does not change yet.

			console.log( "Steer dist="+head.dist+" width="+head.width );
		}
		advancePath() {
			let h = this.head;
			let sheath = 1;
			let capNear = 1;
			let capFar  = 0;
			let Block = this.map.block;
			let turn = h.turn;
			let flagTURN  = (turn=='left' ? 0 : FLAG.LWALL) | (turn=='right' ? 0 : FLAG.RWALL);
			let noSlope   = 0;
			let cornerDist = h.width;
			let entryDist  = !h.last ? 0 : h.last.width;


			console.log("head root = "+h.x+','+h.y);
			// This actually changes the facing.
			if( turn ) {
				console.log("turning");
				let cornerHalf = Math.floor(cornerDist/2);
				h.move(h.facing,noSlope,cornerHalf);
				h.facing = Dir[turn](h.facing);
				let entryHalf = Math.floor(entryDist/2);
				h.move(Dir.reverse(h.facing),noSlope,entryHalf);
			}

			// this keeps things flat until we've made the corner section.
			let slopeFn = dist => turn && dist<=cornerDist ? 0 : h.slope;
			// set(dir,x,y,z,width,loft,dist,slope,sheath,cap)
			let rake = new RakePath().set( h.facing, h.x, h.y, h.z, h.width, h.loft, h.dist, slopeFn, sheath, capNear, capFar );

			console.log( 'head='+h.x+','+h.y );
			rake.traverse( (x,y,z,i,loft,dist,flags) => {
				let inTurn = (turn && dist < entryDist);
				let block = Block.AIR;

				if( flags & FLAG.FLOOR )		{ block = Block.FLOOR; }
				if( flags & FLAG.ROOF)			{ block = Block.WALL; }
				if( inTurn ) {
					if( flags & FLAG.START )	{ block = Block.WALL; }
					if( flags & flagTURN )		{ block = Block.WALL; }
				}
				else
				if( flags & (FLAG.LWALL|FLAG.RWALL) ) { block = Block.WALL; }

				//let ceilingMiddle = i==0 && loft==h.loft-1;
				let ceilingMiddle = i==-Math.floor(h.width/2) && loft==2;
				let spaced = (this.remaining-dist) % this.pathControls.lightSpacing == 0;
				if( ceilingMiddle && spaced ) {
					block = Block.LIGHT;
				}

				if( x==h.x && y==h.y && (flags & FLAG.FLOOR) ) {
					block = Block.MARKER;
				}

				console.log(block);
				console.assert(this.zone.zoneId>=0);
				let curBlock = this.map.getBlock(x,y,z);
				if( curBlock.isUnknown ) {
					this.map.setVal(x,y,z,block,this.zone.zoneId);
					console.assert( this.map.spot[x][y][z].zoneId == this.zone.zoneId );
				}
			});

			let distTraveled = this.head.dist;
			this.head.advance(this.head.dist);
			this.head.z = rake.zFinal;
			this.head.dist = 0;

			this.remaining -= distTraveled;
			console.log(this.remaining);
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
		init(xLen,yLen,zLen,pathLength) {
			this.map = new Map3d(Block);
			this.map.set(0,0,0,xLen,yLen,zLen);

			this.driver = new Driver.StraightLine();
			this.driver.init(this.map,pathLength,null);
			return this;
		}
		tick() {
			if( !this.driver.isDone ) {
				while( !this.driver.isDone ) {
					this.driver.advance();
				}
				this._renderFn(this.map);
			}

//			if( !this.driver.isDone ) {
//				this.driver.advance();
//				this._renderFn(this.map);
//			}
		}
	}

	return {
		Wright: Wright
	}
});
