Module.add('renderer',function(){

	// ==========================================
	// Renderer
	//
	// This class contains the code that takes care of visualising the
	// elements in the specified world.
	// ==========================================

	// Shaders
	var blockVertexSource = `
		uniform mat4 uProjMatrix;
		uniform mat4 uViewMatrix;
		uniform mat4 uModelMatrix;
		attribute vec3 aPos;
		attribute vec4 aColor;
		attribute vec2 aTexCoord;
		varying vec4 vColor;
		varying vec2 vTexCoord;
		void main() {
			gl_Position = uProjMatrix * uViewMatrix * ( uModelMatrix * vec4( aPos, 1.0 ) );
			vColor = aColor;
			vTexCoord = aTexCoord;
		}
	`;
	var blockFragmentSource = `
		precision highp float;
		uniform sampler2D uSampler;
		varying vec4 vColor;
		varying vec2 vTexCoord;
		void main() {
			// vColor is the tinting from the light source, so we want the texture's rgba
			// tinted by the vColor rgb, then combined with the background rgba
			vec4 color = texture2D( uSampler, vec2( vTexCoord.s, vTexCoord.t ) );
			if ( color.a < 0.1 ) discard;
			gl_FragColor = vec4( color.rgb * vColor.rgb, color.a );
		}
	`;

	// buildChunks( count )
	//
	// Build up to <count> dirty chunks.

	function pushQuad( v, p1, p2, p3, p4 )
	{
		v.push( p1[0], p1[1], p1[2], p1[3], p1[4], p1[5], p1[6], p1[7], p1[8] );
		v.push( p2[0], p2[1], p2[2], p2[3], p2[4], p2[5], p2[6], p2[7], p2[8] );
		v.push( p3[0], p3[1], p3[2], p3[3], p3[4], p3[5], p3[6], p3[7], p3[8] );
		
		v.push( p3[0], p3[1], p3[2], p3[3], p3[4], p3[5], p3[6], p3[7], p3[8] );
		v.push( p4[0], p4[1], p4[2], p4[3], p4[4], p4[5], p4[6], p4[7], p4[8] );
		v.push( p1[0], p1[1], p1[2], p1[3], p1[4], p1[5], p1[6], p1[7], p1[8] );
	}

	class OpenGl {
		constructor( id ) {
			var canvas = this.canvas = document.getElementById( id );
			canvas.width = canvas.clientWidth;
			canvas.height = canvas.clientHeight;
			
			// Initialise WebGL
			var gl;
			try
			{
				// Ken added this attrib so that we wouldn't have seams between wall triangles.
				let glAttribs = {
					antialias: false,
					alpha: false
					//premultipliedAlpha: false
				}
				gl = this.gl = canvas.getContext( "webgl", glAttribs );
			} catch ( e ) {
				throw "Your browser doesn't support WebGL!";
			}

			gl.viewportWidth = canvas.width;
			gl.viewportHeight = canvas.height;
			
			gl.clearColor( 0.62, 0.81, 1.0, 1.0 );
			gl.enable( gl.DEPTH_TEST );
			gl.enable( gl.CULL_FACE );	// and the culling mode defaults to gl.BACK
			gl.blendFunc( gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA );
			gl.enable( gl.BLEND );
		}
	}

	class Atlas extends TextureWriter {
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

	class ShaderSet {
		constructor() {
			this.gl = window.openGl.gl;
			this.program = this.gl.createProgram();
		}
		fetch(source, type) {
			let gl = this.gl;
			let shader = gl.createShader( type );
			gl.shaderSource( shader, source );
			gl.compileShader( shader );
			gl.attachShader( this.program, shader );
			
			if ( !gl.getShaderParameter( shader, gl.COMPILE_STATUS ) ) {
				throw "Could not compile vertex shader!\n" + gl.getShaderInfoLog( shader );
			}
			return this;
		}
		link()
		{
			var gl = this.gl;
			gl.linkProgram( this.program );
			if ( !gl.getProgramParameter( this.program, gl.LINK_STATUS ) ) {
				throw "Could not link the shader program!";
			}
			return this;
		}
		use() {
			var gl = this.gl;
			gl.useProgram( this.program );
			return this;
		}
	}

	class Renderer {
		constructor(openGl) {
			let gl = this.gl = openGl.gl;
			let canvas = this.canvas = openGl.canvas; 
			canvas.renderer = this;

			this.pickBlock = new PickBlock(gl);

			// Load shaders
			this.blockShaders =
				new ShaderSet()
				.fetch( blockVertexSource, gl.VERTEX_SHADER )
				.fetch( blockFragmentSource, gl.FRAGMENT_SHADER )
				.link()
				.use();
			;
			// Store variable locations
			let program = this.blockShaders.program;
			this.uProjMat	= gl.getUniformLocation( program, "uProjMatrix" );
			this.uViewMat	= gl.getUniformLocation( program, "uViewMatrix" );
			this.uModelMat	= gl.getUniformLocation( program, "uModelMatrix" );
			this.uSampler	= gl.getUniformLocation( program, "uSampler" );
			this.aPos		= gl.getAttribLocation( program, "aPos" );
			this.aColor		= gl.getAttribLocation( program, "aColor" );
			this.aTexCoord	= gl.getAttribLocation( program, "aTexCoord" );

			// Create projection and view matrices
			this.projMatrix = mat4.create();
			this.viewMatrix = mat4.create();
			
			// Create dummy model matrix
			this.modelMatrix = mat4.create();
			mat4.identity( this.modelMatrix );
			
			// Create 1px white texture for pure vertex color operations (e.g. picking)
			var whiteTexture = this.texWhite = gl.createTexture();
			gl.activeTexture( gl.TEXTURE0 );
			gl.bindTexture( gl.TEXTURE_2D, whiteTexture );
			var white = new Uint8Array( [ 255, 255, 255, 255 ] );
			gl.texImage2D( gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, white );
			gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST );
			gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST );
			gl.uniform1i(  this.uSampler, 0 );

			// Load terrain texture
			this.atlas = new Atlas(1024,1024);

			BLOCK.atlasPixelRectDefault = [0,0,1,1];

			// Create canvas used to draw name tags
			var textCanvas = this.textCanvas = document.createElement( "canvas" );
			textCanvas.width = 256;
			textCanvas.height = 64;
			textCanvas.style.display = "none";
			var ctx = this.textContext = textCanvas.getContext( "2d" );
			ctx.textAlign = "left";
			ctx.textBaseline = "middle";
			ctx.font = "24px Minecraftia";
			document.getElementsByTagName( "body" )[0].appendChild( textCanvas );
		}

		onImageComplete( status, imgStem, resource ) {
			if( imgStem === false ) {
				// it is the placeholder...
				let rect = this.atlas.add( resource.texture, resource.texture.width, resource.texture.height );
				BLOCK.atlasPixelRectDefault = rect;
				return;
			}
			let assigned = false;
			BLOCK.traverse( block => {
//				if( block.id !== 2 && block.id !== 1 ) { assigned=true; return; }
				if( block.textureStem == imgStem ) {
					let rect = this.atlas.add( resource.texture, resource.texture.width, resource.texture.height );
					console.log( imgStem,'at',rect);
					block.atlasPixelRect = [rect];	// zero'th index means 'all directions use this rect'
					//block.atlasPixelRect = [[0,0,1,1]];	// zero'th index means 'all directions use this rect'
					assigned = true;
					return;
				}
			});
			for ( var i = 0; i < this.chunks.length; i++ )
				this.chunks[i].dirty = true;

			console.assert( assigned );
		}
		// draw()
		//
		// Render one frame of the world to the canvas.

		draw()
		{
			var gl = this.gl;

			gl.useProgram( this.blockShaders.program );
			gl.enableVertexAttribArray( this.aPos );
			gl.enableVertexAttribArray( this.aColor );
			gl.enableVertexAttribArray( this.aTexCoord );
			
			// Initialise view
			gl.bindFramebuffer(gl.FRAMEBUFFER, null);
			this.updateViewport();
			gl.viewport( 0, 0, gl.viewportWidth, gl.viewportHeight );
			gl.enable( gl.BLEND );
			gl.blendFunc( gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA );
			gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT );

			gl.uniformMatrix4fv( this.uViewMat, false, this.viewMatrix );
			gl.uniformMatrix4fv( this.uProjMat, false, this.projMatrix );
			gl.uniformMatrix4fv( this.uModelMat, false, this.modelMatrix );
		
			// Draw level chunks
			var chunks = this.chunks;
			
			gl.bindTexture( gl.TEXTURE_2D, this.atlas.texture ); //this.texTerrain );

			if ( chunks != null )
			{
				for ( var i = 0; i < chunks.length; i++ )
				{
					if ( chunks[i].bSolid != null ) 
						this.drawBuffer( chunks[i].bSolid );
				}

				for ( var i = 0; i < chunks.length; i++ )
				{
					if ( chunks[i].bTrans != null ) 
						this.drawBuffer( chunks[i].bTrans );
				}
			}
			
			mat4.identity( this.modelMatrix );
			gl.uniformMatrix4fv( this.uModelMat, false, this.modelMatrix );

			gl.disableVertexAttribArray( this.aPos );
			gl.disableVertexAttribArray( this.aColor );
			gl.disableVertexAttribArray( this.aTexCoord );
		}



		// updateViewport()
		//
		// Check if the viewport is still the same size and update
		// the render configuration if required.

		updateViewport()
		{
			var gl = this.gl;
			var canvas = this.canvas;
			
			if ( canvas.clientWidth != gl.viewportWidth || canvas.clientHeight != gl.viewportHeight )
			{
				gl.viewportWidth = canvas.clientWidth;
				gl.viewportHeight = canvas.clientHeight;
				
				canvas.width = canvas.clientWidth;
				canvas.height = canvas.clientHeight;
				
				// Update perspective projection based on new w/h ratio
				this.setPerspective( this.fov, this.min, this.max );
			}
		}

		// setWorld( world, chunkSize )
		//
		// Makes the renderer start tracking a new world and set up the chunk structure.
		//
		// world - The world object to operate on.
		// chunkSize - X, Y and Z dimensions of each chunk, doesn't have to fit exactly inside the world.

		setWorld( world, chunkSize )
		{
			this.world = world;
			world.renderer = this;
			this.chunkSize = chunkSize;
			
			// Create chunk list
			var chunks = this.chunks = [];
			for ( var x = 0; x < world.sx; x += chunkSize ) {
				for ( var y = 0; y < world.sy; y += chunkSize ) {
					for ( var z = 0; z < world.sz; z += chunkSize ) {
						chunks.push( {
							index: [ Math.floor(x/chunkSize), Math.floor(y/chunkSize), Math.floor(z/chunkSize) ],
							start: [ x, y, z ],
							end: [ Math.min( world.sx, x + chunkSize ), Math.min( world.sy, y + chunkSize ), Math.min( world.sz, z + chunkSize ) ],
							dirty: true
						} );
					}
				}
			}
		}

		// onBlockChanged( x, y, z )
		//
		// Callback from world to inform the renderer of a changed block

		onBlockChanged( x, y, z )
		{
			brainlessLight(this.world);
			let cx = Math.floor(x/this.chunkSize);
			let cy = Math.floor(y/this.chunkSize);
			let cz = Math.floor(z/this.chunkSize);

			var chunks = this.chunks;
			
			for ( var i = 0; i < chunks.length; i++ )
			{
				// Because light might extend quite far, we just dirty ALL adjacent chunks.
				if( Math.abs(cx-chunks[i].index[0])<=1 && Math.abs(cy-chunks[i].index[1])<=1 && Math.abs(cz-chunks[i].index[2])<=1 ) {
					chunks[i].dirty = true;
				}

				// Neighbouring chunks are updated as well if the block is on a chunk border
				// Also, all chunks below the block are updated because of lighting
				if ( x >= chunks[i].start[0] && x < chunks[i].end[0] && y >= chunks[i].start[1] && y < chunks[i].end[1] && z >= chunks[i].start[2] && z < chunks[i].end[2] )
					chunks[i].dirty = true;
				else if ( x >= chunks[i].start[0] && x < chunks[i].end[0] && y >= chunks[i].start[1] && y < chunks[i].end[1] && ( z >= chunks[i].end[2] || z == chunks[i].start[2] - 1 ) )
					chunks[i].dirty = true;
				else if ( x >= chunks[i].start[0] && x < chunks[i].end[0] && z >= chunks[i].start[2] && z < chunks[i].end[2] && ( y == chunks[i].end[1] || y == chunks[i].start[1] - 1 ) )
					chunks[i].dirty = true;
				else if ( y >= chunks[i].start[1] && y < chunks[i].end[1] && z >= chunks[i].start[2] && z < chunks[i].end[2] && ( x == chunks[i].end[0] || x == chunks[i].start[0] - 1 ) )
					chunks[i].dirty = true;
			}
		}

		buildChunks( count )
		{
			var gl = this.gl;
			var chunks = this.chunks;
			var world = this.world;
			
			for ( var i = 0; i < chunks.length; i++ )
			{
				var chunk = chunks[i];
				
				if ( chunk.dirty )
				{
					var vSolid = [];
					var vTrans = [];

					// Add vertices for blocks
					for ( var x = chunk.start[0]; x < chunk.end[0]; x++ ) {
						for ( var y = chunk.start[1]; y < chunk.end[1]; y++ ) {
							for ( var z = chunk.start[2]; z < chunk.end[2]; z++ ) {
								if ( world.blocks[x][y][z] == BLOCK.AIR ) continue;
								BLOCK.pushVertices( vSolid, vTrans, world, x, y, z );
							}
						}
					}
					
					// Create WebGL buffer
					if ( chunk.bSolid ) gl.deleteBuffer( chunk.bSolid );
					if ( chunk.bTrans ) gl.deleteBuffer( chunk.bTrans );
					
					chunk.bSolid = gl.createBuffer();
					chunk.bTrans = gl.createBuffer();
					chunk.bSolid.vertices = vSolid.length / 9;
					chunk.bTrans.vertices = vTrans.length / 9;
					gl.bindBuffer( gl.ARRAY_BUFFER, chunk.bSolid );
					gl.bufferData( gl.ARRAY_BUFFER, new Float32Array( vSolid ), gl.STATIC_DRAW );
					gl.bindBuffer( gl.ARRAY_BUFFER, chunk.bTrans );
					gl.bufferData( gl.ARRAY_BUFFER, new Float32Array( vTrans ), gl.STATIC_DRAW );
					
					chunk.dirty = false;
					count--;
				}
				
				if ( count == 0 ) break;
			}
		}

		// setPerspective( fov, min, max )
		//
		// Sets the properties of the perspective projection.

		setPerspective( fov, min, max )
		{
			var gl = this.gl;
			
			this.fov = fov;
			this.min = min;
			this.max = max;
			
			mat4.perspective( fov, gl.viewportWidth / gl.viewportHeight, min, max, this.projMatrix );
		}

		// setCamera( pos, ang )
		//
		// Moves the camera to the specified orientation.
		//
		// pos - Position in world coordinates.
		// ang - Pitch, yaw and roll.

		setCamera( pos, ang )
		{
			var gl = this.gl;
			
			this.camPos = pos;
			
			mat4.identity( this.viewMatrix );
			
			mat4.rotate( this.viewMatrix, -ang[0] - Math.PI / 2, [ 1, 0, 0 ], this.viewMatrix );
			mat4.rotate( this.viewMatrix, ang[1], [ 0, 0, 1 ], this.viewMatrix );
			mat4.rotate( this.viewMatrix, -ang[2], [ 0, 1, 0 ], this.viewMatrix );
			
			mat4.translate( this.viewMatrix, [ -pos[0], -pos[1], -pos[2] ], this.viewMatrix );
		}

		drawBuffer( buffer )
		{
			var gl = this.gl;
			
			gl.bindBuffer( gl.ARRAY_BUFFER, buffer );

			// Define the format that our triangle components are stored in, that is:
			// 3 vec pos, 2 vec texCoord, 4 vec color
			// void gl.vertexAttribPointer(index, size, type, normalized, stride, offset);	
			gl.vertexAttribPointer( this.aPos, 3, gl.FLOAT, false, 9*4, 0 );
			gl.vertexAttribPointer( this.aColor, 4, gl.FLOAT, false, 9*4, 5*4 );
			gl.vertexAttribPointer( this.aTexCoord, 2, gl.FLOAT, false, 9*4, 3*4 );
			
			gl.drawArrays( gl.TRIANGLES, 0, buffer.vertices );
		}
	}

	return {
		OpenGl: OpenGl,
		Renderer: Renderer,
		ShaderSet: ShaderSet,
		pushQuad: pushQuad
	}

});