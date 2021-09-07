Module.add('light',function() {

class Light {
};

(() => {
	let MaxLightValue = 15;
	let LightFullBrightDistance = 7;	// how many squares light casts.

	Light.Alpha = [];
	// This makes the assumption that a 
	for( let i=-MaxLightValue-20 ; i<MaxLightValue+20 ; ++i ) {
		Light.Alpha[i] = Math.clamp(i/LightFullBrightDistance,0.0,1.0);
	}
})();

Light.arcListGenerate = function() {

	function atanDeg(y,x) {
		return Math.floor( Math.atan2(y,x)/(2*Math.PI)*360 + 720 ) % 360;
	}

	let d = MaxVis;
	let arcList = [];
	arcList.push({x:0,y:0,dist:0,mid:0,span:360,left:0,right:359,nearDist:0});

	for( let y=-d ; y<=d ; ++y ) {
		for( let x=-d ; x<=d ; ++x ) {
			if( x==0 && y==0 ) continue;
			let q = 0.50;
			let dist = Distance.get(x,y);
			let nearDist = Math.min(Distance.get(x-q,y-q),Distance.get(x-q,y+q),Distance.get(x+q,y-q),Distance.get(x+q,y+q));
			let mid = atanDeg(y,x);
			let a = atanDeg(y-q,x-q);
			let b = atanDeg(y-q,x+q);
			let c = atanDeg(y+q,x-q);
			let d = atanDeg(y+q,x+q);
			let left = mid;
			let right = mid;
			let maxDegreesOccludableByAdjacentSquare = 120;
			for( let i=0 ; i<maxDegreesOccludableByAdjacentSquare ; ++i ) {
				let l0 = (360+mid-i)%360;
				let r0 = (360+mid+i)%360;
				if( l0 == a ) left = a;
				if( l0 == b ) left = b;
				if( l0 == c ) left = c;
				if( l0 == d ) left = d;
				if( r0 == a ) right = a;
				if( r0 == b ) right = b;
				if( r0 == c ) right = c;
				if( r0 == d ) right = d;
			}
			console.assert(left!==right);
			let span = 0;
			for( let i = left ; i!=right ; i = (i+1) % 360 ) {
				++span;
			}
			arcList.push({x:x,y:y,dist:dist,mid:mid,span:span,left:left,right:right,nearDist:nearDist});
		}
	}
	Array.shuffle(arcList,Random.True);	// This is so that the sort is less predictable for equal distances.
	arcList.sort( (a,b) => a.dist-b.dist );
	return arcList;
}
Light.arcList = Light.arcListGenerate();

Light.arcListTraverse = function( map, px, py, distLimit, onVisit ) {
	let arcList =  Light.arcList;
	console.assert( arcList && map && px!==undefined && py!==undefined && distLimit!==undefined && onVisit!==undefined );
	let done = false;
	arcList.every( arc => {
		let xRel = arc.x;
		let yRel = arc.y;
		if( xRel<-distLimit || yRel<-distLimit || xRel>distLimit || yRel>distLimit ) {
			return false;	// exits the every() statement
		}
		let x = px + xRel;
		let y = py + yRel;
		if( x<0 || x>=map.xLen || y<0 || y>=map.yLen ) {
			return true;
		}
		return onVisit( arc, x, y, xRel, yRel ) !== false;
	});
}


Light.RayCircle = function(maxDist) {
	let sweep = [];
	let opacity = [];
	for( let i=0 ; i<360 ; ++i ) {
		sweep[i] = maxDist;
		opacity[i] = 0;
	}

	function arcTest( left, right, nearDist, unitsRequired ) {
		// The block only needs to be 20% visible to be considered visible.
		for( let i = left ; i!=right ; i = (i+1) % 360 ) {
			// This angle of arc isn't blocked closer to the origin yet,
			// and the square we're passing through is not opaque
			if( sweep[i] >= nearDist || opacity[i] < 1 ) {
				--unitsRequired;
				if( unitsRequired<=0 ) {
					// We are visible enough (defined by v's initial value) so stop checking
					break;
				}
			}
		}
		if( unitsRequired > 0 ) {
			// This square is not visible.
			return false;
		}
		return true;
	}

	function arcSet( left, right, dist, opacityHere ) {
		let i = left;
		while( i!=right ) {
			sweep[i] = Math.min(sweep[i],dist);
			opacity[i] += opacityHere;
			i = (i+1) % 360;
		}
	}
	return {
		arcTest: arcTest,
		arcSet: arcSet
	}
}


Light.Caster = class {
	constructor() {
		this.lightMap = [];
	}
	cast(map,opacityLookup,x,y,light) {

		x = Math.toTile(x);
		y = Math.toTile(y);

		console.assert( map && opacityLookup );
		let maxReach = Math.abs(light);
		let xLen = map.xLen;
		let rayCircle = new Light.RayCircle( maxReach*maxReach );
		let atCenter = true;
		let ratio = 1 / Math.min(MaxVis+1,light+1);	// Helps the light 'fall off' at its max reach.

		Light.arcListTraverse( map, x, y, maxReach, (arc, x, y, xRel, yRel) => {
			let lightReaches = atCenter || rayCircle.arcTest( arc.left, arc.right, arc.nearDist, arc.span*0.05 );
			if( !lightReaches ) return;

			let pos = y*xLen+x;
			console.assert(Math.floor(pos)==pos);
			
			let value = this.lightMap[pos] || 0;
			if( light < 0 ) {
				// Darkness
				value = Math.max( light, value + Math.min(0,light+arc.dist+0.3) );
			}
			else {
				// Brightness
				value = Math.max( value, light * (1-(arc.dist*ratio)) );
				//value = Math.max( value, light+1-arc.dist+0.5 );
			}
			this.lightMap[pos] = value;

			let opacityHere = opacityLookup[pos];
			if( opacityHere>0 && !atCenter ) {
				rayCircle.arcSet( arc.left, arc.right, arc.dist, opacityHere );
			}
			atCenter = false;
		});
	}

	gather(lightList,darkList,entityList) {
		entityList.forEach( entity => {
			if( entity.light > 0 ) lightList.push(entity);
			if( entity.dark  > 0 ) darkList.push(entity);
		});
	}

	castAll(map,opacityLookup,entityList,itemList,animList) {
		console.assert( map && opacityLookup && entityList && itemList && animList );
		this.lightMap = [];
		let lightList = [];
		let darkList = [];
		this.gather( lightList, darkList, entityList );
		this.gather( lightList, darkList, itemList );
		this.gather( lightList, darkList, animList );

		map.traverse( (x,y,tile) => tile.light > 0 ? this.cast( map, opacityLookup, x, y, tile.light ) : null );
		lightList.forEach( e => this.cast( map, opacityLookup, e.x, e.y, e.light ) );

		map.traverse( (x,y,tile) => tile.dark > 0 ? this.cast( map, opacityLookup, x, y, -tile.dark ) : null );
		darkList.forEach( e => this.cast( map, opacityLookup, e.x, e.y, -e.dark ) );
		return this.lightMap;
	}
}


function brainlessLight(world) {
	let blocks = world.blocks;
	let lightMap = world.lightMap;

	function cast(cx,cy,cz,light) {
		let mag = light.mag;
		let r = light.r;
		let g = light.g;
		let b = light.b;

		for( let x=-mag ; x<=mag ; ++x ) {
			if( cx+x<0 || cx+x>=world.sx ) {
				continue;
			}
			for( let y=-mag ; y<=mag ; ++y ) {
				if( cy+y<0 || cy+y>=world.sy ) {
					continue;
				}
				for( let z=-mag ; z<=mag ; ++z ) {
					if( cz+z<0 || cz+z>=world.sz ) {
						continue;
					}
					let mx = 1+mag-Math.abs(x);
					let my = 1+mag-Math.abs(y);
					let mz = 1+mag-Math.abs(z);
					
					let m = Math.min(mx, my, mz);
					let a = lightMap[cx+x][cy+y][cz+z];
					a[0] = Math.floor( Math.max( a[0], m*r ) );
					a[1] = Math.floor( Math.max( a[1], m*g ) );
					a[2] = Math.floor( Math.max( a[2], m*b ) );
				}
			}
		}
	}

	for( let x=0 ; x<world.sx ; ++x ) {
		for( let y=0 ; y<world.sy ; ++y ) {
			for( let z=0 ; z<world.sz ; ++z ) {
				let a = lightMap[x][y][z];
				a[0] = 0.0;
				a[1] = 0.0;
				a[2] = 0.0;
			}
		}
	}

	for( let x=0 ; x<world.sx ; ++x ) {
		for( let y=0 ; y<world.sy ; ++y ) {
			for( let z=0 ; z<world.sz ; ++z ) {
				if( blocks[x][y][z].light ) {
					cast( x, y, z, blocks[x][y][z].light );
				}
			}
		}
	}
}

return {
	Light: Light,
	brainlessLight: brainlessLight
}

});