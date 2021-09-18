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
	pointerLock(element=this.canvas) {
		this.pointerLockElement = element;
		element.requestPointerLock = element.requestPointerLock ||
			element.mozRequestPointerLock ||
			element.webkitRequestPointerLock;
		element.requestPointerLock();
	}
	pointerUnlock(element=this.canvas) {
		document.exitPointerLock();
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
	suppressContextMenu() {
		window.addEventListener("contextmenu", (event) => {
			event.preventDefault();
			event.stopPropagation();
			return false;
		}, true);
	}
	addListener(element=this.canvas) {
		let onKeyDown = (event)=>{
			if( event.key == 'Control' ) return;
			let key = (event.ctrlKey ? 'Ctrl-' : '') + event.key;
			if( this.keyDef[key] ) {
				let preventDefault = this.keyDef[key](this.target,1,event);
				if( preventDefault !== false ) {
					event.preventDefault();
				}
			}
		}
		let onKeyUp = (event)=>{
			if( event.key == 'Control' ) return;
			let key = (event.ctrlKey ? 'Ctrl-' : '') + event.key;
			if( this.keyDef[key] ) {
				let preventDefault = this.keyDef[key](this.target,0,event);
				if( preventDefault !== false ) {
					event.preventDefault();
				}
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
			if( !document.hasFocus() && !this.isPointerLocked ) {
				this.pointerLock();
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
