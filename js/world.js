Module.add('world',function(){

class World {
	World() {
	}
	init( sx, sy, sz ) {
	// Initialise world array
		this.blocks = new Array( sx );
		for ( var x = 0; x < sx; x++ )
		{
			this.blocks[x] = new Array( sy );
			for ( var y = 0; y < sy; y++ )
			{
				this.blocks[x][y] = new Array( sz );
			}
		}
		this.sx = sx;
		this.sy = sy;
		this.sz = sz;

		for ( var x = 0; x < this.sx; x++ )
			for ( var y = 0; y < this.sy; y++ )
				for ( var z = 0; z < this.sz; z++ )
					this.blocks[x][y][z] = BLOCK.AIR;

		this.players = {};

		this.spawnPoint = new Vector( this.sx / 2 + 0.5, this.sy / 2 + 0.5, 16 );

		return this;
	}
	createFlatWorld( height ) {
		this.spawnPoint = new Vector( this.sx / 2 + 0.5, this.sy / 2 + 0.5, height );
		
		for ( var x = 0; x < this.sx; x++ )
			for ( var y = 0; y < this.sy; y++ )
				for ( var z = 0; z < this.sz; z++ )
					this.blocks[x][y][z] = z < height ? BLOCK.DIRT : BLOCK.AIR;
	}

	getBlock( x, y, z )
	{
		if ( x < 0 || y < 0 || z < 0 || x > this.sx - 1 || y > this.sy - 1 || z > this.sz - 1 ) return BLOCK.AIR;
		return this.blocks[x][y][z];
	}
	setBlock( x, y, z, type )
	{
		this.blocks[x][y][z] = type;
		if ( this.renderer != null ) this.renderer.onBlockChanged( x, y, z );
	}

}

return {
	World: World
}

});