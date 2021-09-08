Module.add('viewMaterial',function(){

let ViewMaterial = class {
	constructor(owner) {
		this.owner = owner;
		this.buildMaterial = BLOCK.DIRT;
		this.style = { opacity: false };
		this.prevSelector = null;
	}

	setMaterialSelector( id )
	{
		var tableRow = document.getElementById( id ).getElementsByTagName( "tr" )[0];
		var texOffset = 0;

		for ( var mat in BLOCK )
		{
			if ( typeof( BLOCK[mat] ) == "object" && BLOCK[mat]!==null && BLOCK[mat].spawnable == true )
			{
				console.log(mat);
				var selector = document.createElement( "td" );
				selector.style.backgroundPosition = texOffset + "px 0px";

				var pl = this;
				selector.material = BLOCK[mat];
				selector.onclick = function()
				{
					this.style.opacity = "1.0";

					pl.prevSelector.style.opacity = null;
					pl.prevSelector = this;

					pl.buildMaterial = this.material;
				}

				if ( mat == "DIRT" ) {
					this.prevSelector = selector;
					selector.style.opacity = "1.0";
				}

				tableRow.appendChild( selector );
				texOffset -= 70;
			}
		}
	}

};

return {
	ViewMaterial: ViewMaterial
}

});
