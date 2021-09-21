Module.add('dataSeed',function(extern) {


let SeedData = {};

let SeedDataDefaults = {
	zTall: 5,
	zDeep: 0,
	zDoor: 2,
	zFluid: -1,
}

SeedData.CANDLE_NICHE = {
	textMap:
`
# # #
# d*# 
# d # 
`,
	hasRoof: false,
	zTall: 2,
	isStub: true,
	symmetric: true,
}

SeedData.SMALL_CHAMBER = {
	textMap:
`
# # # # #
# s s ss#
# . . . #
# . . . #
# . . . #
    +
`,
	isStub: true,
	zShelfTop: 1,
}

SeedData.RAISED_CENTER = {
	textMap:
`
# # # # # #
# . . . . #
# . , , . #
# . , , . #
# .r. . .r#
    . .
    + +
`,
	isStub: true,
	zShelfTop: 1,
}

SeedData.TUNNEL_CHAMBER = {
	textMap:
`
# # # # #
# . . . #
# . . .r#
# . . . #
# t # # #
# t #
  t
`,
	isStub: true,
}

SeedData.SHAFT_SM = {
	textMap:
`
# # # #
# p p #
  pfp
`,
	isStub: true,
	zDeep: -7,
}

SeedData.SHAFT_MD = {
	textMap:
`
# # # # #
# p p p #
# p prp #
  p p p
`,
	isStub: true,
	zDeep: -7,
}

SeedData.POOL_MD = {
	textMap:
`
# # # # #
# w w w #
# w wrw #
  w w w
`,
	isStub: true,
}

SeedData.POOL_LG = {
	textMap:
`
    # # # #
  # w w w w #
# w w w w w w #
# w w wrw w w #
# w w w w w w #
# w w w w w w #
  # w w w w #
      .
`,
	isStub: true,
	zDeep: -4,
	zTall: 3,
}

SeedData.COOL_DRINK = {
	textMap:
`
# # # # #
# d d d #
# d wrd #
  d d d
`,
	isStub: true,
	zFluid: 0,
}


SeedData.SHAFT_LG = {
	textMap:
`
# # # # # # #
# p p p p p #
# p p p p p #
# p p prp p #
# p p p p p #
# p p pfp p #
`,
	isStub: true,
	zDeep: -7,
}

SeedData.SHAFT_ISLAND = {
	textMap:
`
# # # # # # #
# p p p p p #
# p . .r. p #
# p . . . p #
# p p . p p #
  p p . p p
`,
	isStub: true,
	zDeep: -7,
}

SeedData.READING_ROOM = {
	textMap:
`
# # # # # # #
# s s s s s #
# s . . . s #
# s .r. .rs #
# s . . . s #
# s . . . s #
      +
`,
	isStub: true,
	zTall: 5,
	zShelfTop: 4,
}

SeedData.PIT_ALCOVE = {
	textMap:
`
# # # # #
# . . . #
# p . p #
  p p p
`,
	isStub: true,
	zDeep: -5,
}

SeedData.PIT_PATH = {
	textMap:
`
# # # # # # # # #
# . . . . . . #*#
# . p p p . . # #
# . p p p p pt#
# . p p p p p #
# . p p p p p #
# . . . . p p #
# # # . . # # #
      + +
`,
	isStub: true,
	zDeep: -5,
}

SeedData.PIT_RIMMED = {
	textMap:
`
# # # # # # #
# .r. . . .r#
# . p p p . #
# . p p p . #
# . p p p . #
# . p p p . #
# . . . . . #
# # # . # # #
      +
`,
	isStub: true,
	zDeep: -3,
}

SeedData.COLUMNS_AND_THRONE = {
	textMap:
`
        #     #
# # # # #3# # #3# # # #
# . . . . s s . . . . #
# . . . . s s . . . . #
# . . O . d d . O . . #
# . . . . . . . . . . #
# . . . . . . . . . . #
# . . O .2. . .2O . . #
# . . . . . . . . . . #
# . . . . . . . . . . #
# . . O .2. . .2O . . #
# . . . . . . . . . . #
# . . . . . . . . . . #
          + + 
`,
	isStub: true,
	zDoor: 4,
}

SeedData.TUNNEL_UTURN = {
	textMap:
`
    # # #
# # # #f# # #
# t t t t t #
# t # t # t #
# t # # # t #
  t       t
`,
	isStub: true
}

SeedData.UNDER_SHELF = {
	textMap:
`
# # # # #
# t t t #
# t t t #
  t t t
`,
	isStub: true
}

SeedData.SYM_PIT = {
	textMap:
`
# # # # # # # # #
# p p p prp p p #
  p p p p p p p 
`,
	isStub: true,
	zDeep: -5,
	symmetric: true,
}


SeedData.WALL_TABLE = {
	textMap:
`
  #
# #*#
d d d
`,
	isStub: true,
	symmetric: true,
	zTall: 3,
}

SeedData.ATTIC = {
	textMap:
`
      # # #
# # # # #6# #
# 5 5 5 5 5 # #
# 4 5 5 5 5 #2#
# 3 5 5 5 5 # #
# 2 1 . . . #
# # # . . . #
`,
	isStub: true,
	zTall: 9,
	hollowBelow: true,
}

SeedData.BASEMENT = {
	textMap:
`
  # # # # # # # #
  # 1 1 1 2 3 3 #
  # 1 1 1 2 3 3 #
# 2s1 1 1 1 4 4 #
  # 1 1 1 1 5 5 #
  # # w # # + + #
`,
	isStub: true,
	zDeep: -4,
	hollowBelow: true,
	altitudeShift: -5,
}

SeedData.BALCONY = {
	textMap:
`
      #
# # # 44# #
# . 1 2 3 #
# t 3 3 3 #
# t 3 3 3 #
`,
	isStub: true,
	zTall: 5,
}

SeedData.MURDER_HOLE = {
	textMap:
`
      #
# # # 11# # #
# . . . . . #
# . . . . . #
# ^ # ^ # ^ #
`,
	isStub: true,
	palette: {
		bWindow: 'AIR'
	}
}

SeedData.TEST = {
	textMap:
`
# # # # # #
# s s . o #
# p p = p #
# , p = p #
# , p = p #
`,
	isStub: true,
	zTall: 5,
	zDeep: -3,
}



return {
	SeedData: SeedData,
	SeedDataDefaults: SeedDataDefaults,
}

});
