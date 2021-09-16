Module.add('utilTextMapParser',function(extern) {

class TextMapParser {
	constructor(textMap,stride=1) {
		this.textMap = textMap.replace(/\t/g,'');
		this.stride  = stride;
	}
	convert(char0,char1) {
		let regExp = new RegExp(char0, 'g');
		this.textMap = this.textMap.replace(regExp,char1);
		return this;
	}
	get _vertArray() {
		let yArray = this.textMap.split('\n');
		while( yArray.length > 0 && yArray[0].trim().length <= 0 ) {
			yArray.shift();
		}
		while( yArray.length > 0 && yArray[yArray.length-1].trim().length <= 0 ) {
			yArray.pop();
		}
		return yArray;
	}
	get dimensions() {
		let yArray = this._vertArray;
		let xLen=0;
		yArray.forEach( line => { xLen = Math.max( xLen, Math.floor((line.length+this.stride-1) / this.stride)); });
		return [xLen,yArray.length];
	}
	parse(tileFn) {
		let [xLen,yLen]	= this.dimensions;
		let yArray		= this._vertArray;
		for( let y=0 ; y<yLen ; ++y ) {
			for( let x=0 ; x<xLen ; ++x ) {
				for( let t=0 ; t<this.stride ; ++t ) {
					tileFn( x, y, t, yArray[y].charAt(x*this.stride+t) );
				}
			}
		}
	}
}

return {
	TextMapParser: TextMapParser
}

});
