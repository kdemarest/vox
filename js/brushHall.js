Module.add('brushHall',function() {

	let Rand = Random.Pseudo;

	let HallBrush = {};

	HallBrush.Base = class extends Brush.Base {
		begin( entryDist ) {
			this.flagTURN	= (this.head.turn=='left' ? 0 : FLAG.LWALL) | (this.head.turn=='right' ? 0 : FLAG.RWALL);
			this.entryDist	= entryDist;
		}

		determineBlockId() {
			let flags  = this.flags;

			this.inTurn = (this.head.turn && this.u < this.entryDist);

			let blockId = this.bDefault;

			if( flags & FLAG.FLOOR )		{ blockId = this.bFloor; }
			if( flags & FLAG.ROOF)			{ blockId = this.bRoof; }
			if( this.inTurn ) {
				if( flags & FLAG.START )	{ blockId = this.bStart; }
				if( flags & this.flagTURN )	{ blockId = this.bCorner; }
			}
			else
			if( flags & (FLAG.LWALL|FLAG.RWALL) ) { blockId = this.bWall; }

			blockId = this.bSpecial || blockId;

			console.assert( BlockType[blockId] && blockId !== 'UNKNOWN' );
			return blockId;
		}
	}

	HallBrush.Standard = class extends HallBrush.Base {
		get paletteData() { return Object.assign( {}, super.paletteData, {
			bDefault:	'AIR',
			bFloor:		'PLANK',
			bRoof:		'DIRT',
			bWall:		'DIRT',
		})}
		get bWall()		{ return this.palette.bWall; }
		get bStart()	{ return this.bWall; }
		get bCorner()	{ return this.bWall; }
		get bSpecial()	{
			let block	= null;
			let hallEdge = this.w==-Math.floor(this.head.width/2) && this.v==2;
			let spaced = (this.driver.remaining-this.u) % this.driver.pathControls.lightSpacing == 0;
			if( hallEdge && spaced ) {
				block = 'TORCH';
			}

			if( this.x==this.head.x && this.y==this.head.y && (this.flags & FLAG.FLOOR) ) {
				block = 'IRON';
			}
			return block;
		}
	}

	HallBrush.Fancy = class extends HallBrush.Standard {
		get parameterData() { return Object.assign( {}, super.parameterData, {
			columnSpacing: 500,
			tileU: 1,
			tileW: 1,
			tileModulo: 2,
			ctWallMossy: 20,
			ctWallCracked: 20
		})}
		get paletteData() { return Object.assign( {}, super.paletteData, {
			bDefault:		'AIR',
			bFloorTile0:	'PLANK',
			bFloorTile1:	'JUNGLE_PLANKS', //'LECTERN_TOP',
			bRoof:			'STONE',
			bWall:			'STONE_BRICKS',
			bWallMossy:		'MOSSY_STONE_BRICKS',
			bWallCracked:	'CRACKED_STONE_BRICKS',
			bWallColumn:	'STONE',
		})}

		get bFloor()	{
			return (Math.floor(this.u/this.tileU)+Math.floor(this.w/this.tileW)) % this.tileModulo ? this.palette.bFloorTile0 : this.palette.bFloorTile1;
		}
		get bWall()		{
			if( this.uGlobal % this.columnSpacing == 0 ) return this.palette.bWallColumn;
			return Rand.chance100(this.ctWallMossy) ? this.palette.bWallMossy : Rand.chance100(this.ctWallCracked) ? this.palette.bWallCracked : this.palette.bWall;
		}
//		get bStart()	{ return 'SAND'; }
//		get bCorner()	{ return 'DIAMOND'; }
	}

	HallBrush.Squares = class extends HallBrush.Fancy {
		get parameterData() { return Object.assign( {}, super.parameterData, {
			uStride: 4,
		})}
		get paletteData() { return Object.assign( {}, super.paletteData, {
			bWallOuter:		'STONE_BRICKS',
			bWallSquares:	'BRICK',
		})}
		get wallTexture() { return {
			textMap: '####\n#ss#\n#ss#\n####\n',
			lookup: { '#': this.palette.bWallOuter, 's': this.palette.bWallSquares },
		}}

		get bWall()	{
			let blockId = this.sample2d( 'wallTexture', this.u, this.v, this.uStride, this.head.loft );
			return blockId;
		}
	}


	return {
		HallBrush: HallBrush
	}
});
