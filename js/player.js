Module.add('player',function(){

let Player = class {
	constructor() {
		this.body = new Body(this);
		this.viewMaterial = new ViewMaterial(this);
	}
}

return {
	Player: Player
}
});
