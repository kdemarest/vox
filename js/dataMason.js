Module.add('dataMason',function(extern) {

	let Rand = Random.Pseudo;

	let MAX_CLOSEST_SEARCH = 30;

	const Dir = { N: 0, NE: 1, E: 2, SE: 3, S: 4, SW: 5, W: 6, NW: 7 };
	const DirAdd = [
		{ x:0,  y:-1 },
		{ x:1,  y:-1 },
		{ x:1,  y:0 },
		{ x:1,  y:1 },
		{ x:0,  y:1 },
		{ x:-1, y:1 },
		{ x:-1, y:0 },
		{ x:-1, y:-1 }
	];

	let ZoneChar = ' 0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
	let NO_ZONE = -1;

	let TileType = {
		Unknown: Tile.UNKNOWN,
		Floor: Tile.FLOOR,
		Wall: Tile.WALL,
		Door: '+'
	};
	let T = TileType;

	function directionPredictable(dx,dy) {
		if( dy < 0 ) return dx==0 ? Dir.N : (dx<0 ? Dir.NW : Dir.NE);
		if( dy > 0 ) return dx==0 ? Dir.S : (dx<0 ? Dir.SW : Dir.SE);
		return dx==0 ? false : (dx<0 ? Dir.W : Dir.E);
	} 
	function directionNaturalOrtho(dx,dy) {
		let ax = Math.abs(dx);
		let ay = Math.abs(dy);
		if( Rand.floatRange(0,ax+ay) < ay ) { dx=0; } else { dy=0; }
		return directionPredictable(dx,dy);
	}
	function deltasToDirFarthestOrtho(dx,dy,alwaysReturnDirection) {
		let ax = Math.abs(dx);
		let ay = Math.abs(dy);
		if( ax > ay ) {
			return dx < 0 ? Dir.W : Dir.E;
		}
		if( ay > ax || alwaysReturnDirection ) {
			return dy < 0 ? Dir.N : Dir.S;
		}
		return false;
	}
	function isUnknown(tile) {
		return tile == T.Unknown;
	}
	function isFloor(tile) {
		return tile !== T.Unknown && SymbolToType[tile].isFloor;
	}
	function isWall(tile) {
		return tile !== T.Unknown && SymbolToType[tile].isWall;
	}
	function isDoor(tile) {
		return tile !== T.Unknown && SymbolToType[tile].isDoor;
	}
	function isBridge(tile) {
		return tile !== T.Unknown && SymbolToType[tile].isBridge;
	}
	function isBlocking(tile) {
		let type = SymbolToType[tile];
		return tile !== T.Unknown && !(type.mayWalk || (type.isItemType && type.isRemovable!==false)  || type.isDoor || type.isMonsterType);
	}
	function isWalkable(tile) {
		let type = SymbolToType[tile];
		return tile !== T.Unknown && (type.mayWalk || (type.isItemType && type.isRemovable!==false)  || type.isDoor || type.isMonsterType);
	}
	function isBlockingOrUnknown(tile) {
		return isUnknown(tile) || isBlocking(tile);
	}
	function wantsDoor(tile) {
		return tile !== T.Unknown && SymbolToType[tile].wantsDoor;
	}
	function wantsBridge(tile) {
		return tile !== T.Unknown && SymbolToType[tile].wantsBridge;
	}

	function injectMake(injectList,x,y,inject,source) {
		if( !Array.isArray(inject) && typeof inject == 'object' ) {
			inject = [inject];
		}
		console.assert(Array.isArray(inject));
		//console.log("Injecting from "+source+":");
		inject.forEach( supply => {
			// At this point any supply.pick choices should have ALREADY been made!
			console.assert(supply.typeFilter);
			//console.log(supply.typeFilter,supply);
		});
		let pos = ''+x+','+y;
		if( injectList[pos] && Array.isArray(injectList[pos]) && !injectList[pos][0].toThemeId ) {
			// This might happen then you are making a portal and both the plan and the
			// theme specify data to inject into the object. That is OK.
			debugger;
		}
		injectList[pos] = injectList[pos] || [];
		injectList[pos].push(...inject);
	}


	class MasonMap {
		constructor(whoseGrid) {
			this.xMin = 0;
			this.yMin = 0;
			this.xMax = 0;
			this.yMax = 0;
			this.tile = whoseGrid || [];

		}
		get xLen() { return this.xMax-this.xMin+1; }
		get yLen() { return this.yMax-this.yMin+1; }
		setDimensions(xLen,yLen) {
			console.assert( typeof xLen == 'number' && !isNaN(xLen) );
			if( yLen === undefined ) {
				yLen = xLen;
			}
			this.xMin = 0;
			this.yMin = 0;
			this.xMax = this.xMin+xLen-1;
			this.yMax = this.yMin+yLen-1;
			this.fillWeak(T.Unknown);
			return this;
		}
		getVal(key,x,y) {
			x = Math.floor(x);
			y = Math.floor(y);
			if( !this.tile[y] ) {
				return;
			}
			if( !this.tile[y][x] ) {
				return;
			}
			return this.tile[y][x][key];
		}
		getTile(x,y) {
			x = Math.floor(x);
			y = Math.floor(y);
			if( !this.tile[y] ) {
				return T.Unknown;
			}
			if( !this.tile[y][x] ) {
				return T.Unknown;
			}
			return this.tile[y][x].tile || T.Unknown;
		}
		getZoneId(x,y) {
			x = Math.floor(x);
			y = Math.floor(y);
			if( !this.tile[y] ) {
				return NO_ZONE;
			}
			if( !this.tile[y][x] ) {
				return NO_ZONE;
			}
			return this.tile[y][x].zoneId;
		}
		ext(x,y) {
			console.assert( x !== undefined && typeof x === 'number' && !isNaN(x) );
			console.assert( y !== undefined && typeof y === 'number' && !isNaN(y) );
			this.xMin = Math.min(x,this.xMin);
			this.yMin = Math.min(y,this.yMin);
			this.xMax = Math.max(x,this.xMax);
			this.yMax = Math.max(y,this.yMax);
		}
		setVal(key,x,y,value) {
			x = Math.floor(x);
			y = Math.floor(y);
			this.ext(x,y);
			this.tile[y] = this.tile[y] || [];
			this.tile[y][x] = this.tile[y][x] || {};
			this.tile[y][x][key] = value;
			return this;
		}
		setAll(x,y,obj) {
			x = Math.floor(x);
			y = Math.floor(y);
			this.ext(x,y);
			this.tile[y] = this.tile[y] || [];
			this.tile[y][x] = obj;
			return this;
		}
		getAll(x,y) {
			x = Math.floor(x);
			y = Math.floor(y);
			this.ext(x,y);
			this.tile[y] = this.tile[y] || [];
			this.tile[y][x] = this.tile[y][x] || {};
			return this.tile[y][x];
		}
		setTile(x,y,tileType,zoneId=NO_ZONE) {
			x = Math.floor(x);
			y = Math.floor(y);
			this.ext(x,y);
			this.tile[y] = this.tile[y] || [];
			this.tile[y][x] = this.tile[y][x] || {};
			//if( this.tile[y][x].hard ) debugger;
			this.tile[y][x].tile = tileType;
			this.tile[y][x].zoneId = zoneId;
			return this;
		}
		setZoneId(x,y,zoneId) {
			x = Math.floor(x);
			y = Math.floor(y);
			this.ext(x,y);
			this.tile[y] = this.tile[y] || [];
			this.tile[y][x] = this.tile[y][x] || {};
			this.tile[y][x].zoneId = zoneId;
			return this;
		}
		area() {
			return this.xLen * this.yLen;
		}
		traverse(fn,xsInset=0,ysInset=0,xeInset=0,yeInset=0) {
			if( xsInset+xeInset >= this.xLen ) { debugger; }
			if( ysInset+yeInset >= this.yLen ) { debugger; }
			// WARNING: Keep these intermediate variables here because otherwise you might endless loop
			// if an operation expands the xMin and xMax.
			let sy = this.yMin+ysInset;
			let ey = this.yMax-yeInset;
			let sx = this.xMin+xsInset;
			let ex = this.xMax-xeInset;
			for( let y=sy ; y<=ey ; ++ y ) {
				for( let x=sx ; x<=ex ; ++x ) {
					let go = fn.call(this,x,y);
					if( go === false ) {
						return this;
					}
				}
			}
			return this;
		}
		findFirst(tileType) {
			let fx,fy;
			this.traverse( (x,y)=> {
				if( this.getTile(x,y)==tileType ) {
					fx=x;
					fy=y;
					return false;
				}
			});
			return [fx,fy];
		}
		getExtents() {
			let xMin = 999999;
			let yMin = 999999;
			let xMax = -999999;
			let yMax = -999999;
			let any = false;
			this.traverse( (x,y) => {
				if( !isUnknown(this.getTile(x,y)) ) {
					xMin = Math.min(x,xMin);
					yMin = Math.min(y,yMin);
					xMax = Math.max(x,xMax);
					yMax = Math.max(y,yMax);
					any = true;
				}
			});
			if( !any ) {
				// Always return at least 1x1
				xMin = 0; yMin = 0; xMax = 0; yMax = 0;
			}
			return [xMin,yMin,xMax,yMax];
		}
		expandExtents(amount) {
			this.xMin -= amount;
			this.yMin -= amount;
			this.xMax += amount;
			this.yMax += amount;
		}
		copyFrom(area,xMin,yMin,xMax,yMax,tx,ty) {
			area.traverse( (x,y) => {
				if( x>=xMin && x<=xMax && y>=yMin && y<=yMax ) {
					let obj = area.getAll(x,y);
					if( obj && !isUnknown(obj.tile) ) {
						this.setAll(tx+x-xMin,ty+y-yMin,obj);
					}
				}
			});
			return this;
		}
		moveInjectList(injectList,dx,dy) {
			let newInjectList = [];
			for( let key in injectList ) {
				let pos = key.split(',');
				let x = parseInt(pos[0])+dx;
				let y = parseInt(pos[1])+dy;
				newInjectList[''+x+','+y] = injectList[key];
			}
			// Very important here to NOT replace the inject list, but only mondify it.
			for(var key in injectList) {
				delete injectList[key];
			}
			Object.assign(injectList,newInjectList);
		}
		moveSiteList(siteList,dx,dy) {
			siteList.forEach( site => {
				for( let i=0 ; i<site.marks.length ; i+=2 ) {
					site.marks[i+0] += dx;
					site.marks[i+1] += dy;
				}
			});
		}
		sizeToExtentsWithBorder(injectList,siteList,border) {
			let xMin,yMin,xMax,yMax;
			[xMin,yMin,xMax,yMax] = this.getExtents();
			let area = new MasonMap();
			area.setDimensions(xMax-xMin+1+border*2,yMax-yMin+1+border*2);
			let tx = border;
			let ty = border;
			area.copyFrom(this,xMin,yMin,xMax,yMax,tx,ty);
			Object.assign(this,area);

			this.moveInjectList(injectList,border-xMin,border-yMin);
			this.moveSiteList(siteList,border-xMin,border-yMin);
		}
		randPos(expand=0) {
			let xExpand = expand;
			let yExpand = expand;
			let x = Rand.intRange(this.xMin-xExpand,this.xMax+1+xExpand);
			let y = Rand.intRange(this.yMin-yExpand,this.yMax+1+yExpand);
			return [x,y];
		}
		randPos4(xa=0,ya=0,xb=0,yb=0) {
			return [
				Rand.intRange(this.xMin+xa,this.xMax+1+xb),
				Rand.intRange(this.yMin+ya,this.xMax+1+yb)
			];
		}

		countAll(testFn) {
			let c = 0;
			this.traverse( (x,y) => c += (testFn(this.getTile(x,y)) ? 1 : 0) );
			return c;
		}
		countTile(tile) {
			let c = 0;
			this.traverse( (x,y) => c += this.getTile(x,y)==tile ? 1 : 0 );
			return c;
		}
		traverse8(x,y,fn) {
			for( let dir=0 ; dir<8 ; ++dir ) {
				let dx = x+DirAdd[dir].x;
				let dy = y+DirAdd[dir].y;
				if( fn(dx,dy,this.getAll(dx,dy)) === false ) {
					return;
				}
			}
		}
		count8(x,y,testFn) {
			x = Math.floor(x);
			y = Math.floor(y);
			let count = 0;
			for( let dir=0 ; dir<DirAdd.length ; ++dir ) {
				let tile = this.getTile(x+DirAdd[dir].x,y+DirAdd[dir].y);
				if( testFn(tile) ) {
					++count;
				}
			}
			return count;
		}
		count4(x,y,testFn) {
			x = Math.floor(x);
			y = Math.floor(y);
			let count = 0;
			for( let dir=0 ; dir<DirAdd.length ; dir += 2 ) {
				let tile = this.getTile(x+DirAdd[dir].x,y+DirAdd[dir].y);
				if( testFn(tile) ) {
					++count;
				}
			}
			return count;
		}
		count4zone(x,y,testFn) {
			x = Math.floor(x);
			y = Math.floor(y);
			let count = 0;
			for( let dir=0 ; dir<DirAdd.length ; dir += 2 ) {
				let zoneId = this.getZoneId(x+DirAdd[dir].x,y+DirAdd[dir].y);
				if( testFn(zoneId) ) {
					++count;
				}
			}
			return count;
		}
		placeRandom(tile,onTile,amount=1) {
			while( amount ) {
				let pos = this.randPos();
				if( this.getTile(pos[0],pos[1]) == onTile ) {
					this.setTile(pos[0],pos[1],tile);
					--amount;
				}
			}
			return this;

		}
		pickSafePos() {
			let reps = this.xLen * this.yLen;
			while( --reps ) {
				let x,y;
				[x,y] = this.randPos();
				if( isFloor(this.getTile(x,y)) && this.count8(x,y,isFloor)>=3  ) {
					return [x,y];
				}
			}
			return this;

		}
		gather(fn) {
			let list = [];
			this.traverse( (x,y) => {
				if( fn(x,y) ) {
					list.push(x,y);
				}
			});
			return list;
		}
		zoneFlood(x,y,zoneId,ortho,toZoneId=NO_ZONE) {
			function zap(x,y) {
				for( let dir=0; dir<DirAdd.length ; dir += step ) {
					let nx = x + DirAdd[dir].x;
					let ny = y + DirAdd[dir].y;
					if( nx<self.xMin || ny<self.yMin || nx>self.xMax || ny>self.yMax ) continue;
					let tZoneId = self.getZoneId(nx,ny);
					if( tZoneId !== zoneId) { continue; }
					self.setZoneId(nx,ny,toZoneId);
					++count;
					hotTiles.push(nx,ny);
				}
			}
			let self = this;
			let step = ortho ? 2 : 1;
			let tZoneId = self.getZoneId(x,y);
			if( tZoneId !== zoneId ) debugger;
			self.setZoneId( x, y, toZoneId );
			let count = 1;
			let hotTiles = [x,y];
			do {
				zap( hotTiles.shift(), hotTiles.shift() );
			} while( hotTiles.length );

			return count;
		}

		flood(x,y,ortho,keepTiles,testFn,assignFn) {
			function expand(x,y) {
				for( let dir=0; dir<DirAdd.length ; dir += step ) {
					let nx = x + DirAdd[dir].x;
					let ny = y + DirAdd[dir].y;
					if( nx<self.xMin || ny<self.yMin || nx>self.xMax || ny>self.yMax ) continue;
					let t = self.getAll(nx,ny);
					if( !testFn(nx,ny,t.tile || T.Unknown,t.zoneId) ) { continue; }
					assignFn(nx,ny,t);
					++count;
					hotTiles.push(nx,ny);
				}
			}
			let self = this;
			let step = ortho ? 2 : 1;
			let t = self.getAll(x,y);
			if( !testFn(x,y,t.tile) ) { return 0; }
			assignFn(x,y,t);
			let count = 1;
			let hotTiles = [x,y];
			let index = 0;
			do {
				expand( hotTiles[index++], hotTiles[index++] );
			} while( index < hotTiles.length );

			return keepTiles ? hotTiles : { length: hotTiles.length };
		}
		twoOnlyOpposed(x,y,testFn,show) {
			if( show ) {
				let t = '';
				let d = 3;
				for( let y0=y-d ; y0<=y+d ; ++y0 ) {
					for( let x0=x-d ; x0<=x+d ; ++x0 ) {
						t += this.getTile(x0,y0);
					}
					t += '\n';
				}
				console.log(t);
			}
			let n = testFn(this.getTile(x,y-1));
			let s = testFn(this.getTile(x,y+1));
			let e = testFn(this.getTile(x-1,y));
			let w = testFn(this.getTile(x+1,y));
			if( n=='W' && s=='W' && e=='F' && w=='F' ) return true;
			if( e=='W' && w=='W' && n=='F' && s=='F' ) return true;
			return false;
		}
		countGaps(x,y) {
			let swaps = 0;
			let lastWalkable = isWalkable(this.getTile(x+DirAdd[7].x,y+DirAdd[7].y));
			for( let dir=0 ; dir < 8 ; ++dir ) {
				let tile = this.getTile(x+DirAdd[dir].x,y+DirAdd[dir].y);
				let walkable = isWalkable(tile);
				if( walkable != lastWalkable ) ++swaps;
				lastWalkable = walkable;
			}
			return swaps / 2;
		}

		techniqueFlood(x,y,count,sparkTile,sparkLimit,sparkRatio,keepTiles,assignFn) {
			let remain = count;
			let ch = 100;
			let tileList = this.flood( x, y, true, true,
				(x,y,tile) => Rand.chance100(ch) && remain>0 && (isUnknown(tile) /*|| isWalkable(tile)*/) && this.countGaps(x,y)<=1, 
				(x,y,t) => { --remain; ch = Math.max(70,ch-1); assignFn(x,y,t); }
			);
			let spot = Math.max(1,(count-remain)*sparkRatio);
			Array.shufflePairs(tileList);
			for( let i=0 ; i<tileList.length && spot>0 ; i+=2 ) {
				let x = tileList[i];
				let y = tileList[i+1];
				if( this.count8(x,y,isUnknown)>=sparkLimit ) {
					this.setTile(x,y,sparkTile); //FloorFill);
					--spot;
					--remain;	// YES! This is allowed to overflow the count.
				}
			}
			return count-remain;
		}

		floodAll(ortho,keepTiles) {
			let zoneList = [];
			let zoneId = 0;

			this.clearZones();

			this.traverse( (x,y) => {
				if( this.getZoneId(x,y) == NO_ZONE && isWalkable(this.getTile(x,y)) ) {
					let tiles = this.flood( x, y, ortho, keepTiles,
						(x,y,tile,z) => isWalkable(tile) && (z===undefined || z != zoneId),
						(x,y,t) => t.zoneId = zoneId
					);
					if( keepTiles && tiles.count<=0 ) {
						debugger;
					}
					zoneList[zoneId] = { x:x, y:y, zoneId: zoneId, tiles: tiles, count: tiles.length/2 };
					++zoneId;
				}
			});

			let zoneBySizeDescending = zoneList.sort( (a,b) => b.count-a.count );
			return zoneBySizeDescending;
		}

		findClosest(sx,sy,avoidZoneId,haltAtDist,zoneIdLookup) {

			// Create the prolist if we haven't already.
			if( !this.proList ) {
				this.proList = [];
				let xLimit = Math.min(MAX_CLOSEST_SEARCH,this.xLen);
				let yLimit = Math.min(MAX_CLOSEST_SEARCH,this.yLen);
				for( let y=-yLimit ; y<yLimit ; ++y ) {
					for( let x=-xLimit ; x<xLimit ; ++x ) {
						if( x==0 && y==0 ) continue;
						let dist = Distance.get(x,y);
						this.proList.push({x:x,y:y,dist:dist});
					}
				}
				Array.shuffle(this.proList);	// This is so that the sort is less predictable for equal distances.
				this.proList.sort( (a,b) => a.dist-b.dist );
			}

			let xLen = this.xLen;
			let sameZoneCount = 0;
			for( let i=0 ; i<this.proList.length ; ++i ) {
				let p = this.proList[i];
				if( p.dist > haltAtDist ) {
					// Only use greater-than. This way, all the equal distances will have a chance.
					return false;
				}
//somehow setVal() is calling ext(x,y) all the time

//Perhaps this thing is miscounting the number of tiles consumed?

				let x = sx+p.x;
				let y = sy+p.y;
				let zoneId = zoneIdLookup[y*xLen+x]; //this.getZoneId(x,y);
				if( zoneId == avoidZoneId ) {
					sameZoneCount++;
					if( i==7 && sameZoneCount==8 ) {
						// Halt early because the first eight tiles were all my zone, that is,
						// I am an interior tile, and I will never be anything else!
						this.setVal( 'enclosed', sx, sy, 1 );
						//console.log( 'found enclosed ('+sx+','+sy+')' );
						return false;
					}
				}
				if( zoneId != NO_ZONE && zoneId !== undefined && zoneId != avoidZoneId && !this.getAll(x,y).hard ) {
					return {
						x:sx, y:sy, zoneId:avoidZoneId,
						tx:x, ty:y, tZoneId:zoneId,
						dist: p.dist
					}
				}
			}
			return false;
		}
		setPassageTile(x,y,dir,zoneId) {
			let acted = false;
			let tile = this.getTile(x,y);
			if( wantsDoor(tile) && this.count8(x,y,isDoor)<=0 ) {
				// If this is a tile marked for doors, then make a door.
				this.setTile(x,y,T.Door);
				acted=true;
			}
			else 
			if( wantsBridge(tile) ) { //&& this.count4(x,y,isWall)==0 && this.count4(x,y,isFloor)<=1 ) {
				this.setTile(x,y,T.Bridge);
				acted=true;
			}
			else 
			if( !isWalkable(tile) ) {
				// Only mar the area if it is NOT already walkable.
				this.setTile(x,y,T.PassageFloor);
				acted=true;
			}

			this.setZoneId(x,y,zoneId);
			return acted;
		}

		setPassageTileWideAndRemember(x,y,width,dir,zoneId,marks) {
			console.assert( x!==undefined && y!==undefined );
			console.assert( dir >=0 && dir < 8 );
			console.assert( width >=1 && width <=3 );
			if( width > 1 ) debugger;
			// This 'width' business is to make cooridors wider when requested.
			for( let rx=-Math.floor(width/2) ; rx<Math.ceil(width/2) ; ++rx ) {
				for( let ry=-Math.floor(width/2) ; ry<Math.ceil(width/2) ; ++ry ) {
					let px = x+rx;
					let py = y+ry;
					let acted = this.setPassageTile(px,py,dir,zoneId);
					if( acted && marks ) {
						// This intentionally misses the start and end points, which should already have sites.
						marks.push(px,py);
					}
				}
			}
		}

		zoneLinkByPath(x,y,tx,ty,zoneId,tZoneId,linkFn,marks,width) {
			let path = new Path( this, this.area(), true, 30, (x,y) => {
				let all = this.getAll(x,y);
				if( !all.tile ) return 0.0;				// Unknown
				if( all.hard ) return 0.9;				// Wall placed by a place
				if( isBlocking(all.tile) ) return 0.1;	// Other walls or immobile items
				return 0.0;								// All floor, items, monsters, etc.
			});

			let success = path.findPath(null,x,y,tx,ty);
			if( !success ) {
				return false;
			}

			let reps = path.path.length * 2;
			while( --reps ) {
				let dir = path.getDirFrom(x,y);
				if( dir === false ) {
					debugger;
					return false;
				}
				x += DirAdd[dir].x;
				y += DirAdd[dir].y;
				if( x == tx && y == ty ) {
					return true;
				}
				this.setPassageTileWideAndRemember(x,y,width,dir,zoneId,marks);					
			}
			if( !reps ) {
				debugger;
			}
		}

		zoneLink(x,y,tx,ty,zoneId,tZoneId,linkFn,marks,width) {
			// to - from
			let t = [];
			let reps = 9999;
			while( reps-- ) {
				let dir = linkFn(tx-x,ty-y);
				console.assert(dir!==false);
				x += DirAdd[dir].x;
				y += DirAdd[dir].y;
				if( x==tx && y==ty ) {
					return;
				}
				this.setPassageTileWideAndRemember(x,y,width,dir,zoneId,marks);
			}
			return false;
		}

		findProximity(zoneList) {
			// Find the closest tile for every single tile in every zone, that is on the edge.
			let zoneIdLookup = [];
			let xLen = this.xLen;
			this.traverse( (x,y) => { zoneIdLookup[y*xLen+x] = this.getZoneId(x,y); });
			let proximity = [];
			for( let zone of zoneList) {
				let bestDist = Math.min(30,Math.max(this.xLen,this.yLen)); //4*this.xLen*this.yLen;
				Array.traversePairs( zone.tiles, (x,y) => {
					let all = this.getAll(x,y);
					if( all.hard || all.enclosed) {
						// Don't attempt to make paths connect to 'hard' walls, ie those
						// put down by the places. Nor connect to interior spaces.
						return;
					}
//					if( isWall(this.getTile(x,y)) ) {
//						debugger;
//					}
					let result = this.findClosest(x,y,zone.zoneId,bestDist,zoneIdLookup);
					if( result !== false ) {
						proximity.push(result);
						bestDist = result.dist;
					}
				});
			}

			// Randomize them so that those of equal distance will have an equal chance of getting picked.
			Array.shuffle(proximity);
			// Sort them so that the closest are first.
			proximity.sort( (a,b) => a.dist-b.dist );
			return proximity;
		}

		jut(x,y,tx,ty,zoneId,marks) {
			let ax = Math.abs(tx-x);
			let ay = Math.abs(ty-y);
			let dist = Math.max(ax,ay);
			if( dist > 2 ) {
				let dir = deltasToDirFarthestOrtho(tx-x,ty-y,true);
				if( isUnknown(this.getTile(x+DirAdd[dir].x,y+DirAdd[dir].y)) ) {
					x += DirAdd[dir].x;
					y += DirAdd[dir].y;
					this.setPassageTile(x,y,dir,zoneId);
					marks.push(x,y);
				}
			}
			return [x,y];
		}

		connectAll(siteList,passageWander,preferDoors,passageWidth2=0,passageWidth3=0) {
			let i = 0;
			let doorCount = 0;
			let reps = 100;
			do {
				let zoneList = this.floodAll(true,true);
				if( zoneList.length <= 1 ) {
					break;
				}

				let proximity = this.findProximity(zoneList);

				// Now, in order, make connections.
				let link = {};
				let reps = 100;
				while( proximity.length && --reps ) {
					let p = proximity.shift();
					let pair = Math.min(p.zoneId,p.tZoneId)+'-'+Math.max(p.zoneId,p.tZoneId);
					if( link[pair] ) {
						//console.log('skipping '+pair);
						continue;
					}

					let site0 = this.getAll(p.x,p.y).siteId;	// allowed to be undefined
					let site1 = this.getAll(p.tx,p.ty).siteId;	// allowed to be undefined

					let width = Rand.chance100(passageWidth2) ? 2 : ( Rand.chance100(passageWidth3) ? 3 : 1 );

					// We don't really want to intrude into whatever space we're connecting to. That often looks
					// pretty bad. So jut out from either end.
					let doorCheck = [p.x,p.y,p.tx,p.ty];
					let marks = [];
					if( width == 1 ) {
						[p.x,p.y]   = this.jut( p.x,  p.y,  p.tx, p.ty, p.zoneId, marks );
						[p.tx,p.ty] = this.jut( p.tx, p.ty, p.x,  p.y,  p.tZoneId, marks );
						doorCheck.push(p.x,p.y);
						doorCheck.push(p.tx,p.ty);
					}

					let lean = Rand.chance100(50);
					function deltasToDirStrict(dx,dy) {
						if( dx && dy ) {
							if( lean ) { dx=0; } else { dy=0; }
						}
						return directionPredictable(dx,dy);
					}
					if( p.x!=p.tx || p.y!=p.ty ) {
						let linkFn = Rand.chance100(passageWander) ? directionNaturalOrtho : deltasToDirStrict;
						let ok = this.zoneLinkByPath(p.x,p.y,p.tx,p.ty,p.zoneId,p.tZoneId,linkFn,marks,width);
						if( !ok ) {
							this.zoneLink(p.x,p.y,p.tx,p.ty,p.zoneId,p.tZoneId,linkFn,marks,width);
						}
						let thruSite = {};
						let bestId = '';
						let tempMarks = [].concat(marks);
						Array.traversePairs( tempMarks, (x,y) => {
							let siteId = this.getAll(x,y).siteId;
							if( siteId ) {
								let site = siteList.find( site=>site.id==siteId );
								if( site ) {
									//console.log("Transfer ("+x+","+y+") from passage to "+siteId);
									site.marks.push(x,y);
									Array.filterInPlace(marks,(mx,my)=>mx==x && my==y);
								}
							}
						});
						while( preferDoors && doorCheck.length ) {
							let x = doorCheck.shift();
							let y = doorCheck.shift();
							if( isFloor(this.getTile(x,y)) ) {
								if( this.twoOnlyOpposed( x, y, tile => {
									if( isWall(tile) || isUnknown(tile) ) return 'W';
									if( isFloor(tile) ) return 'F';
								}) ) {
									console.assert(T.Door == '+');
									this.setTile(x,y,T.Door);
									++doorCount;
								}
							}
						}

						// This will push whatever marks remain. NOTE that the passage might not be contiguous
						// anymore. ALSO if all of this passage was transferred to other sites, it will be empty.
						if( marks.length ) {
							siteList.push({
								id: 'passage.'+Date.makeUid(),
								marks: marks,
								isPassage: true,
								site0: site0,
								site1: site1,
								denizenList: [],
								treasureList: []
							});
						}
					}
					else {
						debugger;
					}
//					console.log("Linked "+pair);
					link[pair] = (link[pair]||0)+1;
				}
			} while( reps-- );
			//console.log("Made "+doorCount+" passage doors.");
		}

		fit(px,py,expand,placeMap) {
			if( px<0 || py<0 || px+placeMap.xLen>this.xLen || py+placeMap.yLen>this.yLen ) {
				return false;
			}
			for( let y=0-expand ; y<placeMap.yLen+expand ; ++y ) {
				for( let x=0-expand ; x<placeMap.xLen+expand ; ++x ) {
					let tile = this.getTile(px+x,py+y);
					if( !isUnknown(tile) ) {
						return false;
					}
				}
			}
			return true;
		}
		inject(px,py,placeMap,fn) {
			for( let y=0 ; y<placeMap.yLen ; ++y ) {
				for( let x=0 ; x<placeMap.xLen ; ++x ) {
					let pSym = placeMap.tileSymbolGet(x,y);
					if( pSym == Tile.UNKNOWN ) {
						// This is allwed.
						continue;
					}
					if( pSym === undefined ) {
						debugger;
					}
					let mSym = this.getTile(px+x,py+y)
					if( mSym !== Tile.UNKNOWN ) {
						debugger;
					}
					this.setTile(px+x,py+y,pSym);
					fn(x,y,px+x,py+y,pSym);
				}
			}
		}


		removeSingletonUnknowns(limit=4) {
			let count = 0;
			let any = true;
			let reps = 10;
			while( any && reps--) {
				any = false;
				this.traverse( (x,y) => {
					if( isUnknown(this.getTile(x,y)) && this.count4(x,y,isWalkable)>=3 ) {
						this.setTile(x,y,this.majorityNear(x,y,isFloor) || T.FillFloor);
						any = true;
						++count;
					}
				});
			}
			return count;
		}
		removeDiagnoalQuads() {
			let any;
			do {
				any = false;
				this.traverse( (x,y) => {
					let a = this.getTile(x,y);
					let b = this.getTile(x+1,y);
					let c = this.getTile(x,y+1);
					let d = this.getTile(x+1,y+1);
					if( isUnknown(a) || isUnknown(b) || isUnknown(c) || isUnknown(d) ) {
						return;
					}
					if( a==d && b==c && a!=b ) {
						if( isWall(a) ) {
							this.setTile(x,y,this.majorityNear(x,y,isFloor) || T.FillFloor);
							any = true;
						}
						else
						if( isWall(b) ) {
							this.setTile(x+1,y,this.majorityNear(x,y,isFloor) || T.FillFloor);
							any = true;
						}
					}
				},0,0,1,1);
			} while( any );
			return this;
		}

		assembleSites(siteList) {

			function addSite(site) {
				if( siteList.find(s=>s.id==site.id) ) debugger;
				console.assert(site.marks.length);
				site.denizenList = [];
				site.treasureList = [];
				siteList.push(site);
				Array.traversePairs( site.marks, (x,y) => {
					self.getAll(x,y).siteId = site.id;
				});
			}

			function addRoom(marks,nearSiteId) {
				let s = {
					id: 'room.'+Date.makeUid(),
					marks: marks,
					isRoom: true
				};
				if( nearSiteId ) {
					s.isNear = nearSiteId;
				}

				addSite(s);
			}

			function addNear(marks,siteId) {
				let site = siteList.find(site=>site.id==siteId);
				console.assert(site);
				if( marks.length > site.marks.length ) {
					// We are bigger than the site, so make us our own room.
					addRoom(marks,siteId);
				}
				else {
					addSite({
						id: 'near.'+siteId+'.'+Date.makeUid(),
						marks: marks,
						isNear: siteId,
					});
				}
			}

			let self = this;
			// Now finalize the sites.
			let zoneList = this.floodAll(true,true);
			zoneList.forEach( zone => {
				//if( zone.count < 4 ) return;	// Zone is too small to bother noting. Consider it passage.
				let found = {};
				Array.traversePairs( zone.tiles, (x,y) => {
					let a = this.getAll(x,y);
					if( a && a.siteId!==undefined ) {
						found[a.siteId] = (found[a.siteId] || []);
					}
				});

				// No site exists within this zone, so just make a wilderness room out of it.
				if( Object.isEmpty(found) ) {
					console.assert( zone.tiles && zone.tiles.length );
					addRoom(zone.tiles);
					return;
				}

				// We found only one site, so all the non-overlapping spots are considered adjacent
				if( Object.keys(found).length == 1 ) {
					let marks = [];
					Array.traversePairs( zone.tiles, (x,y) => {
						let a = this.getAll(x,y);
						if( a.siteId===undefined ) {
							marks.push(x,y);
						}
					});
					if( marks.length ) {
						let siteId = Object.keys(found)[0];
						addNear(marks,siteId);
					}
					return;
				}

				// Drat, multiple sites exist in this zone. Outline them all until nothing is left.
				let nearHash = {};
				let anyFound;
				let reps = 4*this.xLen*this.yLen;
				do {
					anyFound = false;
					let markHash = {};
					// Expand outward until all adjacent sites are filled.
					Array.traversePairs( zone.tiles, (x,y) => {
						let a = this.getAll(x,y);
						if( a.siteId ) return;
						this.traverse8( x, y, (nx,ny,all) => {
							if( all.siteId!==undefined ) {
								markHash[all.siteId] = markHash[all.siteId] || [];
								markHash[all.siteId].push(x,y);
								anyFound = true;
								return false;
							}
						});
					});
					// Accumulate a list of siteId's that we're near, and all the marks for it.
					Object.each( markHash, (marks,siteId) => {
						nearHash[siteId] = nearHash[siteId] || []
						Array.traversePairs( marks, (x,y) => {
							this.getAll(x,y).siteId = siteId;
							nearHash[siteId].push(x,y);
						});
					});
				} while( anyFound && --reps > 0 );
				if( reps <=0 ) debugger;

				Object.each( nearHash, (marks,siteId) => {
					if( marks.length ) {
						addNear(marks,siteId);
					}
				});
			});
		}
		majorityNear(x,y,testFn) {
			let most = {};
			let best = false;
			for( let dir=0 ; dir<Direction.count ; ++dir ) {
				let dx = x+Direction.add[dir].x;
				let dy = y+Direction.add[dir].y;
				let tile = this.getTile(dx,dy);
				if( testFn(tile) ) {
					most[tile] = (most[tile]||0)+1;
					if( !best || most[tile] > most[best] ) {
						best = tile;
					}
				}
			}
			return best;
		}
		removePointlessDoors() {
			let removeCount = 0;
			this.traverse( (x,y)=> {
				let tile = this.getTile(x,y);
				if( isDoor(tile) ) {
					if( !this.twoOnlyOpposed(x,y,tile => {
						// I think it makes the most sense to make all non-floor things (items and monsters)
						// be considered floor, legitimizing the door.
						let nonWallNonFloor = 'F';	// was 'X'
						return isWall(tile) || isUnknown(tile) ? 'W' : ( isFloor(tile) ? 'F' : nonWallNonFloor );
					}) ) {
						let fn = this.countGaps(x,y) <= 1 ? isWall : isFloor;
						console.log("Remove: "+fn);
						this.setTile(x,y,this.majorityNear(x,y,fn) || T.FillFloor);
						++removeCount;
					}
				}
			},-1,-1,-1,-1);
			console.log("Removed "+removeCount+" pointless doors.");
			return this;
		}
		wallify(wallTile) {
			let edges = this.gather( (x,y) => isUnknown(this.getTile(x,y)) && this.count8(x,y,isWalkable)>0 );
			// This is made just right so that, if your wallTile is walkable, it still works!!
			for( let i=0 ; i<edges.length ; i+=2 ) {
				this.setTile(edges[i+0],edges[i+1],wallTile);
			}
			return this;
		}
		clearZones(zoneId=NO_ZONE) {
			this.traverse( (x,y) => this.setZoneId(x,y,zoneId) );
		}
		fill(tileType) {
			this.traverse( (x,y) => this.setTile(x,y,tileType) );
			return this;
		}
		fillWeak(tileType) {
			this.traverse( (x,y) => {
				let tile = this.getTile(x,y);
				if( !tile || isUnknown(tile) ) {
					this.setTile(x,y,tileType);
				}
			});
			return this;
		}
		fillCircle(x0, y0, radius, fn) {

			function strip(sx,ex,y) {
				console.assert(sx<=ex);
				while( sx <= ex ) {
					count += fn(self,sx,y) ? 1 : 0;
					sx++;
				}
			}
			let self = this;
			let count = 0;
			var x = radius;
			var y = 0;
			var radiusError = 1 - x;

			while (x >= y) {
				strip( x0-x, x0+x, y0-y );
				strip( x0-x, x0+x, y0+y );
				strip( x0-y, x0+y, y0-x );
				strip( x0-y, x0+y, y0+x );
				y++;
				if (radiusError < 0) {
					radiusError += 2 * y + 1;
				}
				else {
					x--;
					radiusError+= 2 * (y - x + 1);
				}
			}
			return count;
		}
		fillRect(sx,sy,xLen,yLen,fn) {
			let count = 0;
			for( let y=0 ; y<yLen ; ++y ) {
				for( let x=0 ; x<xLen ; ++x ) {
					count += fn(this,sx+x,sy+y) ? 1 : 0
				}
			}
			return count;
		}
		convert(tileFrom,tileTo) {
			this.traverse( (x,y) => {
				if( this.getTile(x,y) == tileFrom ) {
					this.setTile(x,y,tileTo);
				}
			});
		}
		renderToString(drawZones) {
			let s = '';
			let yLast = this.yMin;
			this.traverse( (x,y) => {
				if( y !== yLast ) {
					s += '\n';
				}
				if( drawZones ) {
					let c = ZoneChar.charAt(this.getZoneId(x,y)+1);
					if( c == ' ' && !isUnknown(this.getTile(x,y)) ) {
						c = this.getTile(x,y);
					}
					s += c;
				}
				else {
					s += this.getTile(x,y) || '?';
				}
				yLast = y;
			});
			return s;
		}
	}

	function repeat(n,fn) {
		while(n-- > 0 ) {
			fn(n);
		}
	}

	function positionPlaces(depth,map,numPlaceTilesOriginal,quota,requiredPlaces,rarityHash,injectList,siteList,mapOffset) {

		class PlacePicker extends Pick.Table {
			constructor() {
				super();
				this.placeUsed = {};
			}
			pickResistingDuplicates() {
				if( this.noChances() ) {
					this.reset();
				}
				let place = this.pick();
				console.log( place.id, this.chance[this.indexPicked] );
				this.forbidLast();
				return place;
			}
		}

		function tileCount(place) {
			if( place.tileCount )
				return place.tileCount;
			if( place.tilePercent )
				return Math.clamp( Math.floor(numPlaceTilesOriginal * place.tilePercent), 1, numPlaceTilesOriginal );
			debugger;
			return 0;
		}

		function generateMaze(inject,xLen,yLen,floorSymbol,wallSymbol,makeWalled,supply) {
			function mayGo(x,y) {
				return x>=0+edge && y>=0+edge && x<xLen-edge && y<yLen-edge && 
					map.tileTypeGet(x,y).isWall && 
					map.count8(x,y,(x,y,tile)=>tile.isWall) >=5 &&
					map.countGaps(x,y)==1;
			}
			let edge = makeWalled ? 1 : 0;
			if( floorSymbol == Tile.FLOOR ) { floorSymbol = T.Floor };
			if( wallSymbol == Tile.WALL ) { wallSymbol = T.Wall };
			console.assert( xLen>2 && yLen>2 && floorSymbol && wallSymbol );
			let map = new SimpleMap(SimpleMap.fillTextMap(xLen,yLen,wallSymbol));
			console.assert( map.xLen == xLen && map.yLen == yLen );
			let deadEnds = [];
			let stack = [];
			let sx = Rand.intRange(0+1,xLen-1*2);
			let sy = 0;
			let lastDir = 4;
			map.tileSymbolSet(sx,sy,floorSymbol);
			stack.push(sx,sy);
			let reps = xLen*yLen;
			let freshPop = true;
			while( stack.length && --reps ) {
				let options = [];
				let hasLastDir = false;
				for( let dir=0 ; dir<8 ; dir+=2 ) {
					if( mayGo(sx+DirAdd[dir].x,sy+DirAdd[dir].y) ) {
						options.push(dir);
						hasLastDir = hasLastDir || (dir==lastDir);
					}
				}
				if( !options.length ) {
					if( freshPop ) {
						deadEnds.push(sx,sy);
					}
					sy = stack.pop();
					sx = stack.pop();
					freshPop = false;
					continue;
				}
				freshPop = true;
				let dir = hasLastDir && Rand.chance100(50) ? lastDir : options[Rand.intRange(0,options.length)];
				sx += DirAdd[dir].x;
				sy += DirAdd[dir].y;
				map.tileSymbolSet(sx,sy,floorSymbol);
				stack.push(sx,sy);
				lastDir = dir;
			}

			if( supply ) {
				let supplyArray = Array.supplyParse( supply );
				let makeArray   = Array.supplyToMake(supplyArray);
				makeArray.forEach( make => {
					let i = Rand.intRange(0,deadEnds.length/2) * 2;
					let x = deadEnds[i+0];
					let y = deadEnds[i+1];
					let pPos = ''+x+','+y;
					inject[pPos] = inject[pPos] || [];
					inject[pPos].push(make);
				});
			}

			return map.renderToString();
		}

		function generateChamber(inject,xLen,yLen,floorSymbol,wallSymbol,makeWalled,supply) {

		}

		function placePrepare(place,rotation) {
			if( !place.isPrepared ) {
				// WARNING! Important for this to be a DEEP copy.
				place = jQuery.extend(true, new Place(), place, {isPrepared: true});

//				console.log("Trying to place "+place.typeId);
				if( place.technique == 'maze' ) {
					place.map = generateMaze(
						place.inject,
						place.xLen,
						place.yLen,
						place.floorSymbol || T.Floor,
						place.wallSymbol || T.Wall,
						place.makeWalled,
						place.supply
					);
				}
/*
				if( place.isChamber ) {
					place.map = generateChamber(
						place.inject,
						place.xLen,
						place.yLen,
						place.floorSymbol || T.Floor,
						place.wallSymbol || T.Wall,
						place.makeWalled,
						place.supply
					);
				}
*/
				place.generateMap(T.Floor,T.Wall);
				place.rotateIfNeeded(rotation);
			}
			return place;
		}

		class Fitter {
			constructor(map) {
				this.map = map;
			}

			testFit(x,y,place) {
				if( place.technique == 'flood' ) {
					return isUnknown(this.map.getTile(x,y)) && this.map.count8(x,y,isUnknown)==8;
				}
				let expand = place.hasWall ? 0 : 1;
				return this.map.fit( x, y, expand, place.map );
			}

			findRandomFit(place,fitReps=300) {
				let inset = 2;	// This allows for doors facing the edges to get paths to them.
				let x,y,fits;
				do {
					[x,y] = this.map.randPos4( 0+2, 0+2, place.map ? -(place.map.xLen+inset) : 0, place.map ? -(place.map.yLen+inset) : 0);
					fits = this.testFit(x,y,place);
				} while( !fits && --fitReps );
				return { x:x, y:y, fits:fits };
			}
		}

		function typeIdRemap(typeId) {
			if( T[String.capitalize(typeId)] ) {
				return SymbolToType[T[String.capitalize(typeId)]].typeId;
			}
			return typeId;
		}

		function placeMake(x,y,place) {
			console.assert( typeof x === 'number' && !isNaN(x) );
			console.assert( typeof y === 'number' && !isNaN(y) );
			console.assert( place );
			let siteMarks = [];
//				console.log('Placed at ('+x+','+y+')');
			if( place.technique == 'flood' ) {
				console.assert( place.floodId );
				let floodTile = TypeIdToSymbol[typeIdRemap(place.floodId)];
				let sparkTile = place.sparkId ? TypeIdToSymbol[typeIdRemap(place.sparkId)] : null;
				let sparkDensity = sparkTile !== null ? place.sparkDensity || 0 : 0;
				let sparkLimit = place.sparkLimit;
				let tilesMade = map.techniqueFlood( x, y, tileCount(place), sparkTile, sparkLimit, sparkDensity, false, 
					(x,y,t) => { siteMarks.push(x,y); t.tile=floodTile; } );
				numPlaceTiles += (tileCount(place)-tilesMade);
				console.log( "Made flood place "+place.typeId+" at ("+x+","+y+")" );
				return siteMarks;
			}
			if( place.technique == 'map' || place.technique == 'maze' ) {
				map.inject( x, y, place.map, function(px,py,x,y,symbol) {
					siteMarks.push(x,y);
					let type = SymbolToType[symbol];
					if( !type ) debugger;
					if( type.isWall && !place.softWalls ) {
						map.getAll(x,y).hard = true;
					}

					let typeId = type.typeId;
					if( place.inject && place.inject[typeId] ) {
						//console.log(type.typeId+' at '+x+','+y+' will get ',place.inject[type.typeId]);
						let inject = Object.assign( { typeFilter: typeId }, place.inject[typeId] );
						injectMake( injectList, x, y, inject, "placeMake by "+typeId );
					}
					// Order is important. The specifically positioned one overrides any generic tweaks on the type.
					let pPos = ''+px+','+py;
					if( place.inject && place.inject[pPos] ) {
						injectMake( injectList, x, y, place.inject[pPos], "placeMake by "+pPos );
					}
				});
				console.log( "Made mapped place "+place.typeId+" at ("+x+","+y+")" );
			return siteMarks;
			}
			console.assert(false);
		}

		function addSite( place, siteMarks ) {
			let site = {
				id: place.typeId+'.'+Date.makeUid(),
				marks: siteMarks,
				isPlace: true,
				placeId: place.typeId,
				place: place,
				denizenList: [],
				treasureList: []
			};
			if( place.typeId == 'moonPortal' ) debugger;
			if( siteList.find(s=>s.id==site.id) ) debugger;
			siteList.push(site);
			// mark on the map which site belongs to whom.
			for( let i=0 ; i<site.marks.length ; i+=2 ) {
				let x = site.marks[i];
				let y = site.marks[i+1];
				map.getAll(x,y).siteId = site.id;
			}
		}

		function makeAtRandomPosition(placeRaw,rotation) {
			let place = placePrepare(placeRaw,rotation);
			let pos = new Fitter(map).findRandomFit( place );
			if( !pos.fits ) {
				numPlaceTiles += tileCount(place);
				console.log('denied ',place.id);
				return;
			}
			let siteMarks = placeMake(pos.x,pos.y,place);
			if( siteMarks ) {
				addSite( place, siteMarks );
			}
			return siteMarks;
		}

		function makeAtSpecificPosition(placeRaw,rotation,symbol,symbolPos) {
			let place = placePrepare(placeRaw,rotation);
			let relPos = place.map.symbolFindPosition(symbol);
			let fitter = new Fitter(map);
			let pos = { x: symbolPos.x-relPos[0], y: symbolPos.y-relPos[1] };
			if( !fitter.testFit(pos.x,pos.y,place) ) {
				return false;
			}

			let siteMarks = placeMake(pos.x,pos.y,place);
			if( siteMarks ) {
				addSite( place, siteMarks );
			}
			return siteMarks;
		}

		function addRandomPlacesUntilFull(roster,placePicker) {
			// IMPORTANT: This falls through if rarityTable is empty. This is permitted, that is, an area can have zero random places.
			let reps = 1000;
			while( !placePicker.isEmpty() && numPlaceTiles>0 && --reps) {
				let place = placePicker.pickResistingDuplicates();
				roster.push(place);
				numPlaceTiles -= tileCount(place);
			}
			if( !reps ) debugger;
		}

		function makeRoster(roster) {
			let made = 0;
			while( roster.length ) {
				let place = roster.shift();
				made += makeAtRandomPosition(place,null) ? 1 : 0;
			}
			return made;
		}

		function makeQuotaPlaces(placeSource, quota, reqRoster, rarityHash, forbiddenSymbols) {

			function attemptToPlace(qPicker,constraint,description) {
				let siteMarks = false;
				while( !siteMarks && qPicker.total > 0 ) {
					let place = qPicker.pick();
					qPicker.forbidLast();
					let rotationList = Array.shuffle([0,1,2,3]);
					for( let i=0 ; i<rotationList.length ; ++i ) {
						let rotation = rotationList[i];
						if( !constraint  ) {
							siteMarks = makeAtRandomPosition( place, rotation );
						}
						else {
							siteMarks = makeAtSpecificPosition( place, rotation, constraint.symbol, constraint.symbolPos );
						}
						if( siteMarks ) {
							numPlaceTiles -= tileCount(place);
							console.log( "Quota placed "+place.typeId+" "+description );
							break;
						}
					}
				}
				return siteMarks;
			}

			function injectAndForbid(x,y,q) {
				console.assert( !q.done );
				injectMake( injectList, x, y, q.inject, "injectAndForbid" );
				forbiddenSymbols.push(q.symbol);
				q.done = true;
			}

			function scanForAndUseExisting(q) {
				// It is possible that an already-made place contains this symbol. Check for it.
				let typeId = SymbolToType[q.symbol].typeId;
				let list = map.gather( (x,y) => {
					if( map.getTile(x,y)!=q.symbol ) {
						return false;
					}
					let pos = ''+x+','+y;
					if( injectList[pos] && injectList[pos].find( make => make.fromQuota ) ) {
						return false;
					}
					return true;
				});
				if( list.length ) {
					// We'll just take the first one we found, since shuffling a list of pairs is hard.
					console.log( "Quota found "+q.typeId+" already placed. Using it." );
					injectAndForbid( list[0], list[1], q );
					return true;
				}
			}

			function injectFromQuota(siteMarks,q) {
				let found = false;
				for( let i=0 ; i<siteMarks.length && !found ; i+=2 ) {
					let x = siteMarks[i+0];
					let y = siteMarks[i+1];
					let tile = map.getTile(x,y);
					if( tile == q.symbol ) {
						injectAndForbid(x,y,q);
						return true;
					}
				}
				console.assert(q.done);
			}

			function fillQuota(q) {
				if( q.done ) {
					return;
				}
				if( scanForAndUseExisting(q) ) {
					return;
				}

				let constraint = q.putAnywhere ? null : {
					symbol: q.symbol,
					symbolPos: { x: q.x+mapOffset.x, y: q.y+mapOffset.y }
				};

				let siteMarks;
				if( reqRoster.length ) {
					let qPickerReq = new PlacePicker().scanArray( reqRoster, (place) => {
						if( place.containsAny([q.symbol]) ) {
							return 1;
						}
					});
					if( !qPickerReq.isEmpty() ) {
						siteMarks = attemptToPlace(qPickerReq,constraint,'required');
					}
				}
				if( !siteMarks ) {
					let qPickerRarity = new PlacePicker().scanHash( placeSource, (place,placeId) => {
						if( place.containsAny([q.symbol]) && (rarityHash[placeId] || place.isUtility) ) {
							return place.calcChance( depth, rarityHash[placeId] || place.rarity || rUNCOMMON );
						}
					});
					console.assert( !qPickerRarity.isEmpty() );
					siteMarks = attemptToPlace(qPickerRarity, constraint, 'random');
				}

				// If we can't place it in its specific spot, then degrade and just
				// put it fearkin' anywhere.
				if( !siteMarks && !q.putAnywhere ) {
					q.putAnywhere = true;
					return;
				}

				if( !siteMarks ) {
					let x,y;
					[x,y] = map.pickSafePos();
					map.setTile(x,y,q.symbol);
					injectMake( injectList, x, y, q.inject, "forceQuota" );
					q.done = true;
					return;
				}

				if( injectFromQuota(siteMarks,q) ) {
				}
			}

			// HANDLE the ones with a non-random position requirement first!
			quota.forEach( q => {
				if( !q.putAnywhere ) {
					fillQuota(q);
				}
			});


			quota.forEach( q => {
				fillQuota(q);
			});
		}

		function assembleRequiredPlaces(placeSource,requiredPlacesSupplyMixed) {
			let supplyArray = Array.supplyParse( requiredPlacesSupplyMixed || '' );
			let makeArray   = Array.supplyToMake(supplyArray);
			// Remember the supplyToMake(), at this time, delivers a single array entry to EACH item in count
			return makeArray.map( make => placeSource[make.typeFilter] );
		}

		function makeRequiredPlaces(roster) {
			roster.forEach( place => { numPlaceTiles -= tileCount(place); } );
			let toMake = roster.length;
			let made   = makeRoster( roster );
			if( made != toMake ) {
				console.log("WARNING: Made fewer than asked to make");
			}
		}

		function makeRandomPlaces(placePicker) {
			let roster = [];
			reps = 50;
			do {
				addRandomPlacesUntilFull(roster,placePicker);
				roster.sort( (a,b) => tileCount(b)-tileCount(a) );	// make biggest first - that is your best chance.
				makeRoster(roster);
			} while( !placePicker.isEmpty() && numPlaceTiles > 0 && --reps );
			if( !reps ) {
				console.log("Warning: your floor density was too high.");
				debugger;
			}
		}
/*
		quotaMakePositioned(quota,injectList,mapOffset) {
			quota.forEach( q => {
				console.assert( !q.done );
				if( q.putAnywhere ) {
					return;
				}



				map.setTile(q.x+mapOffset.x,q.y+mapOffset.y,q.symbol);
				injectMake( injectList, q.x+mapOffset.x, q.y+mapOffset.y, q.inject, "makePositioned" );
				q.done = true;
			});
		}


		quotaMakePositioned(quota,injectList,mapOffset);
*/
		let placeSource = {};
		Object.each( PlaceTypeList, (place,placeId) => {
			placeSource[placeId] = new Place( place );
		});

		let numPlaceTiles = numPlaceTilesOriginal;
		let forbiddenSymbols = [];
		let reqRoster = assembleRequiredPlaces(placeSource,requiredPlaces);

		// Try to fill your quota of tiles, drawing from the requiredPlaces first, and then allowing randoms.
		console.log('Filling Quota');
		makeQuotaPlaces(placeSource,quota,reqRoster,rarityHash,forbiddenSymbols,mapOffset);

		// Trim out any required place that is now forbidden due to quotas.
		reqRoster = reqRoster.filter( place => !place.containsAny(forbiddenSymbols) );

		// Make whatever remains
		console.log('Making required places');
		makeRequiredPlaces(reqRoster);

		// Now fill the rest of the level according to the raritys set by user.
		console.log('Making random places');
		let placePicker = new PlacePicker().scanHash( placeSource, (place,placeId) => {
			if( place.containsAny(forbiddenSymbols) || !place.mayPick(depth) || !rarityHash[placeId] ) {
				return false;
			}
			console.log(placeId,rarityHash[placeId],place.calcChance(depth,rarityHash[placeId]));
			return place.calcChance(depth,rarityHash[placeId]);
		});
		console.log(placePicker);
		makeRandomPlaces(placePicker);
	}

	function generateAmoebaChamber(map,floorSymbol,makeChance=30,floorToMake=0) {
		let floorMade = 0;
		let reps = 40;
		do {
			let list = map.gather( (x,y) => {
				let tile = map.getTile(x,y);
				return isUnknown(tile) && map.count4(x,y,isWalkable) > 0;
			});

			while( list.length ) {
				let y = list.pop();
				let x = list.pop();
				if( Rand.intRange(0,100) < makeChance ) {
					map.setTile(x,y,floorSymbol);
					++floorMade;
				}
			}
		} while( floorMade < floorToMake && --reps )
		return floorMade;
	}

	function makeAmoeba(map,percentToEat,seedPercent,mustConnect) {
		let i=0;
		percentToEat = Math.clamp(percentToEat||0,0.01,1.0);
		seedPercent = Math.clamp(seedPercent||0,0.001,1.0);
		let floorToMake = Math.max(1,Math.ceil(map.area() * percentToEat));
		let floorMade = 0;
		let makeChance = 30;

		let seedToMake = Math.max(1,floorToMake*seedPercent);

		map.traverse( (x,y) => {
			let tile = map.getTile(x,y);
			if( !isWall(tile) && !isUnknown(tile) ) {
				seedToMake--;
				floorMade++;
			}
		});

		let failReps = 100+seedToMake;
		while( seedToMake>0 && failReps>0) {
			let x,y;
			[x,y] = map.randPos(-3);
			if( isUnknown(map.getTile(x,y)) ) {
				map.setTile(x,y,T.FillFloor);
				--seedToMake;
				++floorMade;
			}
			else {
				--failReps;
			}
		}

		let reps = 50;
		let zoneList = [];

		function more() {
			if( !reps-- ) { return false; }
			if( floorMade < floorToMake ) { return true; }
			if( mustConnect ) {
				if( zoneList.length != 1 ) { return true; }
			}
			return false;
		}

		let bePersnicketyAboutFloorDensity = false;

		while( more.call(this) ) {
			floorMade += generateAmoebaChamber(map,T.FillFloor,makeChance,0);

			if( bePersnicketyAboutFloorDensity ) {
				let removeCount = 0;
				zoneList = map.floodAll();
				while( zoneList.length && zoneList[zoneList.length-1].count < floorMade-floorToMake ) {
					let zone = zoneList.pop();
					let count = map.zoneFlood(zone.x,zone.y,zone.zoneId,false,NO_ZONE,T.Unknown);
					if( count !== zone.count ) {
						debugger;
					}
					floorMade -= count;
					removeCount += 1;
				}
			}
		}
		// We no longer remove diagonal quads because it runs the risk of harming somebody's
		// carefully crafted place...
		//map.removeDiagnoalQuads();
		map.removeSingletonUnknowns();
		return this;
	}

	function overlapTest(map,x,y) {
		let tile = map.getTile(x,y);
		if( !isUnknown(tile) ) {
			return true;
		}
	}

	function weakFill(map,x,y) {
		let tile = map.getTile(x,y);
		if( !tile || isUnknown(tile) ) {
			map.setTile(x,y,T.FillFloor);
			return true;
		}
	}

	function locationPick(map,dims) {
		let x,y;
		[x,y] = map.randPos(1);
		let xLen = dims.xLenFn();
		let yLen = dims.yLenFn(xLen);
		x = Math.min(x,map.xLen-xLen);
		y = Math.min(y,map.yLen-yLen);
		return [x,y,xLen,yLen];
	}

	let ShapePalette = {};

	ShapePalette.circle = function(map,overlapChance,filler) {
		let xLenMaxDefault = Math.clamp(Math.floor(map.xLen/3.2),2,12);
		let xLenMax = Math.min(xLenMaxDefault,map.xLen-2);

		let x,y,xLen,yLen;
		[x,y,xLen,yLen] = locationPick(map, {
			xLenFn: () => Math.floor(Rand.intRange(2,xLenMax) / 2),
			yLenFn: (xLen) => xLen
		});
		let overlap = map.fillCircle(x,y,xLen+1,overlapTest);
		if( overlap && !Rand.chance100(overlapChance) ) return false;
		map.fillCircle(x,y,xLen,filler);
		return true;
	}

	ShapePalette.rect = function(map,overlapChance,filler) {
		let xLenMaxDefault = Math.clamp(Math.floor(map.xLen/3.2),2,12);
		let xLenMax = Math.min(xLenMaxDefault,map.xLen-2);

		let x,y,xLen,yLen;
		[x,y,xLen,yLen] = locationPick(map, {
			xLenFn: () => Math.floor(Rand.intRange(2,xLenMax)),
			yLenFn: (xLen) => Rand.intRange(Math.floor(Math.max(2,xLen/2)),Math.floor(Math.min(xLenMax,xLen*2)))
		});
		let overlap = map.fillRect(x-1,y-1,xLen+1,yLen+1,overlapTest);
		if( overlap && !Rand.chance100(overlapChance) ) return false;
		map.fillRect(x,y,xLen,yLen,filler);
		return true;
	}

	function makeRooms(map,percentToEat,guide,overlapChance) {

		percentToEat = Math.clamp(percentToEat||0,0.01,1.0);
		let floorToMake = Math.max(1,Math.ceil(map.area() * percentToEat));
		let floorMade = 0;

		map.traverse( (x,y) => {
			let tile = map.getTile(x,y);
			if( !isWall(tile) && !isUnknown(tile) ) {
				floorMade++;
			}
		});

		let xLenMaxDefault = Math.clamp(Math.floor(map.xLen/3.2),2,12);
		let xLenMax = Math.min(xLenMaxDefault,map.xLen-2);
		let reps = map.area();
		while( floorMade < floorToMake && --reps ) {
			let shapePicker = new Pick.Table().scanHash(ShapePalette,(X,shapeId)=>(guide.shapeChances[shapeId]||0));
			let shapeBuilder = shapePicker.pick();
			let made = shapeBuilder(map,overlapChance,weakFill);
			floorMade += made;
		}
	}

	function runImmediate(maker) {
		while( !maker.next().done ) {
		}
	}

	function runSlow(maker,callback) {
		function makeMore() {
			if( maker.next().done ) {
				return false;
			}
			callback(maker);
		}

		document.addEventListener( "keydown", makeMore, false );
		makeMore();
	}

	function paletteCommit(palette) {
		let tileTypes = ['floor','wall','door','fillFloor','fillWall','outlineWall','passageFloor','bridge'];
		for( let tileType of tileTypes ) {
			let TileType = String.capitalize(tileType);	// eg Floor
			console.assert( palette[tileType] );
			T[TileType] = TypeIdToSymbol[palette[tileType]] || T[TileType];
		}

		if( T.Floor == T.Wall || T.Floor == T.Unknown || T.Wall == T.Unknown || T.Door == T.Unknown ) {
			debugger;
		}

		if( !SymbolToType[T.PassageFloor].mayWalk || !SymbolToType[T.PassageFloor].isFloor ) {
			debugger;	// illegal. any fill floor must be marked isFloor and be walkable
		}
		if( !SymbolToType[T.FillFloor].mayWalk || !SymbolToType[T.FillFloor].isFloor ) {
			debugger;	// illegal. any fill floor must be marked isFloor and be walkable
		}
		if( SymbolToType[T.FillWall].mayWalk || !SymbolToType[T.FillWall].isWall ) {
		//	debugger;	// illegal. any fill wall must be marked isWall and be not walkable
		}
		if( SymbolToType[T.OutlineWall].mayWalk || !SymbolToType[T.OutlineWall].isWall ) {
		//	debugger;	// illegal. any fill wall must be marked isWall and be not walkable
		}
	}

	let architectureList = {
		'cave': {
			build: (map,guide) => makeAmoeba(map,guide.floorDensity,guide.seedPercent,guide.mustConnect)
		},
		'rooms': {
			build: (map,guide) => makeRooms(map,guide.floorDensity,guide,guide.overlapChance||20)
		}
	};

	class Mason {
		construct(theme,quota,injectList,siteList,onStep) {
			let drawZones = false;
			function render() {
				let s = map.renderToString(drawZones);
				onStep(s);
			}

			// Temporary just for easier masonry!
			TileTypeList.pit.mayWalk = false;

			paletteCommit( theme.palette );

			let mapOffset = { x: -1, y: -1 };	// this is merely a likely offset. The final sizeToExtent will really deal with it...
			let map = new MasonMap();
			map.setDimensions(theme.dim);

			let numPlaceTiles = Math.floor(map.xLen*map.yLen*theme.floorDensity*theme.placeDensity);
			positionPlaces(theme.depth,map,numPlaceTiles,quota,theme.rREQUIRED,theme.rarityHash,injectList,siteList,mapOffset);

			console.assert( architectureList[theme.architecture] );
			architectureList[theme.architecture].build(map,theme);

			map.assembleSites(siteList);
			map.connectAll(siteList,theme.passageWander,theme.preferDoors,theme.passageWdth2||0,theme.passageWidth3||0);
			map.removePointlessDoors();
			map.wallify(T.OutlineWall);
			map.sizeToExtentsWithBorder(injectList,siteList,1);
			map.convert(T.Unknown,T.FillWall);

			TileTypeList.pit.mayWalk = true;

			return map;
		}
	}

	return {
		Mason: Mason
	}

});
