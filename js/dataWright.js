Module.add('dataWright',function() {

	let Rand = Random.Pseudo;

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
		getBlock(x,y,z,block)  {
			return this.map3d.getBlock( x, y, z );
		}
		setBlock(x,y,z,block) {
			return this.map3d.setVal( x, y, z, block, this.zone.zoneId );
		}
		get mapAccess() {
			return [this.getBlock.bind(this), this.setBlock.bind(this)];
		}
	}

	class Membrane {
		// Varieties: vac-pak, toEdges, baloon, varied
	}

	class Supports {
		// Types: fillBelow, hollowBelow, columnsBelow, chainsAbove, arches
		build() {

		}
	}

	class RoomMaker {
		constructor() {
			this.zTarget = null;
			this.numSegments = null;
			// Using strides of 1, 3, 5, or 7 gives you a 'center square'
			this.uStride = this.vStride = this.wStride = null;
		}
		init(head,roomBrush,roomControls) {
			this.head = head;
			this.roomBrush = roomBrush;
			this.roomControls = roomControls;
			this.uStride = this.roomControls.uStride;
			this.vStride = this.roomControls.vStride;
			this.wStride = this.roomControls.wStride;
			this.nodeList = new NodeList();
			this.extents = null;

			return this;
		}

		onBloatStep() {
			if( justTurned ) {
				this.bloatL = Rand.intRange(0,3);
				this.bloatR = Rand.intRange(0,3);
				if( Rand.chance100(50) ) this.squareTheCorner();
			}
			if( Rand.chance100(33) ) {
				this.bloatL += Rand.intRange(0,2) * (this.bloatL >= 3 ? -1 : 1);
				this.bloatR += Rand.intRange(0,2) * (this.bloatR >= 3 ? -1 : 1);
			}
		}
		advance() {
			this.x += Dir.add[this.head.facing].x;
			this.y += Dir.add[this.head.facing].y;
			this.z += this.head.slope;
		}
		detectClear(dir,slope) {
			let head = this.head;
			let rake = new RakePath();
			rake.set(
				head.facing, head.x, head.y, head.z, this.uStride, this.vStride, this.wStride, head.slope,
				0, 1, 0, 0
			);
			let isClear = true;
			rake.traverse( (x,y,z,u,v,w,flag) => {
				this.roomBrush.set(x,y,z,u,v,w);
				if( !this.roomBrush.get(0).isUnknown ) {
					isClear = false;
					return false;
				}
			});
			return true; //isClear;
		}
		getTurnOptions() {
			let options = [];
			let head = this.head;
			if( this.detectClear(Dir.left(head.facing),head.slope) ) {
				options.push('left');
			}
			if( this.detectClear(Dir.right(head.facing),head.slope) ) {
				options.push('right');
			}
			if( this.detectClear(Dir.straight(head.facing),head.slope) ) {
				options.push('straight');
			}
			console.assert( options.length > 0 );
			return options;
		}

		step(blockId,extraFlags) {
			let head = this.head;
			let node = head.copySelf();
			if( head.dist == 1 ) {
				extraFlags[this.numSegments==0 ? 'isExit' : 'isCorner'] = true;
			}
			extraFlags.level = (head.z-this.entryLevel)/this.vStride;

			Object.assign( node, extraFlags );
			this.nodeList.add( node );
			let rake = new RakePath().set(
				head.facing, head.x, head.y, head.z, this.uStride/*head.dist*/, 1/*head.loft*/, head.width, head.slope,
				0, 1, 0, 0
			);

			this.roomBrush.begin();

			rake.traverse( (x,y,z,u,v,w,flags) => {
				this.roomBrush.set( x, y, z, u, v, w, flags );
				if( flags & FLAG.FLOOR ) {
					let blockId = "DIRT"; //this.hallBrush.determineBlockId();
					this.roomBrush.putWeak(-1,blockId);
					if( w==0 && u==1) {
						this.roomBrush.putWeak( 3,'TORCH');
					}
					this.extents.extend(x,y,z);
				}
			});
			head.move( head.facing, head.slope, this.uStride );
			head.z = rake.z;
			head.dist -= this.uStride;
		}

		makeTurn(turn) {
			this.head.move( this.head.facing, 0, -(Math.floor(this.uStride/2)+1) );
			this.head.facing = Dir[turn](this.head.facing);
			this.head.move( this.head.facing, 0, Math.floor(this.uStride/2)+1 );
		}

		buildRoomPath() {
			let head = this.head;
			let rc   = this.roomControls;
			this.extents = new Rect3d().set(head.x,head.y,head.z,0,0,0);
			let maxReps = 3*4*5;

			head.facing = Dir.EAST;
			head.width = this.wStride;
			head.loft  = this.vStride;
			head.dist  = this.roomControls.rgPathDist.roll();
			head.slope = 0;

			this.zEntry		 = head.z;
			this.zTarget     = head.z + (rc.rgZTarget.roll() * this.vStride);
			this.numSegments = rc.rgNumSegments.roll();
			this.zTall       = Math.max(head.z,this.zTarget) + (rc.ctTall.test() ? this.vStride+rc.rgTall.roll() : this.vStride);
			this.zDeep       = Math.min(head.z,this.zTarget) - (rc.ctDeep.test() ? rc.rgDeep.roll() : 0);
			this.extents.extend( head.x, head.y, this.zTall );
			this.extents.extend( head.x, head.y, this.zDeep );

			this.step( "FLOOR", {isFloor: true, isEntry: true});

			while( true && maxReps-- > 0) {
				head.slope = 0;
				while( head.dist > 0 ) {
					this.step('FLOOR', {isFloor: true});
				}

				// The path is winding at the current z.
				if( this.numSegments > 0 ) {
					let turn = this.roomControls.pickSegmentTurn();
					this.makeTurn(turn);
					// Interestingly, we can make sure that the 4th segment always has space
					// in front of it if we look at the 2nd segment and we're at least 1 shorter than it.
					// Or we can make sure that the 3rd segment is at least 1 longer than the 1st
					head.dist		= this.roomControls.rgPathDist.roll();
					this.numSegments -= 1;
					continue;
				}

				if( head.z == this.zTarget ) {
					break;
				}			

				this.numSegments	= this.roomControls.rgNumSegments.roll();
				// Note that we always add 1 here, to accomodate the stairs and the fact that
				// all stairs need a landing afterwards.
				head.dist			= 1+this.roomControls.rgPathDist.roll();
				let rise			= (this.z<this.zTarget) ? 1 : -1;
				head.slope			= rise * (this.vStride/this.uStride);
				let turnOptions		= this.getTurnOptions();
				let turn			= turnOptions[Rand.intRange(0,turnOptions.length)];
				this.makeTurn(turn);
				this.roomBrush.put( 2, 'TORCH' );
				this.step('STAIRS', {isStairs: true});
				continue;
			}
		}

		buildMembrane() {
			let x = this.extents.xMin;
			let y = this.extents.yHalf;
			let z = this.zDeep;
			let rake = new RakePath().set(
				Dir.EAST,
				this.extents.xMin, this.extents.yHalf, this.extents.zMin,
				this.extents.xLen, this.extents.zLen, this.extents.yLen, 0,
				1, 1, 1, 1 );
			let wallFlags = (FLAG.START | FLAG.END | FLAG.LWALL | FLAG.RWALL);
			rake.traverse( (x,y,z,u,v,w,flags) => {
				this.roomBrush.set(x,y,z,u,v,w,flags);
				if( flags & wallFlags ) {
					this.roomBrush.putWeak( 0, this.roomBrush.bWall );
				}
				if( flags & FLAG.ROOF ) {
					this.roomBrush.putWeak( 0, this.roomBrush.bRoof );
				}
				if( flags & FLAG.FLOOR ) {
					this.roomBrush.putWeak( 0, this.roomBrush.bFloor );
				}
			});
		}

		buildSupports() {
		}
	}

	let roomControlsDefault = ()=>{
		let uStride = 3;
		let vStride = 3;
		let wStride = 3;
		let leftLean = 80;
		return {
			uStride:			uStride,
			vStride:			vStride,
			wStride:			wStride,
			rgZTarget:			new Roller.Range(-3,-3,'intRange'), //-5,5,'intBell'),
			rgPathDist:			new Roller.Range(1,2,'intRange',0,uStride),
			rgNumSegments:		new Roller.Range(1,2,'intRange'),
			pickSegmentTurn:	()=>Rand.chance100(leftLean) ? 'left' : 'right',
			ctTall:				new Roller.ChanceTo(50),
			rgTall:				new Roller.Range(3,vStride*3,'intRange'),
			ctDeep:				new Roller.ChanceTo(50),
			rgDeep:				new Roller.Range(1,vStride*3),
		}
	}


	Driver.StraightLine = class extends Driver.Base {
		init(map3d,pathLength,pathControls) {
			this.map3d = map3d;
			// set( x, y, z, facing, dist, width, loft, slope )
			let aLittleDistanceToAllowStubs = 8*5;
			this.head.set(
				this.map3d.xMin+aLittleDistanceToAllowStubs,
				this.map3d.yHalf,
				this.map3d.zHalf,
				Dir.EAST, 0, 3, 5, 0 );
			this.pathControls = Object.assign( new PathControls().setDefaults(), pathControls );
			this.remaining    = pathLength;

			let hallBrush = new HallBrush.Squares({ driver: this, head: this.head });
			hallBrush.attach( ...this.mapAccess );
			hallBrush.setPalette({});

			let roomBrush = new Brush.Base({});
			roomBrush.attach( ...this.mapAccess );
			roomBrush.setPalette({});

			this.hallMaker = new HallMaker().init(this.head.facing,hallBrush);
			this.stubMaker = new StubMaker().init();
			this.roomMaker = new RoomMaker().init(this.head,roomBrush,roomControlsDefault());

			return this;
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
				this.zoneCreate();
				this.hallMaker.steer(this.head,this.zone.zoneId,this.pathControls);
			}

			this.hallMaker.advancePath(
				this.head,
				stubCandidate => {
					this.zone.stubCandidate.push(stubCandidate);
				}
			);
		}

		buildStubs() {
			this.stubMaker.buildStubs(this.map3d,this.zone.stubCandidate,this.head,this.mapAccess);
		}

		buildRoom() {
			//debugger;
			this.zoneCreate();
			this.roomMaker.buildRoomPath();
			//this.roomMaker.buildBloat();
			this.roomMaker.buildMembrane();
			this.remaining = 0;
		}

		advance() {
			//this.buildPath();
			//this.buildStubs();
			this.buildRoom();
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
		}
	}

	return {
		Wright: Wright
	}
});
