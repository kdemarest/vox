Module.add('dataWright',function() {

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
		get halfWidth() {
			return Math.floor(this.width/2);
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
			this.stubCandidate = [];
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
		END:	32,
		EDGE:	64,
		SHEATH:	128,
	};

	class PathControls {
		constructor() {
			this.setDefaults();
		}
		setDefaults() {
			this.rgDist      = new Roller.Range(2,20,'intBell');
			this.ctTurn      = new Roller.ChanceTo(50);
			this.ctRise      = new Roller.ChanceTo(30);
			this.ctFall      = new Roller.ChanceTo(30);
			this.rgSlope     = new Roller.Often(50,1,new Roller.Range(1/4,1,'floatRange'));
			this.ctWiden     = new Roller.ChanceTo(100);
			this.rgWidth     = new Roller.Range(0,3,'intRange',1,2);
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
		get halfWidth() {
			return Math.floor(this.width/2);
		}
		stripe(fn,z=this.z,dist=0,distTotal=0) {
			let ahead = Dir.add[this.dir];
			let right = Dir.add[Dir.right(this.dir)];
			let hw = this.halfWidth;
			let x = this.x + ahead.x*dist - right.x*(hw+this.sheath);
			let y = this.y + ahead.y*dist - right.y*(hw+this.sheath);
			let flagSE = (dist<0 ? FLAG.START : 0) | (dist>distTotal ? FLAG.END : 0);

			for( let i=-(hw+this.sheath) ; i<=hw+this.sheath ; ++i ) {
				let flagLR = flagSE;
				flagLR |= (i==-hw || i==hw) ? FLAG.EDGE : 0;
				flagLR |= (i<-hw || i>hw) ? FLAG.SHEATH : 0;
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
		detect(map3d) {
			let maxReach = 16;
			let reach = [];

			let lateralLimit = 8;
			let ahead = Dir.add[this.dir];
			let right = Dir.add[Dir.right(this.dir)];
			let iOffset = [0, -1, 1, -2, 2, -3, 3, -4, 4, -5, 5, -6, 6, -7, 7, -8, 8, -9, 9 ];

			// WARNING! We do not loft at this time! That is because we expect to conver this to use
			// a 2d map of cached blocks.

			for( let d=0 ; d<maxReach ; ++d ) {
				let allowWall = (d==0);
				let i = 0;
				while( Math.abs(iOffset[i]) < lateralLimit ) {
					let x = this.x + ahead.x*d - right.x*iOffset[i];
					let y = this.y + ahead.y*d - right.y*iOffset[i];
					let block = map3d.getBlock( x, y, this.z );
					if( !(block.isUnknown || block.isWall==allowWall) ) {
						lateralLimit = Math.abs( iOffset[i] );
						break;
					}
					i += 1;
				}
				reach[d] = lateralLimit
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

					fn( x, y, this.z, i, d, i-hw );
				}
			}
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
		constructor(map3d) {
			this.map3d  = map3d;
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
				let seedBlock = this.map3d.getVal(x,y,z,'block');
				if( !seedBlock.isUnknown ) {
					distFound = dist-1;
					return false;
				}
			});

			return distFound < Number.MAX_VALUE ? distFound : true;
		}
	}

	Driver.StraightLine = class extends Driver.Base {
		init(map3d,pathLength,pathControls) {
			this.map3d = map3d;
			// set( x, y, z, facing, dist, width, loft, slope )
			this.head.set( this.map3d.xMin+1, this.map3d.yHalf, this.map3d.zHalf, Dir.EAST, 0, 3, 5, 0 );
			this.facingForbidden = Dir.reverse(this.head.facing);
			this.pathControls = Object.assign( new PathControls().setDefaults(), pathControls );
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
			let head = this.head;
			let sheath = 1;
			let capNear = 1;
			let capFar  = 0;
			let turn = head.turn;
			let flagTURN  = (turn=='left' ? 0 : FLAG.LWALL) | (turn=='right' ? 0 : FLAG.RWALL);
			let noSlope   = 0;
			let cornerDist = head.width;
			let entryDist  = !head.last ? 0 : head.last.width;


			console.log("head root = "+head.x+','+head.y);
			// This actually changes the facing.
			if( turn ) {
				console.log("turning");
				let cornerHalf = Math.floor(cornerDist/2);
				head.move(head.facing,noSlope,cornerHalf);
				head.facing = Dir[turn](head.facing);
				let entryHalf = Math.floor(entryDist/2);
				head.move(Dir.reverse(head.facing),noSlope,entryHalf);
			}

			// this keeps things flat until we've made the corner section.
			let slopeFn = dist => turn && dist<=cornerDist ? 0 : head.slope;
			// set(dir,x,y,z,width,loft,dist,slope,sheath,cap)
			let rake = new RakePath().set( head.facing, head.x, head.y, head.z, head.width, head.loft, head.dist, slopeFn, sheath, capNear, capFar );

			console.log( 'head='+head.x+','+head.y );
			rake.traverse( (x,y,z,i,loft,dist,flags) => {
				let inTurn = (turn && dist < entryDist);
				let seedBlock = SeedBlockType.AIR;

				if( flags & FLAG.FLOOR )		{ seedBlock = SeedBlockType.FLOOR; }
				if( flags & FLAG.ROOF)			{ seedBlock = SeedBlockType.WALL; }
				if( inTurn ) {
					if( flags & FLAG.START )	{ seedBlock = SeedBlockType.WALL; }
					if( flags & flagTURN )		{ seedBlock = SeedBlockType.WALL; }
				}
				else
				if( flags & (FLAG.LWALL|FLAG.RWALL) ) { seedBlock = SeedBlockType.WALL; }

				//let ceilingMiddle = i==0 && loft==head.loft-1;
				let ceilingMiddle = i==-Math.floor(head.width/2) && loft==2;
				let spaced = (this.remaining-dist) % this.pathControls.lightSpacing == 0;
				if( ceilingMiddle && spaced ) {
					seedBlock = SeedBlockType.LIGHT;
				}

				if( x==head.x && y==head.y && (flags & FLAG.FLOOR) ) {
					seedBlock = SeedBlockType.MARKER;
				}

				//console.log(seedBlock);
				console.assert(this.zone.zoneId>=0);
				let curSeedBlock = this.map3d.getBlock(x,y,z);
				if( curSeedBlock.isUnknown ) {
					this.map3d.setVal(x,y,z,seedBlock,this.zone.zoneId);
					if( head.isFoot(loft) && flags & FLAG.SHEATH ) {
						this.zone.stubCandidate.push({
							x: x,
							y: y,
							z: z,
							facing: i<0 ? Dir.left(head.facing) : Dir.right(head.facing)
						});
					}
				}
			});
			head.zFinal = rake.zFinal;
		}

		advanceHead() {
			let distTraveled = this.head.dist+1;
			this.head.advance(this.head.dist);
			this.head.z = this.head.zFinal;
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

		makeStubLayout(stubCandidate,head) {
			let StubLayoutType = [
				// Straight from the corner
				// To the side at the corner
				// Repeating with periodicity 4, 6, 8, or 10... on one side or both
				[0.5],
				[0.5,'across'],
				[0.25,0.75],
				[0.25,'across',0.75,'across']
			];
			let symmetric = Rand.chance100(50);

			let stubLayout = [];


			// WARNING!!! THIS IS VERY HARD CODED. It should be responsive to head dist...
			let max = head.dist > 12 ? 4 : 2;
			let layoutType = StubLayoutType[ Rand.intRange( 0, max ) ];
			let cursorIndex = null;
			layoutType.forEach( n => {
				let isAcross = false;
				if( typeof n == 'number' ) {
					cursorIndex = Math.floor(stubCandidate.length/2);
				}
				else
				if( n == 'across' ) {
					cursorIndex += 1;
					isAcross = true;
				}
				let stub = stubCandidate[cursorIndex];
				stub.symmetric = isAcross && symmetric;
				stubLayout.push( stub );
			});
			return stubLayout;
		}


		buildStubs() {

			let stubLayout = this.makeStubLayout( this.zone.stubCandidate, this.head );
			let lastStub = null;

			for( let index = 0 ; index < stubLayout.length ; ++index ) {
				let sc = stubLayout[index];
				let rakeReach = (new RakeReach()).set( sc.facing, sc.x, sc.y, sc.z );
				let reach = rakeReach.detect(this.map3d);
				let seedList = Object.values(SeedType).filter( seedType => seedType.isStub && seedType.fitsReach(reach) );
				console.log('picking from '+seedList.length+' seeds.' );
				if( seedList.length <= 0 ) {
					return false;
				}
				let seed = seedList[ Rand.intRange(0,seedList.length-1) ];
			//seed = SeedType.PIT_ALCOVE;

				let seedBrush = new SeedBrush(seed, (x,y,z,block) => {
					this.map3d.setVal( x, y, z, block );
				});

				seedBrush.setPalette({});

				rakeReach.traverse( seed.yLen, seed.xLen, -1, ( x, y, zOrigin, sx, dist, i ) => {
					seedBrush.setCursor( x, y, zOrigin, dist, i );
					if( dist < 0 ) {
						seedBrush.stroke( null );	// just for filling in walls beside pits
						return;
					}
					let sy = seed.yLen - dist - 1;
					let seedTile = seed.map2d.getTile(sx,sy);
					let seedMarkup = seed.map2d.getZoneId(sx,sy);
					seedBrush
						.stroke( seedTile )
						.markup( seedMarkup );
					;
	//				if( sx == 1 && sy == 1 ) {
	//					this.map3d.setVal(x,y,zOrigin+1,SeedBlockType.LIGHT);
	//				}
				});
			}
		}

		advance() {
			this.buildPath();
			this.buildStubs();
			this.advanceHead();
			//return result;
		}
	}

	class Wright {
		constructor() {
		}
		init(xLen,yLen,zLen,pathLength,pathControls) {
			this.map3d = new Map3d(SeedBlockType);
			this.map3d.set(0,0,0,xLen,yLen,zLen);

			this.driver = new Driver.StraightLine();
			this.driver.init(this.map3d,pathLength,pathControls);
			return this;
		}
		tick() {
			if( !this.driver.isDone ) {
				while( !this.driver.isDone ) {
					this.driver.advance();
				}
				this._renderFn(this.map3d);
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
