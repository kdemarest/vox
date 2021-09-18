Module.add('dataSeed',function(extern) {


let SeedData = {};

let SeedDataDefaults = {
	zTall: 5,
	zDeep: 0,
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
# d d ds#
# . . . #
# . . . #
# . . . #
    .
`,
	isStub: true,
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
      . .
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
      .
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
          . . 
`,
	isStub: true
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
}


return {
	SeedData: SeedData,
	SeedDataDefaults: SeedDataDefaults,
}

});
