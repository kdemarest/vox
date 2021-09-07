// ==========================================
// Block types
//
// This file contains all available block types and their properties.
// ==========================================

// Direction enumeration
var DIRECTION = {};
DIRECTION.UP = 1;
DIRECTION.DOWN = 2;
DIRECTION.LEFT = 3;
DIRECTION.RIGHT = 4;
DIRECTION.FORWARD = 5;
DIRECTION.BACK = 6;

BLOCK = {};

// Air
BLOCK.AIR = {
	id: 0,
	spawnable: false,
	transparent: true,
	mayMove: true
};

// Bedrock
BLOCK.BEDROCK = {
	id: 1,
	spawnable: false,
	transparent: false,
	textureStem: 'block/bedrock.png',
};

// Dirt
BLOCK.DIRT = {
	id: 2,
	spawnable: true,
	transparent: false,
	selflit: false,
	gravity: false,
	fluid: false,
	textureStem: 'block/dirt.png',
};

// Wood
BLOCK.WOOD = {
	id: 3,
	spawnable: true,
	transparent: false,
	selflit: false,
	gravity: false,
	fluid: false,
	textureStem: 'block/oak_planks.png',
};

// TORCH
BLOCK.TORCH = {
	id: 4,
	spawnable: true,
	transparent: false,
	selflit: true,
	light: { mag: 8, r:1.0, g:1.0, b:1.0 },
	gravity: false,
	fluid: false,
	textureStem: 'block/torch.png',
};

// Bookcase
BLOCK.BOOKCASE = {
	id: 5,
	spawnable: true,
	transparent: false,
	selflit: false,
	light: { mag: 2, r:1.0, g: 1.0, b: 1.0 },
	gravity: false,
	fluid: false,
	textureStem: 'block/bookshelf.png',
};

// Lava
BLOCK.LAVA = {
	id: 6,
	spawnable: false,
	transparent: true,
	selflit: true,
	light: { mag: 5, r: 1.0, g: 0.5, b: 0.5 },
	gravity: true,
	fluid: true,
	textureStem: 'block/lava.png',
};

// Plank
BLOCK.PLANK = {
	id: 7,
	spawnable: true,
	transparent: false,
	selflit: false,
	gravity: false,
	fluid: false,
	textureStem: 'block/oak_planks.png',
};

// Cobblestone
BLOCK.COBBLESTONE = {
	id: 8,
	spawnable: true,
	transparent: false,
	selflit: false,
	gravity: false,
	fluid: false,
	textureStem: 'block/cobblestone.png',
};

// Concrete
BLOCK.CONCRETE = {
	id: 9,
	spawnable: true,
	transparent: false,
	selflit: false,
	gravity: false,
	fluid: false,
};

// Brick
BLOCK.BRICK = {
	id: 10,
	spawnable: true,
	transparent: false,
	selflit: false,
	gravity: false,
	fluid: false,
	textureStem: 'block/bricks.png',

};

// Sand
BLOCK.SAND = {
	id: 11,
	spawnable: true,
	transparent: false,
	selflit: false,
	gravity: true,
	fluid: false,
	textureStem: 'block/sand.png',
};

// Gravel
BLOCK.GRAVEL = {
	id: 12,
	spawnable: true,
	transparent: false,
	selflit: false,
	gravity: true,
	fluid: false,
	textureStem: 'block/gravel.png',
};

// Iron
BLOCK.IRON = {
	id: 13,
	spawnable: true,
	transparent: false,
	selflit: false,
	gravity: false,
	fluid: false,
	textureStem: 'block/iron_ore.png',
};

// Gold
BLOCK.GOLD = {
	id: 14,
	spawnable: true,
	transparent: false,
	selflit: false,
	gravity: false,
	fluid: false,
	textureStem: 'block/gold_ore.png',
};

// Diamond
BLOCK.DIAMOND = {
	id: 15,
	spawnable: true,
	transparent: false,
	selflit: false,
	gravity: false,
	fluid: false,
	textureStem: 'block/diamond_block.png',
};


// Obsidian
BLOCK.OBSIDIAN = {
	id: 16,
	spawnable: true,
	transparent: false,
	selflit: false,
	gravity: false,
	fluid: false,
	textureStem: 'block/obsidian.png',
};

