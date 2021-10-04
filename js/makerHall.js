Module.add('makerHall',function() {

	let Rand = Random.Pseudo;

	class HallMaker {
		init(facingTrend,hallBrush) {
			this.hallBrush = hallBrush;
			this.facingForbidden = Dir.reverse(facingTrend);
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
		steer(head,zoneId,pathControls) {
			let p = pathControls;
			let lastSlope = head.last ? head.last.slope : 0;
			console.log('lastSlope='+lastSlope);
			head.last = head.copySelf();

			let dist      = p.rgDist.roll();
			let turn      = p.ctTurn.test();
			let slopeMult = (p.ctRise.test() && lastSlope >=0) ? 1 : (p.ctFall.test() && lastSlope<=0) ? -1 : 0;
			let slope     = p.rgSlope.roll() * slopeMult;
			let loft      = p.ctRoof.test() ? p.rgRoof.roll() : head.loft;

			if( slope > 1.0 || slope < -1.0 ) {
				debugger;
			}

			let width;
			if( !turn ) {
				width = Math.max(p.rgWidth.min,head.width);
			}
			else {
				width = p.ctWiden.test() || head.width<p.rgWidth.min ? p.rgWidth.roll() : head.width;
				dist = Math.max(width+1,dist);
			}
			turn = !turn ? turn : this.findSafeTurn(head.facing);

			head.zoneId = zoneId;

			head.total  = dist;
			head.dist   = dist;
			head.turn   = turn;
			head.width  = width;
			head.loft   = loft;
			head.slope  = slope;
			// Note that head.facing does not change yet.

			console.log( "Steer dist="+head.dist+" width="+head.width );
		}
		advancePath(head,reportStubCandidateFn) {
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
			let rake = new RakePath().set(
				head.facing, head.x, head.y, head.z, head.dist, head.loft, head.width, slopeFn,
				1, 1, 1, 0
			);

			this.hallBrush.begin( entryDist );

			console.log( 'head='+head.x+','+head.y+','+head.z );
			rake.traverse( (x,y,z,dist,loft,i,flags) => {

				this.hallBrush.set( x, y, z, dist, loft, i, flags );
				let blockId = this.hallBrush.determineBlockId();

				if( this.hallBrush.putWeak(0,blockId) ) {
					if( head.isFoot(loft) && (flags & FLAG.SHEATH) ) {
						reportStubCandidateFn({
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
			head.zFinal = rake.z;
		}
	}

	return {
		HallMaker: HallMaker
	}

});
