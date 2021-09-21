Module.add('painterHall',function() {

	let Rand = Random.Pseudo;

	Painter.Hall = class extends Painter.Base {
		begin( entryDist ) {
			this.flagTURN	= (this.head.turn=='left' ? 0 : FLAG.LWALL) | (this.head.turn=='right' ? 0 : FLAG.RWALL);
			this.entryDist	= entryDist;
		}

		getBlock() {
			let cursor = this.cursor;
			let flags  = cursor.flags;

			cursor.inTurn = (this.head.turn && cursor.u < this.entryDist);

			let blockId = this.bDefault;

			if( flags & FLAG.FLOOR )		{ blockId = this.bFloor; }
			if( flags & FLAG.ROOF)			{ blockId = this.bRoof; }
			if( cursor.inTurn ) {
				if( flags & FLAG.START )	{ blockId = this.bStart; }
				if( flags & this.flagTURN )	{ blockId = this.bCorner; }
			}
			else
			if( flags & (FLAG.LWALL|FLAG.RWALL) ) { blockId = this.bWall; }

			blockId = this.bSpecial || blockId;

			console.assert( BlockType[blockId] );
			return BlockType[blockId];
		}
	}

	Painter.HallStandard = class extends Painter.Hall {
		get paletteDefault() { return {
			bDefault:	'AIR',
			bFloor:		'PLANK',
			bRoof:		'DIRT',
			bWall:		'DIRT',
		}}
		get bWall()		{ return this.palette.bWall; }
		get bStart()	{ return this.bWall; }
		get bCorner()	{ return this.bWall; }
		get bSpecial()	{
			let cursor	= this.cursor;
			let block	= null;
			let hallEdge = cursor.w==-Math.floor(this.head.width/2) && cursor.v==2;
			let spaced = (this.driver.remaining-cursor.u) % this.driver.pathControls.lightSpacing == 0;
			if( hallEdge && spaced ) {
				block = 'TORCH';
			}

			if( cursor.x==this.head.x && cursor.y==this.head.y && (cursor.flags & FLAG.FLOOR) ) {
				block = 'IRON';
			}
			return block;
		}
	}

	Painter.HallFancy = class extends Painter.HallStandard {
		get parametersDefault() { return {
			columnSpacing: 5,
			tileU: 1,
			tileW: 1,
			tileModulo: 2,
			ctWallMossy: 20,
			ctWallCracked: 20
		}}
		get paletteDefault() { return {
			bDefault:		'AIR',
			bFloorTile0:	'PLANK',
			bFloorTile1:	'LECTERN_TOP',
			bRoof:			'STONE',
			bWall:			'STONE_BRICKS',
			bWallMossy:		'MOSSY_STONE_BRICKS',
			bWallCracked:	'CRACKED_STONE_BRICKS',
			bWallColumn:	'STONE',
		}}

		get bFloor()	{
			return (Math.floor(this.cursor.u/this.tileU)+Math.floor(this.cursor.w/this.tileW)) % this.tileModulo ? this.palette.bFloorTile0 : this.palette.bFloorTile1;
		}
		get bWall()		{
			let c=this.cursor;
			if( c.uGlobal % this.columnSpacing == 0 ) return this.palette.bWallColumn;
			return Rand.chance100(this.ctWallMossy) ? this.palette.bWallMossy : Rand.chance100(this.ctWallCracked) ? this.palette.bWallCracked : this.palette.bWall;
		}
//		get bStart()	{ return 'SAND'; }
//		get bCorner()	{ return 'DIAMOND'; }
	}

	return {}
});
