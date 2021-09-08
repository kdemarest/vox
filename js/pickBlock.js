Module.add('pickBlock',function(){

	var pickVertexSource = `
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

	var pickFragmentSource = `
		precision highp float;
		uniform sampler2D uSampler;
		varying vec4 vColor;
		varying vec2 vTexCoord;
		void main() {
			vec4 color = texture2D( uSampler, vec2( vTexCoord.s, vTexCoord.t ) ) * vec4( vColor.rgb, 1.0 );
			if ( color.a < 0.1 ) discard;
			gl_FragColor = vec4( color.rgb, vColor.a );
		}
	`;

class PickBlock {
	constructor(gl) {
		this.gl = gl;
		this.shaders =
			new ShaderSet()
			.fetch( pickVertexSource, gl.VERTEX_SHADER )
			.fetch( pickFragmentSource, gl.FRAGMENT_SHADER )
			.link()
			.use();
		;

		let program = this.shaders.program;
		this.uProjMat	= gl.getUniformLocation( program, "uProjMatrix" );
		this.uViewMat	= gl.getUniformLocation( program, "uViewMatrix" );
		this.uModelMat	= gl.getUniformLocation( program, "uModelMatrix" );
		this.uSampler	= gl.getUniformLocation( program, "uSampler" );
		this.aPos		= gl.getAttribLocation( program, "aPos" );
		this.aColor		= gl.getAttribLocation( program, "aColor" );
		this.aTexCoord	= gl.getAttribLocation( program, "aTexCoord" );

		// Create 1px white texture for pure vertex color operations (e.g. picking)
		var whiteTexture = this.texWhite = gl.createTexture();
		gl.activeTexture( gl.TEXTURE0 );
		gl.bindTexture( gl.TEXTURE_2D, whiteTexture );
		var white = new Uint8Array( [ 255, 255, 255, 255 ] );
		gl.texImage2D( gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, white );
		gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST );
		gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST );
	}

	setup(viewMatrix,projMatrix,modelMatrix) {
		let gl = this.gl;
		this.shaders.use();
		gl.uniformMatrix4fv( this.uViewMat, false, viewMatrix );
		gl.uniformMatrix4fv( this.uProjMat, false, projMatrix );
		gl.uniformMatrix4fv( this.uModelMat, false, modelMatrix );
		gl.uniform1i(  this.uSampler, 0 );
	}

	drawBuffer( buffer )
	{
		let gl = this.gl;
		
		gl.bindBuffer( gl.ARRAY_BUFFER, buffer );

		// Define the format that our triangle components are stored in, that is:
		// 3 vec pos, 2 vec texCoord, 4 vec color
		// void gl.vertexAttribPointer(index, size, type, normalized, stride, offset);	
		gl.vertexAttribPointer( this.aPos, 3, gl.FLOAT, false, 9*4, 0 );
		gl.vertexAttribPointer( this.aColor, 4, gl.FLOAT, false, 9*4, 5*4 );
		gl.vertexAttribPointer( this.aTexCoord, 2, gl.FLOAT, false, 9*4, 3*4 );
		
		gl.drawArrays( gl.TRIANGLES, 0, buffer.vertices );
	}

	// pickAt( min, max, mx, myy )
	//
	// Returns the block at mouse position mx and my.
	// The blocks that can be reached lie between min and max.
	//
	// Each side is rendered with the X, Y and Z position of the
	// block in the RGB color values and the normal of the side is
	// stored in the color alpha value. In that way, all information
	// can be retrieved by simply reading the pixel the mouse is over.
	//
	// WARNING: This implies that the level can never be larger than
	// 254x254x254 blocks! (Value 255 is used for sky.)

	pickAt( world, min, max, mx, my )
	{
		let gl = this.gl;

		gl.useProgram( this.shaders.program );
		gl.enableVertexAttribArray( this.aPos );
		gl.enableVertexAttribArray( this.aColor );
		gl.enableVertexAttribArray( this.aTexCoord );
		
		// Create framebuffer for picking render
		var fbo = gl.createFramebuffer();
		gl.bindFramebuffer( gl.FRAMEBUFFER, fbo );
		
		var bt = gl.createTexture();
		gl.bindTexture( gl.TEXTURE_2D, bt );
		gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST );
		gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST );
		gl.texImage2D( gl.TEXTURE_2D, 0, gl.RGBA, 512, 512, 0, gl.RGBA, gl.UNSIGNED_BYTE, null );
		
		var renderbuffer = gl.createRenderbuffer();
		gl.bindRenderbuffer( gl.RENDERBUFFER, renderbuffer );
		gl.renderbufferStorage( gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, 512, 512 );
		
		gl.framebufferTexture2D( gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, bt, 0 );
		gl.framebufferRenderbuffer( gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, renderbuffer );
		
		// Build buffer with block pick candidates
		var vertices = [];
		
		for ( var x = min.x; x <= max.x; x++ ) {
			for ( var y = min.y; y <= max.y; y++ ) {
				for ( var z = min.z; z <= max.z; z++ ) {
					if ( world.getBlock( x, y, z ) != BLOCK.AIR )
						BLOCK.pushPickingVertices( vertices, x, y, z );
				}
			}
		}
		
		var buffer = gl.createBuffer();
		buffer.vertices = vertices.length / 9;
		gl.bindBuffer( gl.ARRAY_BUFFER, buffer );
		gl.bufferData( gl.ARRAY_BUFFER, new Float32Array( vertices ), gl.STREAM_DRAW );
		
		// Draw buffer
		gl.bindTexture( gl.TEXTURE_2D, this.texWhite );
		
		gl.viewport( 0, 0, 512, 512 );
		gl.clearColor( 1.0, 1.0, 1.0, 1.0 );
		gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT );
		gl.disable( gl.BLEND );

		this.drawBuffer( buffer );
		
		// Read pixel
		var pixel = new Uint8Array( 4 );
		gl.readPixels( mx/gl.viewportWidth*512, (1-my/gl.viewportHeight)*512, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, pixel );
		
		// Clean up
		gl.deleteBuffer( buffer );
		gl.deleteRenderbuffer( renderbuffer );
		gl.deleteTexture( bt );
		gl.deleteFramebuffer( fbo );

		gl.disableVertexAttribArray( this.aPos );
		gl.disableVertexAttribArray( this.aColor );
		gl.disableVertexAttribArray( this.aTexCoord );
		
		// Build result
		if ( pixel[0] != 255 )
		{
			var normal;
			if ( pixel[3] == 1 ) normal = new Vector( 0, 0, 1 );
			else if ( pixel[3] == 2 ) normal = new Vector( 0, 0, -1 );
			else if ( pixel[3] == 3 ) normal = new Vector( 0, -1, 0 );
			else if ( pixel[3] == 4 ) normal = new Vector( 0, 1, 0 );
			else if ( pixel[3] == 5 ) normal = new Vector( -1, 0, 0 );
			else if ( pixel[3] == 6 ) normal = new Vector( 1, 0, 0 );
			
			return {
				x: pixel[0],
				y: pixel[1],
				z: pixel[2],
				n: normal
			}
		} else {
			return false;
		}
	}
}

return {
	PickBlock: PickBlock
}

});