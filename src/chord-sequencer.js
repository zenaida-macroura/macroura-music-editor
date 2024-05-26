/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

// Let's start with the constants
const chromatic_scale =   ['c', 'c#', 'd', 'd#', 'e', 'f', 'f#', 'g', 'g#', 'a', 'a#', 'b'];
const scale_identifiers = ['o', 'p',  'q', 'r',  's', 't', 'u',  'v', 'w',  'x', 'y',  'z'];
const sequence_degrees =  ['1', 'u',  '2', 'm',  '3', '4', '-',  '5', '+',  '6', 's',  '7',
                           '8', 'n',  '9', 't',  'a', 'b', 'w',  'c', 'r',  'd'];
const octave = 12;

// Take in a label string (of any length) and convert it into an array of the notes making up the chord.
// Future proofing against our current four note / tetrad limitation.
function convertLabelToNoteArray(label) {
	// First, shift the chromatic scale so that it starts with the right note.
	let scale_offset = scale_identifiers.indexOf(label[0]);
	if (scale_offset === -1) {
		// Try the chromatic scale labels
		scale_offset = chromatic_scale.indexOf(label[0]);
	
		if (scale_offset === -1) {
			// Still invalid, exit out
			console.error('Start of chord label invalid for ' + label);
			return [];
		}

		if (label[1] === '#') {
			scale_offset += 1
		}
	}
	// Then, iterate through the specified scale degrees, converting them to notes.
	let notes = [chromatic_scale[(scale_offset)%octave]];
	for (let i = 1; i < label.length; i++) {
		let note_offset = sequence_degrees.indexOf(label[i]);
		if (label[i] === '0') {
			notes.push('r');
			continue;
		}
		if (note_offset === -1) {
			console.warn('Note specification at position ' + i + ' in chord ' + label + ' is invalid.');
			continue;
		}
		notes.push(chromatic_scale[(scale_offset + note_offset)%octave]);
	}
	return notes;
}

// Process a block definition which contains chord labels
function convertBlockToChords(block_definition) {
	// Split into an array on chord label start
	let chords = block_definition.split('[');
	if (chords.length === 1) {
		// no chords
		return [block_definition];
	}
	// Get the block label, split it into four labels
	let prelude = chords[0].split('=');
	let blocks = [];
	for (let b = 1; b <= 4; b++) {
		blocks.push(prelude[0].substr(0,3) + b + '=' + prelude[1]);
	}
	// Iterate through the chords
	for (let c = 1; c < chords.length; c++) {
		// Separate the chord label from anything following it; get the notes from the label
		let before_and_after = chords[c].split(']');
		let notes = convertLabelToNoteArray(before_and_after[0]);
		// for each note, add it to the corresponding output block, then the things following
		for (let n = 0; n < 4/*notes.length*/; n++) {
			blocks[n] += notes[n] + before_and_after[1];
		}
	}
	return blocks;
}
