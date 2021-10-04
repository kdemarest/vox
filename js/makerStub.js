Module.add('makerStub',function() {

	let Rand = Random.Pseudo;

	class StubMaker {
		init() {
			this.seedPriorityList = Object.values(SeedType);
			Array.shuffle(this.seedPriorityList);
			return this;
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

		buildStubs(map3d,stubCandidate,head,mapAccess) {

			let stubLayout = this.makeStubLayout( stubCandidate, head );
			let preferSeed = null;

			for( let index = 0 ; index < stubLayout.length ; ++index ) {
				let stub = stubLayout[index];
				//debugger;
				let rakeReach = (new RakeReach()).set( stub.facing, stub.x, stub.y, stub.z );
				let reach = rakeReach.detect(map3d,stub.u,stub.uToEnd);
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

				let seedBrush = new SeedBrush( seed, head );
				seedBrush.attach( ...mapAccess );
				seedBrush.setPalette({});

				rakeReach.traverse( seed.yLen, seed.xLen, -1, ( x, y, zOrigin, u, v, w ) => {
					seedBrush.set( x, y, zOrigin, u, v, w );
					if( u < 0 ) {
						seedBrush.stroke( null );	// just for filling in walls beside pits
						return;
					}
					let sy = seed.yLen - u - 1;
					let seedTile   = seed.map2d.getTile(v,sy);
					let seedMarkup = seed.map2d.getZoneId(v,sy);
					seedBrush
						.stroke( seedTile )
						.markup( seedMarkup );
					;
				});

				preferSeed = !stub.across && (seed.symmetric || stub.symmetric) ? seed : null;
				if( preferSeed && (index+1 >= stubLayout.length || !stubLayout[index+1].across) ) {
					let stubCan = stubCandidate;
					let symIndex = stub.index + (stubCan[stub.index+1].x == stubCan[stub.index].x || stubCan[stub.index+1].y == stubCan[stub.index].y ? 1 : -1);
					let symStub = Object.assign( {}, stubCan[symIndex] );
					symStub.index = symIndex;
					symStub.across = true;
					stubLayout.splice( index+1, 0, symStub );
				}
			}
		}

	}

	return {
		StubMaker: StubMaker
	}
});
