Module.add('viewMaterial',function(){

let ViewMaterial = class {
	constructor(owner) {
		this.owner = owner;
		this.buildMaterial = BlockType.DIRT;
		this.style = { opacity: false };
		this.prevSelector = null;
	}

	setMaterialSelector( id ) {
		var tableRow = document.getElementById( id ).getElementsByTagName( "tr" )[0];
		var texOffset = 0;

		BlockType.traverse( (block,blockId) => {
			if( !block.spawnable ) {
				return;
			}

			var selector = document.createElement( "td" );
			selector.style.backgroundPosition = texOffset + "px 0px";

			var pl = this;
			selector.material = block;
			selector.onclick = function()
			{
				this.style.opacity = "1.0";

				pl.prevSelector.style.opacity = null;
				pl.prevSelector = this;

				pl.buildMaterial = this.material;
			}

			if ( blockId == "DIRT" ) {
				this.prevSelector = selector;
				selector.style.opacity = "1.0";
			}

			tableRow.appendChild( selector );
			texOffset -= 70;
		});
	}

};

return {
	ViewMaterial: ViewMaterial
}

});
