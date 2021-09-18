Module.add('textureAtlas',function(){

	class TextureAtlas extends TextureWriter {
		constructor(width,height) {
			super();
			this.xOffset = 0;
			this.yOffset = 0;
			this.yMaxHeight = 0;

			let gl = window.openGl.gl;
			this.init(gl);
			this.create(gl,width,height);
		}
		add( txSource, txWidth, txHeight ) {
			let gl = window.openGl.gl;

			if( this.xOffset + txWidth >= this.width ) {
				this.xOffset = 0;
				this.yOffset += this.yMaxHeight;
				this.yMaxHeight = 0;
			}

			this.draw(gl,txSource,this.xOffset,this.yOffset,txWidth,txHeight);
			let rect = this.coord( this.xOffset, this.yOffset, txWidth, txHeight );
			this.xOffset += txWidth;
			this.yMaxHeight = Math.max( this.yMaxHeight, txHeight );
			return rect;
		}
		coord( xPixel, yPixel, width, height ) {
			return [ xPixel/this.width, yPixel/this.height, (xPixel+width)/this.width, (yPixel+height)/this.height ];
		}
	}

	return {
		TextureAtlas: TextureAtlas
	}

});
