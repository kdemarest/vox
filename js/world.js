Module.add('world',function(){

class World extends Rect3d {
	World() {
	}
	get sx() { return this.xLen; }
	get sy() { return this.yLen; }
	get sz() { return this.zLen; }
	init( sx, sy, sz ) {
		this.set(0,0,0,sx,sy,sz);

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

		this.blocks = array3(sx,sy,sz,()=>BlockType.AIR);
		this.lightMap  = array3(sx,sy,sz,()=>[0.0,0.0,0.0]);

		this.spawnPoint = new Vector( this.sx / 2 + 0.5, this.sy / 2 + 0.5, Math.floor(sz/2) );

		return this;
	}
	createFlatWorld( height ) {
		this.spawnPoint = new Vector( this.sx / 2 + 0.5, this.sy / 2 + 0.5, height+2 );
		
		for ( var x = 0; x < this.sx; x++ )
			for ( var y = 0; y < this.sy; y++ )
				for ( var z = 0; z < this.sz; z++ )
					this.blocks[x][y][z] = z < height ? BlockType.DIRT : BlockType.AIR;
	}

	getBlock( x, y, z )
	{
		if ( x < 0 || y < 0 || z < 0 || x > this.sx - 1 || y > this.sy - 1 || z > this.sz - 1 ) return BlockType.AIR;
		return this.blocks[x][y][z];
	}
	bulkChangeBegin() {
		this.blockChangedFlag = true;
	}
	bulkChangeEnd() {
	}
	setBlock( x, y, z, type )
	{
		this.blocks[x][y][z] = type;
		if( this.renderer && !this.blockChangedFlag ) {
			this.renderer.onBlockChanged(x,y,z);
		}
	}
	// pushVertices
	//
	// Pushes the vertices necessary for rendering a
	// specific block into the array.
	pushVertices( vSolid, vTrans, x, y, z )
	{
		let world = this;
		var blocks = world.blocks;
		var lightMap  = world.lightMap;
		var block  = blocks[x][y][z];
		var bH = block.fluid && ( z == world.sz - 1 || !blocks[x][y][z+1].fluid ) ? 0.8 : 1.0;
		let lightMax = 1.0;
		let lightFull = [lightMax,lightMax,lightMax];

		let trans = block.trans;
		let id = block.id;

		// Top
		if ( z == world.sz - 1 || (world.blocks[x][y][z+1].transparent && world.blocks[x][y][z+1].id!=id) )
		{
			let c = block.getTx( world, x, y, z, DIRECTION.UP );

			let m = block.selflit || z>=world.sz-1 ? lightFull : lightMap[x][y][z+1];
			let r = m[0];
			let g = m[1];
			let b = m[2];

			//let lightNum = z>=world.sz-1 ? 0 : lightMap[x][y][z+1];
			//var lightMultiplier = block.selflit ? 1.0 : lightMag[lightNum];

			pushQuad(
				block.trans ? vTrans : vSolid,
				[ x, y, z + bH,				c[0], c[1], r, g, b, 1.0 ],
				[ x + 1.0, y, z + bH,		c[2], c[1], r, g, b, 1.0 ],
				[ x + 1.0, y + 1.0, z + bH, c[2], c[3], r, g, b, 1.0 ],
				[ x, y + 1.0, z + bH,		c[0], c[3], r, g, b, 1.0 ]
			);
		}
		
		// Bottom
		if ( z == 0 || (world.blocks[x][y][z-1].transparent && world.blocks[x][y][z-1].id!=id) )
		{
			let c = block.getTx( world, x, y, z, DIRECTION.DOWN );
			
			let m = block.selflit || z<=0 ? lightFull : lightMap[x][y][z-1];
			let r = m[0];
			let g = m[1];
			let b = m[2];
			
			pushQuad(
				block.trans ? vTrans : vSolid,
				[ x, y + 1.0, z,		c[0], c[3], r, g, b, 1.0 ],
				[ x + 1.0, y + 1.0, z,	c[2], c[3], r, g, b, 1.0 ],
				[ x + 1.0, y, z,		c[2], c[1], r, g, b, 1.0 ],
				[ x, y, z,				c[0], c[1], r, g, b, 1.0 ]
			);
		}
		
		// Front
		if ( y == 0 || (world.blocks[x][y-1][z].transparent && world.blocks[x][y-1][z].id!=id) )
		{
			let c = block.getTx( world, x, y, z, DIRECTION.FORWARD );
			
			let m = block.selflit || y<=0 ? lightFull : lightMap[x][y-1][z];
			let r = m[0];
			let g = m[1];
			let b = m[2];
			
			pushQuad(
				block.trans ? vTrans : vSolid,
				[ x, y, z,				c[0], c[3], r, g, b, 1.0 ],
				[ x + 1.0, y, z,		c[2], c[3], r, g, b, 1.0 ],
				[ x + 1.0, y, z + bH,	c[2], c[1], r, g, b, 1.0 ],
				[ x, y, z + bH,			c[0], c[1], r, g, b, 1.0 ]
			);
		}
		
		// Back
		if ( y == world.sy - 1 || (world.blocks[x][y+1][z].transparent && world.blocks[x][y+1][z].id!=id) )
		{
			let c = block.getTx( world, x, y, z, DIRECTION.BACK );
			
			let m = block.selflit || y>=world.sy-1 ? lightFull : lightMap[x][y+1][z];
			let r = m[0];
			let g = m[1];
			let b = m[2];
			
			pushQuad(
				block.trans ? vTrans : vSolid,
				[ x, y + 1.0, z + bH,		c[2], c[1], r, g, b, 1.0 ],
				[ x + 1.0, y + 1.0, z + bH,	c[0], c[1], r, g, b, 1.0 ],
				[ x + 1.0, y + 1.0, z,		c[0], c[3], r, g, b, 1.0 ],
				[ x, y + 1.0, z,			c[2], c[3], r, g, b, 1.0 ]
			);
		}
		
		// Left
		if ( x == 0 || (world.blocks[x-1][y][z].transparent && world.blocks[x-1][y][z].id!=id) )
		{
			let c = block.getTx( world, x, y, z, DIRECTION.LEFT );
			
			let m = block.selflit || x<=0 ? lightFull : lightMap[x-1][y][z];
			let r = m[0];
			let g = m[1];
			let b = m[2];
			
			pushQuad(
				block.trans ? vTrans : vSolid,
				[ x, y, z + bH,			c[2], c[1], r, g, b, 1.0 ],
				[ x, y + 1.0, z + bH,	c[0], c[1], r, g, b, 1.0 ],
				[ x, y + 1.0, z,		c[0], c[3], r, g, b, 1.0 ],
				[ x, y, z,				c[2], c[3], r, g, b, 1.0 ]
			);
		}
		
		// Right
		if ( x == world.sx - 1 || (world.blocks[x+1][y][z].transparent && world.blocks[x+1][y][z].id!=id) )
		{
			let c = block.getTx( world, x, y, z, DIRECTION.RIGHT );
			
			let m = block.selflit || x>=world.sx-1 ? lightFull : lightMap[x+1][y][z];
			let r = m[0];
			let g = m[1];
			let b = m[2];
			
			pushQuad(
				block.trans ? vTrans : vSolid,
				[ x + 1.0, y, z,			c[0], c[3], r, g, b, 1.0 ],
				[ x + 1.0, y + 1.0, z,		c[2], c[3], r, g, b, 1.0 ],
				[ x + 1.0, y + 1.0, z + bH,	c[2], c[1], r, g, b, 1.0 ],
				[ x + 1.0, y, z + bH,		c[0], c[1], r, g, b, 1.0 ]
			);
		}
	}

	// pushPickingVertices
	//
	// Pushes vertices with the data needed for picking.

	pushPickingVertices( vertices, x, y, z )
	{
		var color = { r: x/255, g: y/255, b: z/255 };
		
		// Top
		pushQuad(
			vertices,
			[ x, y, z + 1, 0, 0, color.r, color.g, color.b, 1/255 ],
			[ x + 1, y, z + 1, 1, 0, color.r, color.g, color.b, 1/255 ],
			[ x + 1, y + 1, z + 1, 1, 1, color.r, color.g, color.b, 1/255 ],
			[ x, y + 1, z + 1, 0, 0, color.r, color.g, color.b, 1/255 ]
		);
		
		// Bottom
		pushQuad(
			vertices,
			[ x, y + 1, z, 0, 0, color.r, color.g, color.b, 2/255 ],
			[ x + 1, y + 1, z, 1, 0, color.r, color.g, color.b, 2/255 ],
			[ x + 1, y, z, 1, 1, color.r, color.g, color.b, 2/255 ],
			[ x, y, z, 0, 0, color.r, color.g, color.b, 2/255 ]
		);
		
		// Front
		pushQuad(
			vertices,
			[ x, y, z, 0, 0, color.r, color.g, color.b, 3/255 ],
			[ x + 1, y, z, 1, 0, color.r, color.g, color.b, 3/255 ],
			[ x + 1, y, z + 1, 1, 1, color.r, color.g, color.b, 3/255 ],
			[ x, y, z + 1, 0, 0, color.r, color.g, color.b, 3/255 ]
		);
		
		// Back
		pushQuad(
			vertices,
			[ x, y + 1, z + 1, 0, 0, color.r, color.g, color.b, 4/255 ],
			[ x + 1, y + 1, z + 1, 1, 0, color.r, color.g, color.b, 4/255 ],
			[ x + 1, y + 1, z, 1, 1, color.r, color.g, color.b, 4/255 ],
			[ x, y + 1, z, 0, 0, color.r, color.g, color.b, 4/255 ]
		);
		
		// Left
		pushQuad(
			vertices,
			[ x, y, z + 1, 0, 0, color.r, color.g, color.b, 5/255 ],
			[ x, y + 1, z + 1, 1, 0, color.r, color.g, color.b, 5/255 ],
			[ x, y + 1, z, 1, 1, color.r, color.g, color.b, 5/255 ],
			[ x, y, z, 0, 0, color.r, color.g, color.b, 5/255 ]
		);
		
		// Right
		pushQuad(
			vertices,
			[ x + 1, y, z, 0, 0, color.r, color.g, color.b, 6/255 ],
			[ x + 1, y + 1, z, 1, 0, color.r, color.g, color.b, 6/255 ],
			[ x + 1, y + 1, z + 1, 1, 1, color.r, color.g, color.b, 6/255 ],
			[ x + 1, y, z + 1, 0, 0, color.r, color.g, color.b, 6/255 ]
		);
	}

}

return {
	World: World
}

});