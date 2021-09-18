Module.add('textureWriter',function(){

webglUtils.imageToTexture = function(gl,image) {
  if( !image.isLoaded ) {
    debugger;
  }

	// Create a texture.
	let texture = gl.createTexture();
  texture.image = image;
  texture.width = image.width;
  texture.height = image.height;

	gl.bindTexture(gl.TEXTURE_2D, texture);

	gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);

	// set the filtering so we don't need mips and it's not filtered
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

	return texture;
}

// Send in 0.0 -> 1.0 and it will convert it to freaky openGl coordinates.
webglUtils.framebufferQuad = function(x0,y0,x1,y1) {
	x0 = x0 * 2 - 1;
	y0 = y0 * 2 - 1;
	x1 = x1 * 2 - 1;
	y1 = y1 * 2 - 1;
	return [
		x0, y0, 0,
		x1, y0, 0,
		x0, y1, 0,
		x0, y1, 0,
		x1, y0, 0,
		x1, y1, 0
	];
}

// At least texture quads seem to be normal. I think. 0->1
webglUtils.texQuad = function(x0,y0,x1,y1) {
	return [
		x0, y0,
		x0, y1,
		x1, y0,
		x1, y0,
		x0, y1,
		x1, y1,
	];
}

class TextureWriter {
	constructor() {
		this.vs2d = `
			attribute vec4 a_position;
			attribute vec2 a_texcoord;
			varying vec2 v_texcoord;

			void main() {
				gl_Position = a_position;
				v_texcoord = vec2(a_texcoord.y,a_texcoord.x);
        //v_texcoord = vec2(Mathf.floor(a_texcoord.y),Mathf.floor(a_texcoord.x));
			}
		`;
		this.fs2d = `
			precision mediump float;
			varying vec2 v_texcoord;
			uniform sampler2D u_texture;

			void main() {
				gl_FragColor = texture2D(u_texture, v_texcoord);
			}
		`;

    this.program = null;
    this.a_position = null;
    this.a_texcoord = null;
    this.u_texture = null;
    this.positionBuffer = null;
    this.texcoordBuffer = null;
    this.width = null;
    this.height = null;
    this.texture = null;

	}
	initProgram(gl) {
		// setup GLSL program
		this.program = webglUtils.createProgramFromSources(gl, [this.vs2d, this.fs2d]);

		this.a_position = gl.getAttribLocation(this.program, "a_position");
		this.a_texcoord = gl.getAttribLocation(this.program, "a_texcoord");
		this.u_texture = gl.getUniformLocation(this.program, "u_texture");
	}
	positionBufferCreate(gl) {
		// Create a buffer for positions
		this.positionBuffer = gl.createBuffer();
	}
	positionBufferPopulate(gl,x0,y0,x1,y1) {
		// Put the positions in the buffer
		gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer);
		gl.bufferData(
			gl.ARRAY_BUFFER,
			new Float32Array( webglUtils.framebufferQuad( x0, y0, x1, y1 ) ),
			gl.STATIC_DRAW
		);
	}
	texcoordBufferCreate(gl){
		// provide texture coordinates for the rectangle.
		this.texcoordBuffer = gl.createBuffer();
	}
	texcoordBufferPopulate(gl) {
		// Set Texcoords.
		gl.bindBuffer(gl.ARRAY_BUFFER, this.texcoordBuffer);
		gl.bufferData(
			gl.ARRAY_BUFFER,
			new Float32Array( webglUtils.texQuad(0,0,1,1) ),
			gl.STATIC_DRAW
		);
	}
	init(gl){
    console.assert( gl );
		this.initProgram(gl);
		this.positionBufferCreate(gl);
		this.texcoordBufferCreate(gl);
		this.texcoordBufferPopulate(gl);
	}
	create(gl,width,height) {
    console.assert( gl && width && height );
		// Create a texture to render to
		this.width = width;
		this.height = height;
		this.texture = gl.createTexture();
		gl.bindTexture(gl.TEXTURE_2D, this.texture);

		{
			// define size and format of level 0
			const data = null;
			gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA,
										this.width, this.height, 0,
										gl.RGBA, gl.UNSIGNED_BYTE, data);

			// set the filtering so we don't need mips
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
		}

		// Create and bind the framebuffer
		this.fb = gl.createFramebuffer();
		gl.bindFramebuffer(gl.FRAMEBUFFER, this.fb);

		// attach the texture as the first color attachment
		gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.texture, 0);
	}
	becomeRenderTarget(gl) {
			// render to our targetTexture by binding the framebuffer
			gl.bindFramebuffer(gl.FRAMEBUFFER, this.fb);

			// Tell WebGL how to convert from clip space to pixels
			gl.viewport(0, 0, this.width, this.height);

			// Clear the attachment(s).
//			gl.clearColor(0, 0, 1, 1);	 // clear to blue
//			gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
	}
	draw(gl, txData, x, y, txWidth, txHeight) {
    console.assert( gl && txData && txWidth && txHeight );
    console.assert( this.positionBuffer );
    console.assert( this.texcoordBuffer );
    console.assert( this.texture && this.width && this.height );
    console.assert( this.program );
    console.assert( this.fb );

		gl.enable(gl.CULL_FACE);
		gl.enable(gl.DEPTH_TEST);

		this.becomeRenderTarget(gl);

		// render using the incoming texture as the source
		gl.bindTexture(gl.TEXTURE_2D, txData);
		const aspect = this.width / this.height;

		let px = x / this.width;
		let py = y / this.height;
		this.positionBufferPopulate(gl,px,py,px+txWidth/this.width,py+txHeight/this.height);
		//console.log('write pos buf ', this.positionBuffer );

		// Tell it to use our program (pair of shaders)
		gl.useProgram(this.program);
    gl.enableVertexAttribArray(this.a_position);
    gl.enableVertexAttribArray(this.a_texcoord);

		{ // ATTRIBUTE A_POSITION
			// Bind the position buffer.
			gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer);
			// Tell the position attribute how to get data out of positionBuffer (ARRAY_BUFFER)
			gl.vertexAttribPointer( this.a_position, 3, gl.FLOAT, false, 0, 0 );
		}

		{ // ATTRIBUTE A_TEXCOORD
			// bind the texcoord buffer.
			gl.bindBuffer(gl.ARRAY_BUFFER, this.texcoordBuffer);
			// Tell the texcoord attribute how to get data out of texcoordBuffer (ARRAY_BUFFER)
			gl.vertexAttribPointer( this.a_texcoord, 2, gl.FLOAT, false, 0, 0);
		}

		// Tell the shader to use texture unit 0 for u_texture
		gl.uniform1i(this.u_texture, 0);

		// Draw the geometry.
		gl.drawArrays(gl.TRIANGLES, 0, 6 * 1);

    gl.disableVertexAttribArray(this.a_position);
    gl.disableVertexAttribArray(this.a_texcoord);
	}
}

return {
	TextureWriter: TextureWriter
}

});
