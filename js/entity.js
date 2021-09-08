Module.add( 'entity', function() {

	class Entity {
		constructor() {
			this.body = new Body(this);
		}
	}


	return {
		Entity: Entity
	}
});
