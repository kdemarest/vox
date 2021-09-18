Module.add('textureRepo',function() {

let HourglassURI = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAM0lEQVQ4T2NkoBAwUqifYdQABhqHQVHGz/+gWOqbwY4zsPHGAsUGEJNGRtMBrdMBMbEAAGSoCBGxzugoAAAAAElFTkSuQmCC";

let imgSTANDBY		= 1;
let imgREQUESTED	= 2;
let imgPENDING		= 3;
let imgPROCESSING	= 4;
let imgREADY		= 5;

function DefaultImgChooseFn(self) {
	return self.img;
}

class TextureRepo {
	constructor(notifierFn) {
		this.resources			= {};
		this.imgList			= {};
		this.imgStateList		= {};
		this.notifierFn			= notifierFn;
		this.placeholderResource = {
			isPlaceholder: true,
			texture: false
		}

		let placeholderImage = new Image();
		placeholderImage.onload = ()=>{
			placeholderImage.isLoaded = true;
			this.placeholderResource.texture = webglUtils.imageToTexture(window.openGl.gl,placeholderImage);
			this.notifierFn( 'imgReady', null, this.placeholderResource );
		}
		placeholderImage.src = HourglassURI;
	}

	isValidImg(img) {
		return typeof img === 'string' || typeof img.src === 'string';
	}

	async postProcess( imgStem, jimpImage, img ) {
		let nativeImageData = await jimpImage.getBase64Async( Jimp.AUTO );

		let imgPath = window.IMG_BASE+imgStem;
		let nativeImage = new Image(jimpImage.bitmap.width, jimpImage.bitmap.height);
		nativeImage.onload = async () => {
			nativeImage.isLoaded = true;
			this.resources[imgStem] = {
				texture: webglUtils.imageToTexture(window.openGl.gl,nativeImage)
			};

			//console.log('img ready',imgStem);

			this.imgStateList[imgPath] = imgREADY;
			this.notifierFn( 'imgReady', imgStem, this.resources[imgStem] );
		}
		nativeImage.src = nativeImageData;
	}

	request(imgPath) {
		console.assert( this.imgStateList[imgPath] === imgSTANDBY );
		this.imgStateList[imgPath] = imgREQUESTED;
	}

	getStateList(stateList) {
		Object.each( this.imgStateList, (state,imgPath) => {
			if( state == imgREQUESTED ) {
				stateList.requested.push(imgPath);
			}
			if( state == imgPENDING ) {
				stateList.pending.push(imgPath);
			}
			if( state == imgREADY ) {
				stateList.ready.push(imgPath);
			}
		});
		return stateList;
	}

	requestAll() {
		Object.each( this.imgStateList, (state,imgPath) => {
			this.request( imgPath );
		});
	}

	getResourceByImg(imgStem) {
		console.assert( typeof imgStem === 'string' );
		let imgPath = window.IMG_BASE+imgStem;
		let state = this.imgStateList[imgPath];
		if( state === undefined ) {
			// Not a detected img!
			//debugger;
			this.imgStateList[imgPath] = imgSTANDBY;
		}
		if( state == imgREADY ) {
			return this.resources[imgStem];
		}
		if( state == imgSTANDBY ) {
			this.request(imgPath);
		}
		return this.placeholderResource;
	}
	getResource(entity) {
		return this.getResourceByImg( this.getImg(entity) );
	}

	getImgFullPath(entity) {
		let imgStem = this.getImg(entity);
		return window.IMG_BASE + (typeof imgStem === 'string' ? imgStem : imgStem.src);
	}

	tick() {
		Object.each( this.imgStateList, (state,imgPath) => {
			if( state == imgREQUESTED ) {
				this.imgStateList[imgPath] = imgPENDING;
				let imgStem = imgPath.substring( window.IMG_BASE.length )
				Jimp.read( imgPath ).then( buffer => {
					this.imgStateList[imgPath] = imgPROCESSING;
					this.postProcess( imgStem, buffer, this.imgList[imgStem] );
				});
			}
		});
	}
}

return {
	TextureRepo: TextureRepo
}

});
