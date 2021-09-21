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


	class PathControls {
		constructor() {
			this.setDefaults();
		}
		setDefaults() {
			this.rgDist      = new Roller.Range(2,5,'intBell',0,4);
			this.ctTurn      = new Roller.ChanceTo(40);
			this.ctRoof		 = new Roller.ChanceTo(20);
			this.rgRoof		 = new Roller.Range(5,5,'intBell');
			this.ctRise      = new Roller.ChanceTo(30);
			this.ctFall      = new Roller.ChanceTo(30);
			this.rgSlope     = new Roller.Often(50,1,new Roller.Range(1/4,1,'floatRange'));
			this.ctWiden     = new Roller.ChanceTo(0);
			this.rgWidth     = new Roller.Range(2,2,'intRange',1,2);
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
	}

	Driver.StraightLine = class extends Driver.Base {
		init(map3d,pathLength,pathControls) {
			this.map3d = map3d;
			// set( x, y, z, facing, dist, width, loft, slope )
			let aLittleDistanceToAllowStubs = 4;
			this.head.set( this.map3d.xMin+aLittleDistanceToAllowStubs, this.map3d.yHalf, this.map3d.zHalf, Dir.EAST, 0, 3, 5, 0 );
			this.facingForbidden = Dir.reverse(this.head.facing);
			this.pathControls = Object.assign( new PathControls().setDefaults(), pathControls );
			this.remaining    = pathLength;
			this.seedPriorityList = Object.values(SeedType);
			Array.shuffle(this.seedPriorityList);

			this.painter = new Painter.HallSquares({
				driver: this,
				head: this.head
			});
			this.painter.setCursor( new PaintCursor() );
			this.painter.setPalette({});

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
			let loft      = p.ctRoof.test() ? p.rgRoof.roll() : head.loft;


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
			head.loft   = loft;
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
			let rake = new RakePath().set( head.facing, head.x, head.y, head.z, head.dist, head.loft, head.width, slopeFn, sheath, capNear, capFar );

			this.painter.begin( entryDist );

			console.log( 'head='+head.x+','+head.y );
			rake.traverse( (x,y,z,dist,loft,i,flags) => {

				this.painter.cursor.set( x, y, z, dist, loft, i, flags );
				let block = this.painter.getBlock();

				console.assert(this.zone.zoneId>=0);
				let curBlock = this.map3d.getBlock(x,y,z);
				if( curBlock.isUnknown ) {
					this.map3d.setVal(x,y,z,block,this.zone.zoneId);
					if( head.isFoot(loft) && flags & FLAG.SHEATH ) {
						this.zone.stubCandidate.push({
							x: x,
							y: y,
							z: z,
							facing: i<0 ? Dir.left(head.facing) : Dir.right(head.facing),
							u: dist,
							uToEnd: head.dist-dist
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
				[0.33,0.66],
				[0.33,'across',0.66,'across']
			];
			let symmetric = Rand.chance100(50);

			let stubLayout = [];

			// WARNING!!! THIS IS VERY HARD CODED. It should be responsive to head dist...
			let max = head.dist > 16 ? 4 : 2;
			let layoutType = StubLayoutType[ Rand.intRange( 0, max ) ];
			let cursorIndex = null;
			layoutType.forEach( n => {
				let isAcross = false;
				if( Number.isFinite(n) ) {
					cursorIndex = Math.floor(stubCandidate.length/2);
				}
				else
				if( n == 'across' ) {
					cursorIndex += stubCandidate[cursorIndex+1].x == stubCandidate[cursorIndex].x || stubCandidate[cursorIndex+1].y == stubCandidate[cursorIndex].y ? 1 : -1;
					isAcross = true;
				}
				let stub = Object.assign( {}, stubCandidate[cursorIndex] );
				stub.index = cursorIndex;
				stub.symmetric = !isAcross && symmetric;
				stub.across = isAcross;
				stubLayout.push( stub );
			});
			return stubLayout;
		}

		getBlock(x,y,z,block)  {
			return this.map3d.getBlock( x, y, z );
		}

		setBlock(x,y,z,block) {
			return this.map3d.setVal( x, y, z, block );
		}


		buildStubs() {

			let stubLayout = this.makeStubLayout( this.zone.stubCandidate, this.head );
			let preferSeed = null;

			for( let index = 0 ; index < stubLayout.length ; ++index ) {
				let stub = stubLayout[index];
				//debugger;
				let rakeReach = (new RakeReach()).set( stub.facing, stub.x, stub.y, stub.z );
				let reach = rakeReach.detect(this.map3d,stub.u,stub.uToEnd);
				let seedList = this.seedPriorityList.filter( seedType => seedType.isStub && seedType.fitsReach(reach) );

				//console.log('picking from '+seedList.length+' seeds.' );
				if( seedList.length <= 0 ) {
					return false;
				}
				let seed = seedList[0];
				if( preferSeed && seedList.find( s => s.id==preferSeed.id ) ) {
					seed = preferSeed;
				}
				// Now, since we just used this seed, yank it out of the array and jam it at the end.
				let seedIndex = this.seedPriorityList.find( curSeed => curSeed.id == seed.id );
				this.seedPriorityList.splice(seedIndex,1);
				this.seedPriorityList.push(seed);

			//seed = SeedType.TEST;

				let seedBrush = new SeedBrush( seed, this.head, this.getBlock.bind(this), this.setBlock.bind(this) );

				seedBrush.setPalette({});

				rakeReach.traverse( seed.yLen, seed.xLen, -1, ( x, y, zOrigin, dist, sx, i ) => {
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
				});

				preferSeed = !stub.across && (seed.symmetric || stub.symmetric) ? seed : null;
				if( preferSeed && (index+1 >= stubLayout.length || !stubLayout[index+1].across) ) {
					let stubCan = this.zone.stubCandidate;
					let symIndex = stub.index + (stubCan[stub.index+1].x == stubCan[stub.index].x || stubCan[stub.index+1].y == stubCan[stub.index].y ? 1 : -1);
					let symStub = Object.assign( {}, stubCan[symIndex] );
					symStub.index = symIndex;
					symStub.across = true;
					stubLayout.splice( index+1, 0, symStub );
				}
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
			this.map3d = new Map3d(BlockType);
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
