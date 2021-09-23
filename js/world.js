Module.add('world',function(){

let onMac = navigator.platform.toUpperCase().indexOf('MAC')>=0;

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
		let lightMax = 1.0;
		let lightFull = [lightMax,lightMax,lightMax];

		let hasTranslucentTextures = block.hasTranslucentTextures;
		let id = block.id;

		var bH = block.isFluid && ( z == world.sz - 1 || !blocks[x][y][z+1].isFluid ) ? 0.8 : 1.0;
		let zLo = z+block.indent[0];	// Down
		let zHi = z+block.indent[1]*bH;	// Up
		let xLo = x+block.indent[2];	// Left
		let xHi = x+block.indent[3];	// Right
		let yLo = y+block.indent[4];	// Front
		let yHi = y+block.indent[5];	// Back

		// Up
		if ( z == world.sz - 1 || (block.isIndented || (world.blocks[x][y][z+1].transparent && world.blocks[x][y][z+1].id!=id)) )
		{
			let c = block.getTx( world, x, y, z, BlockDir.UP );

			let m = block.isSelfLit || z>=world.sz-1 ? lightFull : lightMap[x][y][z+1];
			let r = m[0];
			let g = m[1];
			let b = m[2];

			let c0 = c[0]+(c[2]-c[0])*block.indent[4];	// c[0]/c[2] is x, so low is front(4)
			let c2 = c[0]+(c[2]-c[0])*block.indent[5];	// c[0]/c[2] is x, so high is back(5)
			let c1 = c[1]+(c[3]-c[1])*block.indent[2];	// c[1]/c[3] is y so low is left(2)
			let c3 = c[1]+(c[3]-c[1])*block.indent[3];	// c[1]/c[3] is y so high is right(3)

			if( onMac ) {
				c2 *= 0.999;
				c3 *= 0.999;
			}

			pushQuad(
				hasTranslucentTextures ? vTrans : vSolid,
				[ xLo, yLo, zHi,		c0, c1, r, g, b, 1.0 ],
				[ xHi, yLo, zHi,		c2, c1, r, g, b, 1.0 ],
				[ xHi, yHi, zHi, 		c2, c3, r, g, b, 1.0 ],
				[ xLo, yHi, zHi,		c0, c3, r, g, b, 1.0 ]
			);
		}
		
		// Down
		if ( z == 0 || (block.isIndented || (world.blocks[x][y][z-1].transparent && world.blocks[x][y][z-1].id!=id)) )
		{
			let c = block.getTx( world, x, y, z, BlockDir.DOWN );
			
			let m = block.isSelfLit || z<=0 ? lightFull : lightMap[x][y][z-1];
			let r = m[0];
			let g = m[1];
			let b = m[2];

			let c0 = c[0]+(c[2]-c[0])*block.indent[4];	// c[0]/c[2] is x, so low is front(4)
			let c2 = c[0]+(c[2]-c[0])*block.indent[5];	// c[0]/c[2] is x, so high is back(5)
			let c1 = c[1]+(c[3]-c[1])*block.indent[2];	// c[1]/c[3] is y so low is left(2)
			let c3 = c[1]+(c[3]-c[1])*block.indent[3];	// c[1]/c[3] is y so high is right(3)

			if( onMac ) {
				c2 *= 0.999;
				c3 *= 0.999;
			}
			
			pushQuad(
				hasTranslucentTextures ? vTrans : vSolid,
				[ xLo, yHi, zLo,		c0, c3, r, g, b, 1.0 ],
				[ xHi, yHi, zLo,		c2, c3, r, g, b, 1.0 ],
				[ xHi, yLo, zLo,		c2, c1, r, g, b, 1.0 ],
				[ xLo, yLo, zLo,		c0, c1, r, g, b, 1.0 ]
			);
		}
		
		// Front
		if ( y == 0 || (block.isIndented || (world.blocks[x][y-1][z].transparent && world.blocks[x][y-1][z].id!=id)) )
		{
			// c is in this order: [ xPixel/this.width, yPixel/this.height, (xPixel+width)/this.width, (yPixel+height)/this.height ]
			let c = block.getTx( world, x, y, z, BlockDir.FRONT );
			
			let m = block.isSelfLit || y<=0 ? lightFull : lightMap[x][y-1][z];
			let r = m[0];
			let g = m[1];
			let b = m[2];
			

			let c0 = c[0]+(c[2]-c[0])*block.indent[2];	// c[0]/c[2] is x, so low is left(2)
			let c2 = c[0]+(c[2]-c[0])*block.indent[3];	// and high is right(3)
			let c1 = c[1]+(c[3]-c[1])*(1-block.indent[1]);	// c[1]/c[3] is y, which is inverse, so use up(1) at bottom, AND use 1-indent
			let c3 = c[1]+(c[3]-c[1])*(1-block.indent[0]);	// c[1]/c[3] is y, which is inverse, so use down(0) at top, AND use 1-indent

			if( onMac && c2!=1.0 ) {
				//debugger;
			}

			if( onMac ) {
				c2 *= 0.999;
				c3 *= 0.999;
			}

			pushQuad(
				hasTranslucentTextures ? vTrans : vSolid,
				[ xLo, yLo, zLo,	c0, c3, r, g, b, 1.0 ],
				[ xHi, yLo, zLo,	c2, c3, r, g, b, 1.0 ],
				[ xHi, yLo, zHi,	c2, c1, r, g, b, 1.0 ],
				[ xLo, yLo, zHi,	c0, c1, r, g, b, 1.0 ]
			);
		}
		
		// Back
		if ( y == world.sy - 1 || (block.isIndented || (world.blocks[x][y+1][z].transparent && world.blocks[x][y+1][z].id!=id)) )
		{
			let c = block.getTx( world, x, y, z, BlockDir.BACK );
			
			let m = block.isSelfLit || y>=world.sy-1 ? lightFull : lightMap[x][y+1][z];
			let r = m[0];
			let g = m[1];
			let b = m[2];

			let c0 = c[0]+(c[2]-c[0])*block.indent[2];	// c[0]/c[2] is x, so low is left(2)
			let c2 = c[0]+(c[2]-c[0])*block.indent[3];	// and high is right(3)
			let c1 = c[1]+(c[3]-c[1])*(1-block.indent[1]);	// c[1]/c[3] is y, which is inverse, so use up(1) at bottom, AND use 1-indent
			let c3 = c[1]+(c[3]-c[1])*(1-block.indent[0]);	// c[1]/c[3] is y, which is inverse, so use down(0) at top, AND use 1-indent
			
			if( onMac ) {
				c2 *= 0.999;
				c3 *= 0.999;
			}

			pushQuad(
				hasTranslucentTextures ? vTrans : vSolid,
				[ xLo, yHi, zHi,	c2, c1, r, g, b, 1.0 ],
				[ xHi, yHi, zHi,	c0, c1, r, g, b, 1.0 ],
				[ xHi, yHi, zLo,	c0, c3, r, g, b, 1.0 ],
				[ xLo, yHi, zLo,	c2, c3, r, g, b, 1.0 ]
			);
		}
		
		// Left
		if ( x == 0 || (block.isIndented || (world.blocks[x-1][y][z].transparent && world.blocks[x-1][y][z].id!=id)) )
		{
			let c = block.getTx( world, x, y, z, BlockDir.LEFT );
			
			let m = block.isSelfLit || x<=0 ? lightFull : lightMap[x-1][y][z];
			let r = m[0];
			let g = m[1];
			let b = m[2];

			let c0 = c[0]+(c[2]-c[0])*block.indent[4];	// c[0]/c[2] is x, so low is front(4)
			let c2 = c[0]+(c[2]-c[0])*block.indent[5];	// c[0]/c[2] is x, so high is back(5)
			let c1 = c[1]+(c[3]-c[1])*(1-block.indent[1]);	// c[1]/c[3] is y, which is inverse, so use up(1) at bottom, AND use 1-indent
			let c3 = c[1]+(c[3]-c[1])*(1-block.indent[0]);	// c[1]/c[3] is y, which is inverse, so use down(0) at top, AND use 1-indent

			if( onMac ) {
				c2 *= 0.999;
				c3 *= 0.999;
			}
			
			pushQuad(
				hasTranslucentTextures ? vTrans : vSolid,
				[ xLo, yLo, zHi,	c2, c1, r, g, b, 1.0 ],
				[ xLo, yHi, zHi,	c0, c1, r, g, b, 1.0 ],
				[ xLo, yHi, zLo,	c0, c3, r, g, b, 1.0 ],
				[ xLo, yLo, zLo,	c2, c3, r, g, b, 1.0 ]
			);
		}
		
		// Right
		if ( x == world.sx - 1 || (block.isIndented || (world.blocks[x+1][y][z].transparent && world.blocks[x+1][y][z].id!=id)) )
		{
			let c = block.getTx( world, x, y, z, BlockDir.RIGHT );
			
			let m = block.isSelfLit || x>=world.sx-1 ? lightFull : lightMap[x+1][y][z];
			let r = m[0];
			let g = m[1];
			let b = m[2];

			let c0 = c[0]+(c[2]-c[0])*block.indent[4];	// c[0]/c[2] is x, so low is front(4)
			let c2 = c[0]+(c[2]-c[0])*block.indent[5];	// c[0]/c[2] is x, so high is back(5)
			let c1 = c[1]+(c[3]-c[1])*(1-block.indent[1]);	// c[1]/c[3] is y, which is inverse, so use up(1) at bottom, AND use 1-indent
			let c3 = c[1]+(c[3]-c[1])*(1-block.indent[0]);	// c[1]/c[3] is y, which is inverse, so use down(0) at top, AND use 1-indent

			if( onMac ) {
				c2 *= 0.999;
				c3 *= 0.999;
			}
			
			pushQuad(
				hasTranslucentTextures ? vTrans : vSolid,
				[ xHi, yLo, zLo,	c0, c3, r, g, b, 1.0 ],
				[ xHi, yHi, zLo,	c2, c3, r, g, b, 1.0 ],
				[ xHi, yHi, zHi,	c2, c1, r, g, b, 1.0 ],
				[ xHi, yLo, zHi,	c0, c1, r, g, b, 1.0 ]
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