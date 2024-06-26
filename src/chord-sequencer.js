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

// Process a file, converting blocks with chords into multiple blocks, and setting FM3-FM6 from FMC.
function processMMLFileForChords(file_contents) {
	let blocks_labels_with_chords = [];

	// Split file into blocks
	let block_arr = file_contents.split('\n');
	let i = 1;
	while (i < block_arr.length) {
		if (block_arr[i].indexOf('=') == -1) {
			block_arr[i - 1] += '\n' + block_arr[i];
			block_arr.splice(i, 1);
		} else {
			i++;
		}
	}

	// Process each block, if contains chords split and note label in blocks_labels_with_chords, drop defs into file
	for (i = 0; i < block_arr.length; i++) {
		let out = convertBlockToChords(block_arr[i]);

		// One in, one out means no chords, skip
		if (out.length == 1) continue;

		// note label
		blocks_labels_with_chords.push(block_arr[i].split('=')[0]);

		// Splice the new blocks in place of the old one
		block_arr.splice(i, 1, ...out);

		// Increment by the added blocks, keeping in mind that we're about to increment by one anyways.
		i += (out.length - 1);
	}

	// Check if we have any converted blocks; if not, return as is
	if (blocks_labels_with_chords.length == 0) return block_arr.join('\n');

	// Process FMC
	let fmc_index = block_arr.findIndex(ele => ele.indexOf('FMC =') != -1);

	// Check if FMC even exists
	if (fmc_index == -1) return block_arr.join('\n');

	let fm3_index = block_arr.findIndex(ele => ele.indexOf('FM3 =') != -1);
	let fm4_index = block_arr.findIndex(ele => ele.indexOf('FM4 =') != -1);
	let fm5_index = block_arr.findIndex(ele => ele.indexOf('FM5 =') != -1);
	let fm6_index = block_arr.findIndex(ele => ele.indexOf('FM6 =') != -1);

	// Neutralize FMC in file output
	block_arr[fmc_index] = ';' + block_arr[fmc_index];

	// Check to see if we're going to be overwriting anything
	if ((block_arr[fm3_index].split('=')[1].length > 1) || (block_arr[fm4_index].split('=')[1].length > 1) || (block_arr[fm5_index].split('=')[1].length > 1) || (block_arr[fm6_index].split('=')[1].length > 1)) {
		console.error('Block chord definition would overwrite FM3-FM6, which is already defined.');
		alert('Block chord definition would overwrite FM3-FM6, which is already defined.');
		// Return without overwriting
		return block_arr.join('\n');
	}

	// Alright, let's split the defs
	let indices = [fm3_index, fm4_index, fm5_index, fm6_index];
	for (i = 0; i < 4; i++) {
		block_arr[indices[i]] += block_arr[fmc_index].split('=')[1];
		for (let j = 0; j < blocks_labels_with_chords.length; j++) {
			block_arr[indices[i]] = block_arr[indices[i]].replaceAll(blocks_labels_with_chords[j], blocks_labels_with_chords[j].slice(0, -1) + (i + 1));
		}
	}
	return block_arr.join('\n');
}
