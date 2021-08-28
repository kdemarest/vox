Module.add('controls',function(){

class Controls {
	constructor(canvas,target) {
		console.assert(canvas);
		console.assert(target);
		this.target = target;
		this.canvas = canvas;
		this.pointerLockElement = null;
		this.keyDef = {};
		this.mouseDef = {};
		this.mouseScaleX = 0.2;
		this.mouseScaleY = 0.2;
	}
	get supportsPointerLock() {
		return 'pointerLockElement' in document || 'mozPointerLockElement' in document || 'webkitPointerLockElement' in document;
	}
	get isPointerLocked() {
		return document.pointerLockElement === this.pointerLockElement ||
			document.mozPointerLockElement === this.pointerLockElement ||
			document.webkitPointerLockElement === this.pointerLockElement;
	}
	pointerLockRequest(element=this.canvas) {
		this.pointerLockElement = element;
		element.requestPointerLock = element.requestPointerLock ||
			element.mozRequestPointerLock ||
			element.webkitRequestPointerLock;
		element.requestPointerLock();
	}
	pointerTrack(event) {
		let dx = event.movementX || event.mozMovementX || event.webkitMovementX || 0;
			let dy = event.movementY || event.mozMovementY || event.webkitMovementY || 0;
			return [dx*this.mouseScaleX,dy*this.mouseScaleX];
		}
		sendKey(key,value) {
		if( !this.keyLookup.includes(event.key) ) {
			return;
		}
		this.target.keyHash[key] = value;
		}
	addListener(element=this.canvas) {
		let onKeyDown = (event)=>{
			if( this.keyDef[event.key] ) {
				this.keyDef[event.key](this.target,1);
			}
		}
		let onKeyUp = (event)=>{
			if( this.keyDef[event.key] ) {
				this.keyDef[event.key](this.target,0);
			}
		}
		window.addEventListener('keydown',onKeyDown);
		window.addEventListener('keyup',onKeyUp);
		element.addEventListener('mousemove',(event)=>{
			if( !this.isPointerLocked ) {
				return;
			}
			let [dx,dy] = this.pointerTrack(event);
			if( this.mouseDef.move && (dx||dy) ) {
				this.mouseDef.move(this.target,dx,dy);
			}
		});
		element.addEventListener('click',(event)=>{
			if( !this.isPointerLocked ) {
				this.pointerLockRequest();
			}
			else 
			{
				this.mouseDef.click(this.target,event.which == 3);
			}
		});
		return this;
	}
}

return {
	Controls: Controls
}
});
