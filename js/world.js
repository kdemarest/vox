Module.add('world',function(){

class World {
	World() {
	}
	init( sx, sy, sz ) {
		this.sx = sx;
		this.sy = sy;
		this.sz = sz;

		function array3(sx,sy,sz,initFn) {
			let a = new Array( sx );
			for ( var x = 0; x < sx; x++ )
			{
				a[x] = new Array( sy );
				for ( var y = 0; y < sy; y++ )
				{
					a[x][y] = new Array( sz );
				}
			}

			for ( var x = 0; x < sx; x++ )
				for ( var y = 0; y < sy; y++ )
					for ( var z = 0; z < sz; z++ )
						a[x][y][z] = initFn(x,y,z);
			return a;
		}

		this.blocks = array3(sx,sy,sz,()=>BLOCK.AIR);
		this.lightMap  = array3(sx,sy,sz,()=>[0.0,0.0,0.0]);

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