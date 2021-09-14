Module.add('dataHotep',function() {

	let Rand = Random.Pseudo;

	let Tile = {
		UNKNOWN: {
			symbol: '?',
			isUnknown: true,
		},
		FLOOR: {
			symbol: '.',
			isFloor: true,
		},
		HALL: {
			symbol: '+',
			isHall: true,
		},
		DOOR: {
			symbol: 'D',
			isHall: true,
		},
		WALL: {
			symbol: '#',
			isWall: true,
		},
		PIT: {
			symbol: 'o',
			isPit: true,
		},
		DIAS: {
			symbol: 'd',
			isDias: true,
		},
		BRIDGE: {
			symbol: '=',
			isBridge: true,
		},
		SHAFT: {
			symbol: 'x',
			isShaft: true,
		},
		TUNNEL: {
			symbol: 't',
			isTunnel: true,
		},
		WINDOW: {
			symbol: '^',
			isWindow: true,
		},
		COLUMN: {
			symbol: 'c',
			isColumn: true,
		},
		HITUNNEL: {
			symbol: 'h',
			isTunnel: true,
		}
	}

	class Node {
		constructor() {
			this.x = null
			this.y = null;
			this.floor = null;
			this.roof = null;
			this.form = null;
			this.facing = null;
			this.source = null;
		}
		copy(nodeRef) {
			return Object.assign( this, nodeRef );
		}
		move(dir,dist=1) {
			console.assert( Coordinate.validateValue(this.x) );
			console.assert( Coordinate.validateValue(this.y) );
			console.assert( Number.isInteger(dist) && dist > 0 );
			this.x += Dir.add[dir].x * dist;
			this.y += Dir.add[dir].y * dist;
		}
	}

	class Head extends Node {
		constructor() {
			super();
			this.gapEntry = null;
			this.gapExit  = null;
			this.facing   = null;
			this.width    = 0;
			this.steps    = 0;
			this.isRoom   = false;
			this.policy = {};
		}
		init( x, y, facing, floor, roof ) {
			this.x = x;
			this.y = y;
			this.facing   = facing;
			this.gapEntry = facing;
			this.gapExit  = facing;
			this.floor = floor;
			this.roof  = roof;
			return this;
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
		find(x,y) {
			let result = [];
			this.nodeList.forEach( node => {
				if( node.x==x && node.y==y ) {
					if( result.length <= 0 || result[0].floor < node.floor ) {
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

	class FormClass {
		constructor(id,gapStraight,gapLeft,gapRight) {
			this.id = id;
			this.tileString = {
				's': gapStraight,
				'l': gapLeft || gapStraight,
				'r': gapRight || gapStraight
			};
		}
		getSymbol(x,y,turnDescriptor) {
			console.assert( Coordinate.validateMany(x,y) );
			console.assert( x>=0 && x<4 && y>=0 && y<4 );
			console.assert( turnDescriptor == 's' || turnDescriptor == 'l' || turnDescriptor == 'r' );
			return this.tileString[turnDescriptor][y*4+x];
		}
		traverse(turnDescriptor,fn) {
			for( let y=0 ; y<4 ; ++y ) {
				for( let x = 0 ; x<4 ; ++x ) {
					fn(x,y,this.getSymbol(x,y,turnDescriptor));
				}
			}
		}
	}

	class Zone {
		constructor(zoneId,gen) {
			this.zoneId = zoneId;
			this.gen = gen;
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

	let Form = {};
	Form.FLOOR       = new FormClass('FLOOR',		'....'+'....'+'....'+'....');
	Form.HALL        = new FormClass('HALL',  		'++++'+'++++'+'++++'+'++++');
	Form.DOORTOHALL  = new FormClass('DOORTOHALL',	'++++'+'++++'+'++++'+'++++');
	Form.HALLNARROW  = new FormClass('HALLNARROW',
		'#++#'+'#++#'+'#++#'+'#++#',	// went straight
		'####'+'+++#'+'+++#'+'#++#',	// from straight to left
		'####'+'#+++'+'#+++'+'#++#',	// from straight to right
		);
	Form.HEAD        = new FormClass('HEAD',  		'HHHH'+'HHHH'+'HHHH'+'HHHH');

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
		rayHit(x,y,dir,width,ignoreNode) {
			console.assert( Coordinate.validateMany(x,y) );
			console.assert( dir === Dir.NORTH || dir === Dir.EAST || dir === Dir.SOUTH || dir === Dir.WEST );
			if( dir == this.facingForbidden ) {
				return 0;
			}
			let dist = Number.MAX_VALUE;
			let stopOnFind = false;
			this.nodeList.traverse( node => {
				if( node === ignoreNode ) {
					return;
				}
				switch( dir ) {
					case Dir.NORTH: {
						if( node.x>=x-width && node.x<=x+width && node.y<=y ) {
							dist = Math.min(dist,y-node.y);
						}
						if( stopOnFind && dist !== Number.MAX_VALUE ) debugger;
						break;
					}
					case Dir.EAST: {
						if( node.y>=y-width && node.y<=y+width && node.x>=x ) {
							dist = Math.min(dist,node.x-x);
						}
						if( stopOnFind && dist !== Number.MAX_VALUE ) debugger;
						break;
					}
					case Dir.SOUTH: {
						if( node.x>=x-width && node.x<=x+width && node.y>=y ) {
							dist = Math.min(dist,node.y-y);
						}
						if( stopOnFind && dist !== Number.MAX_VALUE ) debugger;
						break;
					}
					case Dir.WEST: {
						if( node.y>=y-width && node.y<=y+width && node.x<=x ) {
							dist = Math.min(dist,x-node.x);
						}
						if( stopOnFind && dist !== Number.MAX_VALUE ) debugger;
						break;
					}
				}
			});

			return dist === Number.MAX_VALUE ? true : dist;
		}
		gatherStubProspects() {
			let edgeList = this.nodeList.filter( node=>node.zoneId==this.head.zoneId && node.isEdge );
			let prospectList = [];
			edgeList.traverse( node => {
				let dist = this.rayHit( node.x, node.y, node.facing, 0, node );
				if( dist === true || dist >= 1 ) {
					node.stubDist = dist===true ? 4 : dist;
					prospectList.push(node);
				}
			});
			return prospectList;
		}
	}

	Driver.StraightLine = class extends Driver.Base {
		init(pathLength) {
			this.head.init( this.map.xMin, this.map.yHalf, Dir.EAST, this.map.zHalf, this.head.floor+5 );
			this.head.policy.isNarrow = false;
			this.remaining   = pathLength;
			this.buildMode   = 'buildPath';
		}
		steer() {
			let isRoom = this.remaining<3 ? false : !this.head.isRoom;
			this.head.isRoom = isRoom;
			this.head.steps  = Math.min( this.remaining, isRoom ? Rand.intRange(3,5) : Rand.intRange(1,7) );
			this.head.width  = isRoom ? Math.floor(this.head.steps/2) : 0; //Rand.intRange( Math.floor(this.head.steps/2), 2 );
			this.head.gapEntry = this.head.facing;
			this.head.gapExit  = Dir.EAST;
			this.head.facing   = Dir.EAST;
			let policy = this.head.policy;
			if( !isRoom ) {
				policy.isNarrow = this.head.width>0 ? false : Rand.chance100(50) ? policy.isNarrow : !policy.isNarrow;
			}

			console.log( "Steer steps="+this.head.steps+" width="+this.head.width );
		}
		advancePath() {
			let head    = this.head;
			let policy  = this.head.policy;
			let isRoom  = head.isRoom;
			// Make the central path node.
			{
				let node = (new Node()).copy(head);
				node.form = isRoom ? Form.FLOOR : policy.isNarrow ? Form.HALLNARROW : Form.HALL;
				node.isEdge = this.zone.width == 0;
				node.isPath = true;
				this.nodeList.add(node);
			}

			// Make the left and right nodes for the hall or room.
			for( let w = 1 ; w<=this.head.width ; ++w ) {
				let left    = (new Node()).copy(head);
				left.facing = Dir.left(head.facing);
				left.move(left.facing,w);
				left.gapEntry = left.facing;
				left.form = isRoom ? Form.FLOOR : policy.isNarrow ? Form.HALLNARROW : Form.HALL;
				left.isEdge = w == this.head.width;
				this.nodeList.add(left);

				let right = (new Node()).copy(head);
				right.facing = Dir.right(head.facing);
				right.move(right.facing,w);
				right.gapEntry = right.facing;
				right.form = isRoom ? Form.FLOOR : policy.isNarrow ? Form.HALLNARROW : Form.HALL;
				right.isEdge = w == this.head.width;
				this.nodeList.add(right);
			}

			this.head.move(this.head.facing,1);
			console.assert( this.head.gapExit == this.head.facing );
			this.head.gapEntry = this.head.facing;
			this.head.steps -= 1;
		}

		buildPath() {
			if( this.remaining <= 0 ) {
				debugger;
				return false;
			}
			if( this.head.steps <= 0 ) {
				this.steer();
			}

			this.advancePath();
			this.remaining -= 1;

			if( this.head.steps <= 0 ) {
				this.buildMode = 'buildStubs';
			}
		}


		buildStubs() {
			let prospectList = this.gatherStubProspects(this.zone.zoneId);
			if( !prospectList.length ) {
				this.buildMode = 'buildPath';
				return;
			}

			let origin = prospectList[Rand.intRange(0,prospectList.length-1)];
			let gen = {
				dist: 1,
				width: 0,
			}
			let facing = origin.facing;

			this.headStack.unshift( new Head() );

			Dir.validate(facing);

			let zoneId = this.zoneList.increment();
			this.zoneList.add( new Zone(zoneId,gen) );

			this.head.init( origin.x, origin.y, facing, origin.floor, origin.roof);
			this.head.move(facing);
			this.head.zoneId = zoneId;
			this.head.steps  = gen.dist;
			this.head.width  = gen.width;
			this.head.isStub   = true;

			this.advancePath();
			this.remaining -= 1;

			this.headStack.shift();

			this.buildMode = 'buildPath';
		}

		advance() {
			let result = this[this.buildMode]();
			return result;
		}
	}

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

	function formCoordTransform(fx,fy,facing) {
		if( facing == 0 ) {
			return [fx,fy];
		}
		if( facing == 2 ) {
			return [3-fy,fx];
		}
		if( facing == 4 ) {
			return [3-fx,3-fy];
		}
		if( facing == 6 ) {
			return [3-fy,3-fx];
		}
		debugger;
	}

	function renderToText(nodeList,head) {

		function putSymbol(px,py,fx,fy,facing,symbol) {
			[fx,fy]   = formCoordTransform(fx,fy,facing);
			let [x,y] = [px*4+fx,py*4+fy];
			result[y] = result[y] || String.padLeft('',rect2d.xLen*4+4);
			result[y] = String.splice( result[y], x, 1, symbol);
		}

		let result = [];
		let rect2d = nodeList.extent2d;
		rect2d.traverse( (px,py) => {
			//console.log(px,py);
			let list = nodeList.find(px,py);
			if( px==head.x && py==head.y ) {
				Form.HEAD.traverse( 's', (fx,fy,symbol) => putSymbol(px,py,fx,fy,Dir.NORTH,symbol) );
				return;
			}
			if( list.length <= 0 ) {
				return;
			}
			let node = list[0];
			let slr  = node.gapEntry == node.gapExit ? 's' : Dir.left(node.gapEntry) == node.gapExit ? 'l' : Dir.right(node.gapEntry) == node.gapExit ? 'r' : '';
			console.assert( slr !== '' );
			node.form.traverse( slr, (fx,fy,symbol) => putSymbol(px,py,fx,fy,node.gapEntry,symbol) );
		});
		return result.join('<br>\n');
	}

	function hotepTest(_renderFn) {
		let map = new Map3d(Tile);
		map.set(0,0,0,50,50,10);

		let driver = new Driver.Winding(map);
		driver.init(pathLength=70);

		window.tick = function() {
			if( !driver.isDone ) {
				driver.advance();
				let mapString = renderToText(driver.nodeList,driver.head);
				_renderFn(mapString);
			}
			window.requestAnimationFrame(window.tick)
		}

		window.requestAnimationFrame(window.tick);
	}

	return {
		hotepTest: hotepTest
	}
});
