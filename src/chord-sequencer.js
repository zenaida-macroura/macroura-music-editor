/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

// Let's start with the constants
const chromatic_scale =   ['c', 'c#', 'd', 'd#', 'e', 'f', 'f#', 'g', 'g#', 'a', 'a#', 'b'];
const _chromatic_s_flat = ['c', 'd-', 'd', 'e-', 'e', 'f', 'g-', 'g', 'a-', 'a', 'b-', 'b'];
const scale_identifiers = ['o', 'p',  'q', 'r',  's', 't', 'u',  'v', 'w',  'x', 'y',  'z'];
const sequence_degrees =  ['1', 'u',  '2', 'm',  '3', '4', '-',  '5', '+',  '6', 's',  '7',
                           '8', 'n',  '9', 't',  'a', 'b', 'w',  'c', 'r',  'd'];
const octave = 12;

// Take in a label string (of any length) and convert it into an array of the notes making up the chord.
// Future proofing against our current four note / tetrad limitation.
function convertLabelToNoteArray(label_str) {
	let label = Array.from(label_str);
	let inversion = false;
	let spellout = false;
	
	// Check to see if this chord should be interpreted as a literal inversion.
	// (That is, it should not be inverted to fit within an octave.)
	if (label[0] === ':') {
		inversion = true;
		label.shift();
	}

	// Check to see if this chord should be interpreted as a literal spellout.
	// (That is, each note is specified directly, do not use sequence degrees.)
	if (label[0] === '$') {
		spellout = true;
		label.shift();
	}
	
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
		if (spellout && (label[1] === '+')) {
			// You wouldn't want to get into the habit of using this sharp, but I'll support it for now.
			scale_offset += 1
		}
		if (spellout && (label[1] === '-')) {
			scale_offset -= 1
		}
	}


	// If spellout, calculate sequence degrees
	if (spellout) {
		// First, move the # and - to the notes they follow
		var spell = [0]; // We want this hoisted, so no `let`.
		let octave_adjustment = 0;
		for (let i = 1; i < label.length; i++) {
			// We'll deal with these in the look ahead
			if ((label[i] == '#') || (label[i] == '-') || (label[i] == '+')) {
				// but if they do exist after the look ahead, remove them - it's likely a syntax error
				label.splice(i,1);
				i--;
				continue;
			}

			let note_offset = chromatic_scale.indexOf(label[i]);
			if (note_offset >= 0) {
			
				// look ahead
				if ((i + 1) < label.length) {
					if (label[i+1] == '-') {
						note_offset -= 1;
						label.splice(i+1,1); // remove it
					} else if ((label[i+1] == '#') || (label[i+1] == '+')) {
						note_offset += 1;
						label.splice(i+1,1); // remove it
					}
				}

				// Apply the proper scale offset
				note_offset -= scale_offset;

				// hop the necessary octaves if inversion
				for (;(note_offset < spell[spell.length - 1]) && inversion;note_offset += octave){}

				// add octave_adjustment if inversion, then push regardless
				spell.push(note_offset + (inversion ? octave_adjustment : 0));
				octave_adjustment = 0;
				continue
			} else if (label[i] == '>') {
				octave_adjustment = +octave;
				label.splice(i,1);
				i--;
			} else if (label[i] == 'r') {
				// just mirror the existing offset
				spell.push(spell[spell.length - 1])
				label[i] = '0' // make it compatible with the following for loop which expects 0, not r, for rests.
			} else {
				console.warn('Unexpected character `' + label[i] + '` in chord spellout.') 
				label.splice(i,1);
				i--;
			}
		}
	}
	
	// Then, iterate through the specified scale degrees, converting them to notes.
	let notes = [[chromatic_scale[(scale_offset)%octave],'']];
	for (let i = 1; i < label.length; i++) {
		let note_offset = (spellout ? spell[i] : sequence_degrees.indexOf(label[i]));
		// Remember that 'r' is a sequence degree, so rests are 0's here.
		if (label[i] === '0') {
			notes.push(['r','']);
			continue;
		}
		if (note_offset === -1) {
			console.warn('Note specification at position ' + i + ' in chord ' + label + ' is invalid.');
			continue;
		}
		let scale_hops = Math.floor((scale_offset + note_offset)/octave);
		// TODO: if '<' added for literal spellout, this'll have to be rewritten.
		notes.push([''.padEnd(inversion ? scale_hops : 0, '>') + chromatic_scale[(scale_offset + note_offset)%octave], ''.padEnd(inversion ? scale_hops : 0, '<')]);
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

		// Fill implied 0's (rests).
		notes = notes.concat(Array(4 - notes.length).fill(['r','']));

		// glob the duration
		let [duration] = before_and_after[1].match(/[0-9]*\.*/)
		let after = before_and_after[1].substr(duration.length)

		// for each note, add it to the corresponding output block, then the things following
		for (let n = 0; n < 4/*notes.length*/; n++) {
			blocks[n] += notes[n][0] + duration + notes[n][1] + after;
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

	// Test for FMC or FMT to see if we need to process them.
	let fmc_index = block_arr.findIndex(ele => ((ele.indexOf('FMC =') != -1) && (ele.indexOf(';FMC =') == -1)));
	let fmt_index = block_arr.findIndex(ele => ((ele.indexOf('FMT =') != -1) && (ele.indexOf(';FMT =') == -1)));

	// Neutralize FMC and/or FMT in file output
	if (fmc_index != -1) block_arr[fmc_index] = ';' + block_arr[fmc_index];
	if (fmt_index != -1) block_arr[fmt_index] = ';' + block_arr[fmt_index];

	// Check if we have any converted blocks; if not, return as is
	if (blocks_labels_with_chords.length == 0) return block_arr.join('\n');

	// Check if FMC or FMT are empty entries
	// TODO: EDGE CASE: We likely used `> 1` for length checks due to CR/LF 13/10 in Windows.
	// 	However, that means the definition `FMC =a` would be skipped, even if label a did exist.
	// 	So, For here we'll use `< 1` with the knowledge that if 13/10 does cause problems then we can identify the real issue.
	if (fmc_index != -1 && block_arr[fmc_index].split('=')[1].length < 1) fmc_index = -1;
	if (fmt_index != -1 && block_arr[fmt_index].split('=')[1].length < 1) fmt_index = -1;

	// If neither FMC nor FMT exist, or they exist but are empty, then no additional processing is required
	if (fmc_index == -1 && fmt_index == -1) return block_arr.join('\n');

	let fm3_index = block_arr.findIndex(ele => ele.indexOf('FM3 =') != -1);
	let fm4_index = block_arr.findIndex(ele => ele.indexOf('FM4 =') != -1);
	let fm5_index = block_arr.findIndex(ele => ele.indexOf('FM5 =') != -1);
	let fm6_index = block_arr.findIndex(ele => ele.indexOf('FM6 =') != -1);

	// Display warning noting that FMC takes precendence over FMT
	if ((fmc_index != -1) && (fmt_index != -1)) {
		console.warn('FMC takes precedence over FMT');
	}

	// Check to see if we're going to be overwriting anything
	// Change made 2024-12-29: FM3 only relevant for FMC, so added FMC index check ANDed with fm3_index check)
	if (((fmc_index != -1) && (block_arr[fm3_index].split('=')[1].length > 1)) || (block_arr[fm4_index].split('=')[1].length > 1) || (block_arr[fm5_index].split('=')[1].length > 1) || (block_arr[fm6_index].split('=')[1].length > 1)) {
		let error_string = 'Block chord definition would overwrite FM' + ((fmc_index != -1)? '3' : '4')+ '-FM6, which is already defined.';
		console.error(error_string);
		alert(error_string);
		// Return without overwriting
		return block_arr.join('\n');
	}

	// Alright, let's split the defs
	let indices = [fm4_index, fm5_index, fm6_index];
	let block_to_poll_index = fmt_index; // Starting with FMT as default/base case.
	if (fmc_index != -1) {
		// Account for FMC overwriting FM3
		indices.unshift(fm3_index);
		// Switch to FMC
		block_to_poll_index = fmc_index
	}
	for (i = 0; i < 4; i++) {
		block_arr[indices[i]] += block_arr[block_to_poll_index].split('=')[1];
		for (let j = 0; j < blocks_labels_with_chords.length; j++) {
			block_arr[indices[i]] = block_arr[indices[i]].replaceAll(
				blocks_labels_with_chords[j],
				blocks_labels_with_chords[j].slice(0, 3) + (i + 1)
			);
		}
	}
	return block_arr.join('\n');
}