// Glass
BLOCK.GLASS = {
	id: 17,
	spawnable: true,
	transparent: true,
	selflit: false,
	gravity: false,
	fluid: false,
	textureStem: 'block/glass.png',
};

// Sponge
BLOCK.SPONGE = {
	id: 18,
	spawnable: true,
	transparent: false,
	selflit: false,
	gravity: false,
	fluid: false,
	textureStem: 'block/sponge.png',
};

// Water
BLOCK.WATER = {
	id: 19,
	spawnable: true,
	transparent: true,
	selflit: false,
	gravity: false,
	fluid: true,
	textureStem: 'block/water.png',
};

// TNT
BLOCK.TNT = {
	id: 20,
	spawnable: true,
	transparent: false,
	selflit: false,
	gravity: false,
	fluid: false,
	textureStem: 'block/tnt_side.png',
};

BLOCK.atlasPixelRectDefault = null;


BLOCK.traverse = function( fn )
{
	for ( var mat in BLOCK )
		if ( typeof( BLOCK[mat] ) == "object" && BLOCK[mat]!==null && typeof(BLOCK[mat].id) !==undefined )
			fn(BLOCK[mat]);
}

BLOCK.traverse( block=>{ block.atlasPixelRect = []; } );


// fromId( id )
//
// Returns a block structure for the given id.

BLOCK.fromId = function( id )
{
	for ( var mat in BLOCK )
		if ( typeof( BLOCK[mat] ) == "object" && BLOCK[mat].id == id )
			return BLOCK[mat];
	return null;
}

// pushVertices( vertices, world, x, y, z )
//
// Pushes the vertices necessary for rendering a
// specific block into the array.

let LIGHT = new class {
	constructor() {
		this.max = 10;

		this.mag = function(min,max,lightMax) {
			let a = [];
			for( let i=0 ; i<=lightMax ; ++i ) { 
				let x = lightMax - i;
				let n1 = Math.exp(-x/(lightMax/3));	// technically should divide by 5
				let n2 = i/lightMax;
				let n = (n1+n2)/2.0;
				a[i] = min+(n*(max-min));
			}

			return a;
		}(0.03,1.0,this.max);
	}
}

BLOCK.getTx = function(block,world,x,y,z,dir) {
	if( block.textureStem ) {
		window.textureRepo.getResourceByImg(block.textureStem);
	}

	let c = block.atlasPixelRect[dir] || block.atlasPixelRect[0] || BLOCK.atlasPixelRectDefault;
	return c;
}

