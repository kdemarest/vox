


Room Path
There are multiple layers.
AreaTheme - tells how many rooms/paths, and how they connect; specifies recipes, paint jobs, etc
Driver - tells what will be made next. Use this to make "cluster of 3 rooms" or "passage 
   that leaves and returns to same room at a different level" type stuff.
RoomMaker - everything below, uses recipes


let RoomPathRecipe = {};

PathRecipe.finishRoom = () => {
	// Here is all the standard stuff every room has. All of this
	// depends heavily on the Theme.
	this
		.membrane(tight/loose/varying)
		.roof(flat/peaked/arched/rounded/rough)
		.cornerSpurs()	// ahead before, and behind after each turn.
		.teeSpurs()
		.bloat()		// Expands around path to the edges; higher doesn't overshadow lower
		.bloatDecor()	// See BLOAT DECOR
		.interiorLiners()	// repeating interior stubs
		.exteriorLiners()	// repeating exterior stubs
		.stubs()
		.balconies()
		.lighting()
		.decoration()
		.items()
		.monsters()
	;
}

RoomPathRecipe.PaperclipRight = ()=>{

	let pr = new PathRecipe();
	let a = Rand.intRange(0,5);
	let b = Rand.intRange(0,5);

	pr
		.stairRangeBegin()
		.forward(3+a)
		.left()
		.forward(1+b)
		.left()
		.forward(2+rand(0,Math.min(0,a-1)))
		.stairRangeEnd()
		.stairChoose('up')
		.left()
		.forward(2+b+rand(0,3))
		.makeExit()
		.finishRoom()
	;

	return pr;
}

RoomPathRecipe.PaperclipLeft = // as above by L/R reversed

RoomPathRecipe.ClimaxRoom = () => {
	let dist = 5+Rand.intRange(0,3)*2;
	let width = dist+Rand.intRange(-1,1)*2;
	pr
		.defineEdges(dist,width)
		.forward(dist)
		.bloat(LR,Math.floor(width/2))
		.membrane(tight/loose)
		.bloatDecor( columns, water pool, pit, risers in corners, etc)
		.addRiser(dist-2,0,radius) // for badguy
		.monsterAddSpawner(dist-2,0,'bigBadguy')
		.turn(L/R/S)
		.forwardToEdge()
		.makeExit()
		.finishRoom()
}

RoomPathRecipe.BigBranch = () => {
	let dist = 5+Rand.intRange(0,3)*2;
	let width = dist+Rand.intRange(-1,1)*2;
	pr
		.defineEdges(dist,width)
		.forward(dist/2)
		.spurLeft(toEdge,mayRise/Fall)
		.makeExit()
		.spurRight(toEdge,mayRise/Fall)
		.makeExit()
		.forward(toEdge, mayRise/Fall)
		.makeExit()
		.bloat(Math.floor(width/2))
		.membrane(tight/loose)
		.decorateBloat( columns, water pool, pit, risers in corners, etc)
		.turn(L/R/S)
		.forwardToEdge()
		.makeExit()
		.finishRoom()
	let key = pr.pickExit().lockMe();
	keyList.push( key, criteria = before exit 0 ) maybe the key "knows" 
}

RoomPathRecipe.FloodedRoom
RoomPathRecipe.Amphitheater
RoomPathRecipe.SpiralDown // cling to walls and descend. Real exit might be anywhere
RPR.PitMaze
RPR.Maze
RPR.JailCellHall
RPR.SwingingBladeHall
RPR.CellsWithKeylockDoors












