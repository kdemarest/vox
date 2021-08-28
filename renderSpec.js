
/*
BLOCKS

COORDINATES
I think that I want "north" to be along positive x, and "up" to be along positive y,
but please advise if this is mistaken.

ORIENTATION
By convention, the "front" of a block points north when the block exists with rotation=0.
The left, right and back are all positioned on the block as if it were a person facing north.
The "top" texture draws such that the bottom row of pixels
on the texture is on the north side of the block. The "bottom" texture draws the same way.
The front, back, left and right textures all draw such that their bottom row of pixels
draw at the bottom of the block.

SELF-ILLUMINATION
Any of the self-illuminated textures (prefixed with "si") below might be null. If
present, lighting is not applied to the si texture, and it is drawn "on top of" the
cooresponding main texture.

TRANSPARENCY
It appears to me that transparency in webGL is a very tricky issue, so please advise
if what I am requesting can not work. What I hope for is:
All block textures allow the alpha channel to be below 0.1, in which case that part of the
texture is drawn clear.

ROTATIONS
By default, 0 degrees means pointing north, and there are 360 degrees going clockwise.

LIGHTING
This rendered does not do lighting like WebGL usually does.
Instead, each block will tell
its light level from 0 to 99. Any adjacent block face pointing towards that block will
render at the block's light level. Any Flat (see below) will render at the light level
of the block they are standing in. To be clear:
* You don't have to calculate illumination. I will pass it to you per block.
* I don't expect smooth lighting.
*/

class BlockType {
	top:		texture on block top,
	bottom:		texture on block bottom,
	left:		texture on block left side,
	right:		texture on block right side,
	front:		texture on the front side,
	back:		texture on the back side
	siTop:		self-illuminated texture,
	siBottom:	self-illuminated texture,
	siLeft:		self-illuminated texture,
	siRight:	self-illuminated texture,
	siFront:	self-illuminated texture,
	siBack:		self-illuminated texture,
}

class Block {
	blockType:		a blockType instamce,
	rotation:		0 (north), 90 (west), 180 (south), or 270 (east),
	lightLevel:		0 (fully dark) to 99 (fully lit),
}

/*
FLATS
Flat textures are simply a two polygon rectangular object with a
texture map drawn upon it.

ORIENTATION
By default, these are vertical textures rotated about the y axis (vertical like a wall).
However, if isHorizontal the texture is drawn flat (horizontal like a floor or ceiling)

ANCHOR
All Flats are anchored in the center of the (x,z) plane, with a y equal to
the bottom of the cube they're in, eg the floor. However, if yOffset is not
null, then the Flat should be floating point offset along the y coordinate,
from 0 (anchor at bottom meaning the Flat draws as in the default)
to 1 (anchor at top, meaning the Flat texture draws LOWER).
*/
class Flat {
	x:				the floating point world x position of this flat
	y:				the floating point world y position of this flat
	z:				the floating point world z position of this flat
	texture:		a texture map,
	rotation:		the yaw from 0 to 360 where 0 means the 'front' of the texture points north.
	scale:			from 0 to 1 or more. Whatever the scale, the anchor point must remain correct.
	yOffset:		from 0 to 1, as described above
}

class uiImage {
	x:				A float from 0.0 (screen left) to 1.0 (screen right)
	y:				A float from 0.0 (screen top) to 1.0 (screen bottom)
	texture:		Any rectangular texture map
	width:
}

/*
Here is the call I would like to make to your code causing it to set up
the render
*/
function getBlockInfo(xWorld,yWorld,zWorld) {
	return block[whatever]; // an instance of my Block class appropriate to that world location
}

function getFlatList(xWorld,yWorld,zWorld) {
	return flatList; // an array of Flat objects
}

class Camera {
	xWorld,
	yWorld,
	zWorld,
	yaw,		// Yaw is always applied first, then pitch
	pitch,
	fieldOfView
}

// Here is my call to your function.
YourRenderer.setupRender( camera, getBlockInfo, getFlatList );

/*
OPTIMIZATION




*/
