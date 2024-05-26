/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

// Standard Basic Rhythm Measures
const standard_beats = {
	'Rock': {
		'br01':'bh8h8sh8h8 bh8h8sh8h8',
		'br02':'bh8h8sh8h8 bh8bh8sh8h8',
		'br03':'bh8bh8sh8h8 bh8h8sh8h8',
		'br04':'bh8bh8sh8h8 bh8bh8sh8h8',
		'br05':'bh8h8sh8h8 bh8bh8sh8bh8',
		'br06':'bh8bh8sh8h8 bh8h8sh8bh8',
		'br07':'bh8bh8sh8h8 bh8bh8sh8bh8',
		'br08':'bh8h8sh8bh8 bh8h8sh8h8',
		'br09':'bh8h8sh8bh8 bh8bh8sh8h8',
		'br10':'bh8bh8sh8bh8 bh8bh8sh8h8',
		'br11':'bh8bh8sh8bh8 bh8bh8sh8bh8',
		'br12':'bh8h8sh8bh8 h8bh8sh8h8',
		'br13':'bh8bh8sh8bh8 h8bh8sh8h8',
		'br14':'bh8bh8sh8bh8 h8bh8sh8bh8'
	},
	'Disco': {
		'ddb1':'bh8h8bsh8h8 bh8h8bsh8h8',
		'ddb3':'b8h8bs8h8 b8h8bs8h8'
	},
	'Four Bass Notes': {
		'fof1':'bh4bsh4bh4bsh4',
		'fof2':'bh8h8bsh8h8 bh8h8bsh8h8',
		'fof3':'bh4bsh8h8 bh4bsh8h8',
		'fof4':'bh8h8bsh4 bh8h8bsh4',
		'fof5':'bh4bsh8s8bh4bsh8s8'
	},
	'Bossa Nova': {
		'bno1':'bsh8h8ch8bsh8 bh8h8csh8bh8 bh8h8csh8bh8 bsh8h8ch8bh8'
	},
	'Grooves': {
		'fed1':'b8b8s4b8b8s4',
		'fed2':'b4h4s5h5',
		'fed3':'b8h8s8h8 b8h8s8h8',
		'fed4':'bm8m8ms8m8 bm8m8ms8m8',
		'fed5':'bh16h16h16h16 s16h16h16h16 bh16h16h16h16 s16h16h16h16',
		'fed6':'bh16h16h16h16 sh16h16h16h16 bh16h16h16h16 sh16h16h16h16'
	},
	'Triplets': {
		'etd4':'bh12h12h12 sh12h12sh12 bh12h12h12 sh12h12h12',
		'etd5':'bh12h12h12 sh12h12sh12 bh12h12h12 sh12h12sh12',
		'etd7':'bh12h12h12 sh12h12h12 bh12bh12bh12 sh12h12h12',
		'etd8':'bh12bh12bh12 sh12h12h12 bh12h12h12 sh12h12h12',
		'etd9':'bh12bh12bh12 sh12h12sh12 bh12h12h12 sh12h12sh12'
	},
	'Blues': {
		'bbb1':'bh12h12h12 sh12h12h12 bh12h12h12 sh12h12h12',
		'bbb2':'bh12h12bh12 sh12h12h12 bh12h12h12 sh12h12h12',
		'bbb3':'bh12h12bh12 sh12h12h12 bh12h12bh12 sh12h12h12',
		'bbb4':'bh12h12bh12 sh12h12sh12 bh12h12bh12 sh12h12h12',
		'bbb5':'bh12h12bh12 sh12h12sh12 bh12h12bh12 sh12h12sh12',
		'bbs1':'bh12r12h12 sh12r12h12 bh12r12h12 sh12r12h12',
		'bbs2':'bh12r12bh12 sh12r12h12 bh12r12bh12 sh12r12h12'
	},
	'Samba': {
		'sbd1': 'bh16h16h16bh16 bh16h16h16bh16 bh16h16h16bh16 bh16h16h16bh16',
		'sbd2': 'bh16h16ch16bh16 bh16h16ch16bh16 bh16h16ch16bh16 bh16h16ch16bh16'
	}
}

// Initialize the UI
let resultant = '';
for (let genre in standard_beats) {
	resultant += ';== ' + genre + ' ==\n';
	for (let label in standard_beats[genre]) {
		resultant += label + '=' + standard_beats[genre][label] + '\n';
	}
}
outbeats.value = resultant;
