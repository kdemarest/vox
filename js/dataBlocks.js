Module.add( 'blocks', function() {


// ==========================================
// Block types
//
// This file contains all available block types and their properties.
// ==========================================

// Direction enumeration
const BlockDir = new class {
	constructor() {
		this.DOWN	= 0;
		this.UP		= 1;
		this.LEFT	= 2;
		this.RIGHT	= 3;
		this.FRONT	= 4;
		this.BACK	= 5;
		this.FIRST  = 0;
		this.LAST   = 5;
	}
	traverse(fn) {
		for( let blockDir=this.FIRST ; blockDir<=this.LAST ; ++blockDir ) {
			if( fn(blockDir) === false ) {
				return;
			}
		}
	}
	validate(blockDir) {
		return Number.isInteger(blockDir) && blockDir >= this.FIRST && blockDir <= this.LAST;
	}
}



let BlockData = {};

// Air
BlockData.AIR = {
	id: 0,
	spawnable: false,
	transparent: true,
	passable: true,
	isAir: true,
	mayMove: true,
	textureStem: [null],
};

// Bedrock
BlockData.BEDROCK = {
	id: 1,
	spawnable: false,
	transparent: false,
	textureStem: ['block/bedrock.png'],
};

// Dirt
BlockData.DIRT = {
	id: 2,
	spawnable: true,
	transparent: false,
	selflit: false,
	gravity: false,
	textureStem: ['block/dirt.png'],
};

// Wood
BlockData.WOOD = {
	id: 3,
	spawnable: true,
	transparent: false,
	selflit: false,
	gravity: false,
	textureStem: ['block/oak_planks.png'],
};

// TORCH
BlockData.TORCH = {
	id: 4,
	spawnable: true,
	transparent: true,
	selflit: true,
	passable: true,
	light: { mag: 6, r:1.0, g:1.0, b:1.0 },
	gravity: false,
	indent: [ 0/16, 10/16, 7/16, 9/16, 7/16, 9/16 ],
	textureStem: ['block/torch.png'],
};

// Bookcase
BlockData.BOOKCASE = {
	id: 5,
	spawnable: true,
	transparent: false,
	selflit: false,
	light: { mag: 2, r:1.0, g: 1.0, b: 1.0 },
	gravity: false,
	textureStem: ['block/bookshelf.png'],
};

// Lava
BlockData.LAVA = {
	id: 6,
	spawnable: false,
	transparent: true,
	selflit: true,
	light: { mag: 5, r: 1.0, g: 0.5, b: 0.5 },
	gravity: true,
	fluid: true,
	textureStem: ['block/lava.png'],
};

// Plank
BlockData.PLANK = {
	id: 7,
	spawnable: true,
	transparent: false,
	selflit: false,
	gravity: false,
	textureStem: ['block/oak_planks.png'],
};

// Cobblestone
BlockData.COBBLESTONE = {
	id: 8,
	spawnable: true,
	transparent: false,
	selflit: false,
	gravity: false,
	textureStem: ['block/cobblestone.png'],
};

// Stone
BlockData.STONE = {
	id: 9,
	spawnable: true,
	transparent: false,
	selflit: false,
	gravity: false,
	textureStem: ['block/stone.png'],
};

// Brick
BlockData.BRICK = {
	id: 10,
	spawnable: true,
	transparent: false,
	selflit: false,
	gravity: false,
	textureStem: ['block/bricks.png'],

};

// Sand
BlockData.SAND = {
	id: 11,
	spawnable: true,
	transparent: false,
	selflit: false,
	gravity: true,
	textureStem: ['block/sand.png'],
};

// Gravel
BlockData.GRAVEL = {
	id: 12,
	spawnable: true,
	transparent: false,
	selflit: false,
	gravity: true,
	textureStem: ['block/gravel.png'],
};

// Iron
BlockData.IRON = {
	id: 13,
	spawnable: true,
	transparent: false,
	selflit: false,
	gravity: false,
	textureStem: ['block/iron_ore.png'],
};

// Gold
BlockData.GOLD = {
	id: 14,
	spawnable: true,
	transparent: false,
	selflit: false,
	gravity: false,
	textureStem: ['block/gold_ore.png'],
};

// Diamond
BlockData.DIAMOND = {
	id: 15,
	spawnable: true,
	transparent: false,
	selflit: false,
	gravity: false,
	textureStem: ['block/diamond_block.png'],
};


// Obsidian
BlockData.OBSIDIAN = {
	id: 16,
	spawnable: true,
	transparent: false,
	selflit: false,
	gravity: false,
	textureStem: ['block/obsidian.png'],
};

// Glass
BlockData.GLASS = {
	id: 17,
	spawnable: true,
	transparent: true,
	trans: true,
	selflit: false,
	gravity: false,
	textureStem: ['block/glass.png']
};

// Sponge
BlockData.SPONGE = {
	id: 18,
	spawnable: true,
	transparent: false,
	selflit: false,
	gravity: false,
	textureStem: ['block/sponge.png'],
};

// Water
BlockData.WATER = {
	id: 19,
	spawnable: true,
	transparent: true,
	trans: true,
	selflit: false,
	gravity: false,
	fluid: true,
	textureStem: ['block/waterBoldBlue.png'],
};

// TNT
BlockData.TNT = {
	id: 20,
	spawnable: true,
	transparent: false,
	selflit: false,
	gravity: false,
	textureStem: ['block/tnt_side.png'],
};

class Block {
	constructor() {
		this.textureAtlasPixelRect = [];
	}
	initFromData(key,value) {
		this.id = key;
		Object.assign( this, value );
		this.isIndented = this.indent !== undefined && this.indent !== null && this.indent !== false;
		this.indent = this.indent || Block.noIndent;
		BlockDir.traverse( blockDir => {
			if( this.textureStem[blockDir] === undefined ) {
				this.textureStem[blockDir] = this.textureStem[0];
			}
		});
		return this;
	}
	getTx(world,x,y,z,blockDir) {
		console.assert( BlockDir.validate(blockDir) );
		let block = this;
		let repo = window.textureRepo;
		repo.getResourceByImg(block.textureStem[blockDir]);

		let c = block.textureAtlasPixelRect[blockDir] || Block.textureAtlasPixelRectDefault;
		return c;
	}
}
Block.textureAtlasPixelRectDefault = [0,0,1,1];
Block.noIndent = [0,1,0,1,0,1];	// down, up, left, right, front, back

let BlockType = new class {
	constructor() {
	}
	initFromData(blockData) {
		for (const [key, value] of Object.entries(blockData)) {
			console.assert( String.isUpper(key) );
			this[key] = new Block().initFromData(key,value);
		}
	}
	traverse( fn ) {
		for ( var key in this ) {
			let block = this[key];
			if ( typeof( block ) == "object" && block!==null && typeof(block.id) !==undefined ) {
				if( fn( block, key ) === false ) {
					break;
				}
			}
		}
	}
}

BlockType.initFromData(BlockData);

return {
	BlockType: BlockType,
	BlockDir: BlockDir
}

});
