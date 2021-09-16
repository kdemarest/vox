Module.add('roller',function() {

	let Rand = Random.Pseudo;

	let Roller = {};
	Roller.ChanceTo = class {
		constructor(chance100) {
			this.chance100 = chance100;
		}
		test() {
			return Rand.chance100(this.chance100);
		}
	}

	Roller.Range = class {
		constructor(rMin,rMax,curve='intRange',offset=0,stride=1) {
			console.assert( Rand[curve] );
			if( curve=='intRange' || curve=='intBell' ) {
				console.assert( Number.isInteger(rMin) && Number.isInteger(rMax) );
				console.assert( Number.isInteger(offset) && Number.isInteger(stride) );
			}
			console.assert( rMin<=rMax );
			this.rMin = rMin;
			this.rMax = rMax;
			this.curve = curve;
			this.offset = offset;
			this.stride = stride;
		}
		get min() {
			return this.offset+this.rMin*this.stride;
		}
		get max() {
			return this.offset+this.rMax*this.stride;
		}
		roll() {
			return this.offset+Rand[this.curve](this.rMin,this.rMax)*this.stride;
		}
	}

	Roller.Often = class {
		constructor(chance100,value,otherRoller) {
			this.chance100 = chance100;
			this.value = value;
			this.otherRoller = otherRoller;
		}
		roll() {
			return Rand.chance100(this.chance100) ? this.value : this.otherRoller.roll();
		}
	}

	return {
		Roller: Roller
	}
});
