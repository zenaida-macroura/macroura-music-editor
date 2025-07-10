/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

/*
 * This polyphonic approach to converting MIDI into MuSICA sequence data
 * follows a "round robbin" pattern.  Each successive note goes into
 * the next thread (thread least recently used last).
 */

// MuSICA uses 64th notes as the base.
var _SYSTEM_TICK = 64

// Container for sequence data while recording.
var recorder = {
	active: false,
	threads: [],
	curThread: undefined,
	prevTime: undefined,
	tempo: undefined,
	_step: undefined,
	diff: 0
}

// Request MIDI Access
navigator.requestMIDIAccess().then(requestMIDIAccessSuccess, requestMIDIAccessFailure)

function requestMIDIAccessSuccess(midi) {
   var inputs = midi.inputs.values()
   for (var input = inputs.next(); input && !input.done; input = inputs.next()) {
      console.log('midi input', input)
      input.value.onmidimessage = midiOnMIDImessage
   }
   midi.onstatechange = midiOnStateChange
}

function requestMIDIAccessFailure(midi) {
   console.error('No MIDI')
}

function midiOnStateChange(e) {
   console.log('State Change: ', e)
}

function midiOnMIDImessage(e) {
   if (!recorder.active) return
   const [command, key, velocity] = e.data

   if (command === 144) {
		// Note start
      writeNote(recorder.nextThread)
      recorder.threads[recorder.nextThread].curNote = key
		recorder.nextThread = ((recorder.nextThread + 1) % recorder.threads.length)
   } else if (command === 128) {
		// Note end
		var note_index = recorder.threads.map(x=>x.curNote).indexOf(key)
      if (note_index >= 0) {
         writeNote(note_index)
         recorder.threads[note_index].curNote = undefined
      }
   }
}

// Initialize the recorder object for requested polyphony and tempo
function startRecording(polyphony, tempo) {
	recorder.active = true
	recorder.threads.length = 0 // quick reset
	recorder._step = 60000 / tempo / (_SYSTEM_TICK / 4) // ms length of 64th note
	recorder.nextThread = 0
	recorder.diff = 0
	var _current_time = Date.now()

	// Create requested number of threads
	recorder.prevTime = _current_time
	for (var i = 0; i < polyphony; i++) {
		recorder.threads[i] = {
			session: 'mi0' + i + '=v15@1t' + tempo + '(',
			curNote: undefined,
			prevOctave: undefined,
			//prevTime: _current_time,
			//diff: 0
		}
	}
}

// Wrap up the sequences and put all of them in the `definitions` textarea.
function stopRecording() {
	recorder.active = false
	/*for (var i = 0; i < recorder.threads.length; i++) {
		writeNote(i)
	}*/writeNote(-1)
	var allSessions = recorder.threads.map(x=>x.session)
	definitions.value = allSessions.join(')\n\n')+')'
}

// Convert MIDI key number to an octave number and music note string.
function keyToOctaveAndLetter(key) {
   let letters = ['c', 'c#', 'd', 'd#', 'e', 'f', 'f#', 'g', 'g#', 'a', 'a#', 'b']
   if (key === undefined) return [undefined, 'r']
   return [Math.floor(key/12)/*-1*/,letters[key%12]]
}

// For all threads of polyphony, add the duration data given the amount of time
// that has passed.  For the thread indicated by focus_index, the note will be
// "ended" by breaking the glissando.
function writeNote(focus_index) {
	// Determine ticks forward in time since last call
	let now = Date.now()
	let remaining = Math.round((now - recorder.prevTime) / recorder._step)
	recorder.diff += ((now - recorder.prevTime) / recorder._step) - remaining
	console.log(remaining, recorder.diff, recorder.threads.length)

	// Go through all of the threads
	for (var index = 0; index < recorder.threads.length; index++) {
		// Don't overwrite the remaining variable!
		// I can't figure out how to rewrite the code yoinked from the
		// monophonic MIDI sequencer, so we'll just use this variable instead
		// to preserve the original value between loops.
		let iter_remaining = remaining

		// convert the midi key number to octave and note string
   	let [octave, letter] = keyToOctaveAndLetter(recorder.threads[index].curNote)

		// Portion of the sequence for this time tick
   	let stringy = ''

		// Insert the octave change instruction if different from last octave
		// the midi key number conversion function returns an undefined
		// octave, so if the letter is 'r', skip this.
   	if ((octave !== recorder.threads[index].prevOctave) && letter !== 'r') {
      	stringy += 'o' + octave
   		recorder.threads[index].prevOctave = octave
   	}
	
		// Loop going from a whole note down to a 64th note.
		for (var i = _SYSTEM_TICK; i >= 1; i/=2) {
			var j = 0;
			// Catch up for diff
			if (i == 1) {
				// Just adjust j for now, diff decrement is deferred until after all threads
				if (recorder.diff > 1) {
					j = -1
				} else if (recorder.diff < 1) {
					j = 1
				}
			}
	
			// This is the part that uses `iter_remaining`.
			// TODO: Figure out how to rewrite this so that we don't have to
			// use remaining as a frame of reference through another variable.
			for (; j < Math.floor(iter_remaining/i); j++) {
				stringy += letter + (_SYSTEM_TICK / i)
			}
			iter_remaining = iter_remaining % i
		}

		// If this index is the focus_index, end the note by breaking the gliss
		if (index === focus_index) {
			stringy += ')('
		}

		// Add this data to the sequence of the thread
		recorder.threads[index].session += stringy
	}
	
	// deferred increment and decrement
	if (recorder.diff > 1) {
		recorder.diff -= 1
	} else if (recorder.diff < 1) {
		recorder.diff += 1
	}

	// Advance the tick
	recorder.prevTime = now
}
