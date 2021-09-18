Module.add( 'playerControls', ()=> {

	class PlayerControls extends Controls {
		constructor(canvas,player) {
			super(canvas,player);

			this.suppressContextMenu();
			this.addListener();
			this.pointerLock();

			this.keyDef['Tab'] = (target,value) => {
				if( !value ) return;
				if( this.isPointerLocked ) {
					this.pointerUnlock();
				}
				else {
					this.pointerLock();
				}
			}
			this.keyDef['g'] = this.keyDef['G'] =	(target,value) => { if( value ) target.collide = !target.collide; }
			this.keyDef['r'] = this.keyDef['R'] =	(target,value) => { target.up = value; }
			this.keyDef['f'] = this.keyDef['F'] =	(target,value) => { target.up = -value; }

			this.keyDef['w'] = this.keyDef['W'] =	(target,value) => { target.forward = value; }
			this.keyDef['s'] = this.keyDef['S'] =	(target,value) => { target.forward = -value; }
			this.keyDef['a'] = this.keyDef['A'] =	(target,value) => { target.sideways = value; }
			this.keyDef['d'] = this.keyDef['D'] =	(target,value) => { target.sideways = -value; }
			this.keyDef['c'] = this.keyDef['C'] =	(target,value) => {
				if( value ) {
					if( target.crawl && !target.mayExitCrawl() ) {
						return;
					}

					if( target.crouch ) { target.crawl = true; target.crouch = false; }
					else { target.crawl = false; target.crouch = true; }
				}
			}
			this.keyDef[' '] = (target,value) => {
				//console.log('space pressed='+value);
				if( value ) {
					if( target.crawl && !target.mayExitCrawl() ) {
						return;
					}

					target.crouch = false;
					target.crawl = false;
					target.jump = true;
				}
			}
			this.keyDef['Shift'] = (target,value) => {
				if( !target.sprint && target.crouch ) {
					target.crouch = false;
				}
				if( !target.sprint && target.crawl ) {
					if( !target.mayExitCrawl() ) {
						return;
					}
					target.crawl = false;
				}
				target.sprint = target.crouch || target.crawl ? false : !!value;
			}

			this.keyDef['Ctrl-r'] = (target,value,event) => {
				return false;
			}

			this.mouseDef.move = (target,dx,dy) => {
				target.addYaw(dx);
				target.addPitch(-dy);
			}
			this.mouseDef.click = (target,rmb) => {
				target.doBlockAction(
					canvas.width/2,
					canvas.height/2,
					!rmb,
					(...args) => {
						let r = canvas.renderer;
						r.pickBlock.setup( r.viewMatrix, r.projMatrix, r.modelMatrix );
						return r.pickBlock.pickAt(r.world, ...args);
					}
				);
			}
		}
	}

	return {
		PlayerControls: PlayerControls
	}

});
