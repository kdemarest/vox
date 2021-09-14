Module.add('body',function(){

	let FallRate = {
		inAir: -0.5,
		inFluid: -0.05
	}

	class Body {
		constructor(owner) {
			this.owner = owner;
		}
		// setWorld( world )
		//
		// Assign the local player to a world.

		setWorld( world )
		{
			this.world = world;
			this.pos = world.spawnPoint;
			this.velocity = new Vector( 0, 0, 0 );
			this.angles = [ 0, Math.PI, 0 ];
			this.falling = false;
			this.inFluid = false;
			this.crawl = false;
			this.crouch = false;
			this.sprite = false;
			this.forward = 0;
			this.sideways = 0;
			this.up = 0;
			this.yaw = 0;
			this.yawRate = Math.PI/100.0;
			this.pitch = 0;
			this.pitchRate = Math.PI/100.0;
			this.pitchMin = -Math.PI/2;
			this.pitchMax = Math.PI/2;
		}

		addYaw(value) {
			this.yaw += value*this.yawRate;
		}

		addPitch(value) {
			this.pitch = Math.clamp( this.pitch+value*this.pitchRate, this.pitchMin, this.pitchMax );
		}

		doBlockAction( x, y, destroy, pickAtFn )
		{
			var bPos = new Vector( Math.floor( this.pos.x ), Math.floor( this.pos.y ), Math.floor( this.pos.z ) );
			var block = pickAtFn( new Vector( bPos.x - 4, bPos.y - 4, bPos.z - 4 ), new Vector( bPos.x + 4, bPos.y + 4, bPos.z + 4 ), x, y );
			
			if ( block != false )
			{
				var obj = this.world;
				
				if ( destroy )
					obj.setBlock( block.x, block.y, block.z, BLOCK.AIR );
				else
					obj.setBlock( block.x + block.n.x, block.y + block.n.y, block.z + block.n.z, this.owner.viewMaterial.buildMaterial );
			}
		}

		getEyeHeight(forceStand) {
			return forceStand ? 1.7 : this.crawl ? 0.8 : this.crouch ? 1.3 : 1.7;
		}

		getHeadHeight(forceStand) {
			return this.getEyeHeight(forceStand)+0.1;
		}

		getEyePos()
		{
			return this.pos.add( new Vector( 0.0, 0.0, this.getEyeHeight() ) );
		}

		update()
		{
			var world = this.world;
			var velocity = this.velocity;
			var pos = this.pos;

			if ( this.lastUpdate != null )
			{
				var delta = ( new Date().getTime() - this.lastUpdate ) / 1000;

				// View
				this.angles[0] = this.pitch;
				this.angles[1] = this.yaw;


				if( this.inFluid ) {
					if( this.jump ) {
						if( this.atSurface ) {
							velocity.z = 1;
						}
						else {
							velocity.z = 0.4;
						}
						this.jump = false;
					}
					else
					if( this.falling ) {
						if( this.atSurface ) {
							velocity.z += FallRate.inAir;	
							let maxFallAtSurface = -4.0;
							velocity.z = Math.max( velocity.z, maxFallAtSurface );
						}
						else {
							velocity.z += FallRate.inFluid;
							let maxFallInFluid = -0.3;
							velocity.z = Math.max( velocity.z, maxFallInFluid );
						}
					}
				}
				else {

					// Gravity
					if( this.falling ) {
						velocity.z += FallRate.inAir;
					}

					// Jumping
					if ( this.jump && !this.falling )
					{
						velocity.z = 8;
					}
					this.jump = false;
				}

				// Walking
				if ( !this.falling || this.inFluid )
				{
					try {
					var impulse = {x:0,y:0,z:0};

					let maxSpeed = (this.inFluid || this.crouch || this.crawl) ? 1.3 : this.sprint ? 6 : 4.3;
					let fScale = maxSpeed;
					let sScale = maxSpeed;
					impulse.x += Math.cos( Math.PI / 2 - this.angles[1] ) * this.forward * fScale;
					impulse.y += Math.sin( Math.PI / 2 - this.angles[1] ) * this.forward * fScale;
					impulse.x += Math.cos( Math.PI / 2 + Math.PI / 2 - this.angles[1] ) * this.sideways * sScale;
					impulse.y += Math.sin( Math.PI / 2 + Math.PI / 2 - this.angles[1] ) * this.sideways * sScale;

					velocity.x = velocity.x * 0.0 + impulse.x;
					velocity.y = velocity.y * 0.0 + impulse.y;
					let horizontalSpeed = Math.sqrt(velocity.x*velocity.x+velocity.y*velocity.y);
					let horizontalCap = Math.min(maxSpeed,horizontalSpeed);
					if( horizontalSpeed != 0 ) {
						velocity.x = velocity.x / horizontalSpeed * horizontalCap;
						velocity.y = velocity.y / horizontalSpeed * horizontalCap;
					}

					if( this.up ) {
						impulse.z += this.up;
						velocity.z = velocity.z * 0.0 + impulse.z;
					}

					} catch(e) {
						debugger;
					}
				}

				// Resolve collision
				if( this.collide !== false ) {
					this.pos = this.resolveCollision( pos, velocity.mul( delta ) );
				}
				else {
					this.pos = pos.add(velocity.mul( delta ));
				}
			}

			this.lastUpdate = new Date().getTime();
		}

		mayExitCrawl() {
			console.assert( this.crawl );

			let result = this.detectCollision( this.pos, this.velocity, true );

			if( result.bonkHead || result.xCollide || result.yCollide ) {
				return false;
			}
			return true;
		}

		detectCollision( _pos, _velocity, forceStand )
		{

 			function sideCollide(block) {
 				return !block.isAir && !block.fluid;
 			}

			let result = {};

			// Collect XY collision sides
			let world = this.world;
			let pos = new Vector( _pos.x, _pos.y, _pos.z );
			var bPos = new Vector( Math.floor( pos.x ), Math.floor( pos.y ), Math.floor( pos.z ) );
			let velocity = new Vector( _velocity.x, _velocity.y, _velocity.z );

			var playerRect = { x: pos.x + velocity.x, y: pos.y + velocity.y, size: 0.25 };
			let xyCandidate = [];

			let zHeight = forceStand || !this.crawl ? 1 : 0;
			for ( var x = bPos.x - 1; x <= bPos.x + 1; x++ )
			{
				for ( var y = bPos.y - 1; y <= bPos.y + 1; y++ )
				{
					for ( var z = bPos.z; z <= bPos.z + zHeight; z++ )
					{
						if ( sideCollide(world.getBlock( x, y, z )) )
						{
							if ( !sideCollide(world.getBlock( x - 1, y, z )) ) xyCandidate.push( { x: x, dir: -1, y1: y, y2: y + 1 } );
							if ( !sideCollide(world.getBlock( x + 1, y, z )) ) xyCandidate.push( { x: x + 1, dir: 1, y1: y, y2: y + 1 } );
							if ( !sideCollide(world.getBlock( x, y - 1, z )) ) xyCandidate.push( { y: y, dir: -1, x1: x, x2: x + 1 } );
							if ( !sideCollide(world.getBlock( x, y + 1, z )) ) xyCandidate.push( { y: y + 1, dir: 1, x1: x, x2: x + 1 } );
						}
					}
				}
			}

			// Solve XY collisions
			for( var i in xyCandidate ) 
			{
				var side = xyCandidate[i];

				if ( lineRectCollide( side, playerRect ) )
				{
					if ( side.x != null && velocity.x * side.dir < 0 ) {
						pos.x = side.x + playerRect.size / 2 * ( velocity.x > 0 ? -1 : 1 );
						velocity.x = 0;
						result.xCollide = true;
					} else if ( side.y != null && velocity.y * side.dir < 0 ) {
						pos.y = side.y + playerRect.size / 2 * ( velocity.y > 0 ? -1 : 1 );
						velocity.y = 0;
						result.yCollide = true;
					}
				}
			}

			var playerFace = {
				x1: pos.x + velocity.x - 0.125,
				y1: pos.y + velocity.y - 0.125,
				x2: pos.x + velocity.x + 0.125,
				y2: pos.y + velocity.y + 0.125
			};
			var newBZLower = Math.floor( pos.z + velocity.z );
			var newBZUpper = Math.floor( pos.z + this.getHeadHeight(forceStand) + velocity.z * 1.1 );

			// Collect Z collision sides
			let zCandidate = [];

			for ( var x = bPos.x - 1; x <= bPos.x + 1; x++ ) 
			{
				for ( var y = bPos.y - 1; y <= bPos.y + 1; y++ )
				{
					let b0 = world.getBlock( x, y, newBZLower );
					if ( b0.collide !== false && !b0.fluid )
						zCandidate.push( { z: newBZLower + 1, dir: 1, x1: x, y1: y, x2: x + 1, y2: y + 1, fluid: false/*b0.fluid*/ } );
					
					let b1 = world.getBlock( x, y, newBZUpper )
					if ( b1.collide !== false && !b1.fluid )
						zCandidate.push( { z: newBZUpper, dir: -1, x1: x, y1: y, x2: x + 1, y2: y + 1, fluid: false /*b1.fluid*/ } );
				}
			}

			if( forceStand && this.crawl && zCandidate.length > 0 ) {
		//		debugger;
			}

			// Solve Z collisions
			if( forceStand ) {
				velocity.z = 0.01;
			}

			if( world.getBlock(bPos.x,bPos.y,bPos.z).fluid ) {
				result.inFluid = true;
			}

			let eyeZ = pos.z + this.getEyeHeight(forceStand);
			if( world.getBlock(bPos.x,bPos.y,Math.floor(eyeZ)).isAir ) {
				result.atSurface = true;
			}

			let foundCollision = false;
			for ( var i in zCandidate )
			{
				var face = zCandidate[i];

				if ( rectRectCollide( face, playerFace ) && velocity.z * face.dir < 0 )
				{
					if( face.fluid ) {
						result.inFluid = true;
						continue;
					}
					if( !foundCollision ) {
						if ( velocity.z < 0 ) {
							pos.z = face.z;
							velocity.z = 0;
							result.landed = true;
						} else {
							pos.z = face.z - (this.getHeadHeight());
							velocity.z = 0;
							result.bonkHead = true;
						}
						foundCollision = true;
					}
				}
			}
			result.pos = pos;
			result.velocity = velocity;

			// Return solution
			return result;
		}

		resolveCollision( pos, velocity )
		{
			let vz = velocity.z;
			// Collect XY collision sides
			if( velocity.z == 0 ) {
				velocity.z = -0.001;
			}
			let result = this.detectCollision(pos,velocity);

			//console.log('landed: '+result.landed+' inFluid: '+result.inFluid+' vz='+vz );

			this.inFluid   = result.inFluid;
			this.atSurface = result.atSurface;
			if( result.landed ) {
				this.falling = false;
				this.velocity.z = 0;
			}
			else {
				this.falling = true;
			}
			if( result.bonkHead ) {
				this.velocity.z = 0;
			}

			// Return solution
			return result.pos.add( result.velocity );
		}
	}

	return {
		Body: Body
	}

});



