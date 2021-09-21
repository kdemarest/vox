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

let BlockDataDefaults = {
	transparent: false,		// means that adjacent blocks must draw their outside edges.
	spawnable: true,		// The player can not spawn this block.
	passable: false,		// The player can walk through this block.
	isGas: false,			// General idea that the space is very open
	textureStem: null,		// Array from 0 to 5 this is the image file for the face down, up, left, right, front, back
	isSelfLit: false,		// Does it glow, all by itself?
	hasTranslucentTextures: false,	// determines which list you go into for drawing.
};

BlockData.UNKNOWN = {
	isUnknown: true,
	neverRender: true,
	spawnable: false,
	transparent: true,
	passable: true,
	textureStem: [null],
};

BlockData.AIR = {
	neverRender: true,
	spawnable: false,
	transparent: true,
	passable: true,
	isGas: true,
	textureStem: [null],
};

BlockData.BEDROCK = {
	spawnable: false,
	textureStem: ['block/bedrock.png'],
};

BlockData.DIRT = {
	textureStem: ['block/dirt.png'],
};

BlockData.WOOD = {
	textureStem: ['block/oak_planks.png'],
};

BlockData.TORCH = {
	transparent: true,
	isSelfLit: true,
	passable: true,
	light: { mag: 6, r:1.0, g:1.0, b:1.0 },
	indent: [ 0/16, 10/16, 7/16, 9/16, 7/16, 9/16 ],
	textureStem: ['block/torch.png'],
};

BlockData.BRIDGE = {
	transparent: true,
	indent: [ 8/16, 16/16, 0, 1, 0, 1 ],
	textureStem: ['block/oak_planks.png'],
};

BlockData.CONCRETE = {
	textureStem: ['block/light_gray_concrete.png'],
};

BlockData.BOOKCASE = {
	light: { mag: 2, r:1.0, g: 1.0, b: 1.0 },
	textureStem: ['block/bookshelf.png'],
};

BlockData.LAVA = {
	spawnable: false,
	transparent: true,
	isSelfLit: true,
	light: { mag: 5, r: 1.0, g: 0.5, b: 0.5 },
	isFluid: true,
	textureStem: ['block/lava.png'],
};

BlockData.PLANK = {
	textureStem: ['block/oak_planks.png'],
};

BlockData.STONE_BRICKS = {
	textureStem: ['block/stone_bricks.png'],
};

BlockData.MOSSY_STONE_BRICKS = {
	textureStem: ['block/mossy_stone_bricks.png'],
};

BlockData.CRACKED_STONE_BRICKS = {
	textureStem: ['block/cracked_stone_bricks.png'],
};

BlockData.OAK_LOG = {
	textureStem: ['block/oak_log_top.png','block/oak_log_top.png','block/oak_log.png','block/oak_log.png','block/oak_log.png','block/oak_log.png'],
};


BlockData.STONE_SLAB = {
	transparent: true,
	indent: [ 0/16, 8/16, 0, 1, 0, 1 ],
	textureStem: ['block/stone_bricks.png'],
};

BlockData.COLUMN = {
	transparent: true,
	indent: [ 0, 1, 2/16, 14/16, 2/16, 14/16 ],
	textureStem: ['block/polished_andesite.png'],
};

BlockData.POST = {
	transparent: true,
	indent: [ 0/16, 16/16, 7/16, 9/16, 7/16, 9/16 ],
	textureStem: ['block/jungle_planks.png'],
};


BlockData.COBBLESTONE = {
	textureStem: ['block/cobblestone.png'],
};

BlockData.STONE = {
	textureStem: ['block/stone.png'],
};

BlockData.BRICK = {
	textureStem: ['block/bricks.png'],

};

BlockData.SAND = {
	textureStem: ['block/sand.png'],
};

BlockData.SHELF = {
	transparent: true,
	indent: [ 14/16, 16/16, 0, 1, 0, 1 ],
	textureStem: ['block/jungle_planks.png'],
};

BlockData.JUNGLE_PLANKS = {
	textureStem: ['block/jungle_planks.png'],
};

BlockData.LECTERN_TOP = {
	textureStem: ['block/lectern_top.png'],
};

BlockData.GRAVEL = {
	textureStem: ['block/gravel.png'],
};

BlockData.IRON = {
	textureStem: ['block/iron_ore.png'],
};

BlockData.GOLD = {
	textureStem: ['block/gold_ore.png'],
};

BlockData.DIAMOND = {
	textureStem: ['block/diamond_block.png'],
};


BlockData.OBSIDIAN = {
	textureStem: ['block/obsidian.png'],
};

BlockData.GLASS = {
	transparent: true,
	hasTranslucentTextures: true,
	textureStem: ['block/glass.png']
};

BlockData.SPONGE = {
	textureStem: ['block/sponge.png'],
};

BlockData.WATER = {
	transparent: true,
	hasTranslucentTextures: true,
	isFluid: true,
	textureStem: ['block/waterBoldBlue.png'],
};

BlockData.TNT = {
	textureStem: ['block/tnt_side.png'],
};

class Block {
	constructor() {
		this.textureAtlasPixelRect = [];
	}
	initFromData(key,value) {
		this.id = key;
		Object.assign( this, BlockDataDefaults, value );
		this.isIndented = this.indent !== undefined && this.indent !== null && this.indent !== false;
		this.indent = this.indent || Block.noIndent;
		
		this.textureStem = this.textureStem || [];
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
	Block: Block,
	BlockType: BlockType,
	BlockDir: BlockDir
}

});