BLOCK.pushVertices = function( vertices, world, x, y, z )
{
	var blocks = world.blocks;
	var lightMap  = world.lightMap;
	var block  = blocks[x][y][z];
	var bH = block.fluid && ( z == world.sz - 1 || !blocks[x][y][z+1].fluid ) ? 0.8 : 1.0;
	let lightMax = LIGHT.max;
	let lightFull = [lightMax,lightMax,lightMax];

	// Top
	if ( z == world.sz - 1 || world.blocks[x][y][z+1].transparent || block.fluid )
	{
		let c = BLOCK.getTx( block, world, x, y, z, DIRECTION.UP );

		let m = block.selflit || z>=world.sz-1 ? lightFull : lightMap[x][y][z+1];
		let r = LIGHT.mag[ m[0] ];
		let g = LIGHT.mag[ m[1] ];
		let b = LIGHT.mag[ m[2] ];

		//let lightNum = z>=world.sz-1 ? 0 : lightMap[x][y][z+1];
		//var lightMultiplier = block.selflit ? 1.0 : lightMag[lightNum];

		pushQuad(
			vertices,
			[ x, y, z + bH,				c[0], c[1], r, g, b, 1.0 ],
			[ x + 1.0, y, z + bH,		c[2], c[1], r, g, b, 1.0 ],
			[ x + 1.0, y + 1.0, z + bH, c[2], c[3], r, g, b, 1.0 ],
			[ x, y + 1.0, z + bH,		c[0], c[3], r, g, b, 1.0 ]
		);
	}
	
	// Bottom
	if ( z == 0 || world.blocks[x][y][z-1].transparent )
	{
		let c = BLOCK.getTx( block, world, x, y, z, DIRECTION.DOWN );
		
		let m = block.selflit || z<=0 ? lightFull : lightMap[x][y][z-1];
		let r = LIGHT.mag[ m[0] ];
		let g = LIGHT.mag[ m[1] ];
		let b = LIGHT.mag[ m[2] ];
		
		pushQuad(
			vertices,							
			[ x, y + 1.0, z,		c[0], c[3], r, g, b, 1.0 ],
			[ x + 1.0, y + 1.0, z,	c[2], c[3], r, g, b, 1.0 ],
			[ x + 1.0, y, z,		c[2], c[1], r, g, b, 1.0 ],
			[ x, y, z,				c[0], c[1], r, g, b, 1.0 ]
		);
	}
	
	// Front
	if ( y == 0 || world.blocks[x][y-1][z].transparent )
	{
		let c = BLOCK.getTx( block, world, x, y, z, DIRECTION.FORWARD );
		
		let m = block.selflit || y<=0 ? lightFull : lightMap[x][y-1][z];
		let r = LIGHT.mag[ m[0] ];
		let g = LIGHT.mag[ m[1] ];
		let b = LIGHT.mag[ m[2] ];
		
		pushQuad(
			vertices,
			[ x, y, z,				c[0], c[3], r, g, b, 1.0 ],
			[ x + 1.0, y, z,		c[2], c[3], r, g, b, 1.0 ],
			[ x + 1.0, y, z + bH,	c[2], c[1], r, g, b, 1.0 ],
			[ x, y, z + bH,			c[0], c[1], r, g, b, 1.0 ]
		);
	}
	
	// Back
	if ( y == world.sy - 1 || world.blocks[x][y+1][z].transparent )
	{
		let c = BLOCK.getTx( block, world, x, y, z, DIRECTION.BACK );
		
		let m = block.selflit || y>=world.sy-1 ? lightFull : lightMap[x][y+1][z];
		let r = LIGHT.mag[ m[0] ];
		let g = LIGHT.mag[ m[1] ];
		let b = LIGHT.mag[ m[2] ];
		
		pushQuad(
			vertices,
			[ x, y + 1.0, z + bH,		c[2], c[1], r, g, b, 1.0 ],
			[ x + 1.0, y + 1.0, z + bH,	c[0], c[1], r, g, b, 1.0 ],
			[ x + 1.0, y + 1.0, z,		c[0], c[3], r, g, b, 1.0 ],
			[ x, y + 1.0, z,			c[2], c[3], r, g, b, 1.0 ]
		);
	}
	
	// Left
	if ( x == 0 || world.blocks[x-1][y][z].transparent )
	{
		let c = BLOCK.getTx( block, world, x, y, z, DIRECTION.LEFT );
		
		let m = block.selflit || x<=0 ? lightFull : lightMap[x-1][y][z];
		let r = LIGHT.mag[ m[0] ];
		let g = LIGHT.mag[ m[1] ];
		let b = LIGHT.mag[ m[2] ];
		
		pushQuad(
			vertices,
			[ x, y, z + bH,			c[2], c[1], r, g, b, 1.0 ],
			[ x, y + 1.0, z + bH,	c[0], c[1], r, g, b, 1.0 ],
			[ x, y + 1.0, z,		c[0], c[3], r, g, b, 1.0 ],
			[ x, y, z,				c[2], c[3], r, g, b, 1.0 ]
		);
	}
	
	// Right
	if ( x == world.sx - 1 || world.blocks[x+1][y][z].transparent )
	{
		let c = BLOCK.getTx( block, world, x, y, z, DIRECTION.RIGHT );
		
		let m = block.selflit || x>=world.sx-1 ? lightFull : lightMap[x+1][y][z];
		let r = LIGHT.mag[ m[0] ];
		let g = LIGHT.mag[ m[1] ];
		let b = LIGHT.mag[ m[2] ];
		
		pushQuad(
			vertices,
			[ x + 1.0, y, z,			c[0], c[3], r, g, b, 1.0 ],
			[ x + 1.0, y + 1.0, z,		c[2], c[3], r, g, b, 1.0 ],
			[ x + 1.0, y + 1.0, z + bH,	c[2], c[1], r, g, b, 1.0 ],
			[ x + 1.0, y, z + bH,		c[0], c[1], r, g, b, 1.0 ]
		);
	}
}

// pushPickingVertices( vertices, x, y, z )
//
// Pushes vertices with the data needed for picking.

BLOCK.pushPickingVertices = function( vertices, x, y, z )
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
