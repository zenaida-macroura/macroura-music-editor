/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

// Round-robin style recording

navigator.requestMIDIAccess().then(requestMIDIAccessSuccess, requestMIDIAccessFailure)

var _SYSTEM_TICK = 64

var recorder = {
	active: false,
	threads: [],
	curThread: undefined,
	prevTime: undefined,
	tempo: undefined,
	_step: undefined,
	diff: 0
}

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

function startRecording(polyphony, tempo) {
	recorder.active = true
	recorder.threads.length = 0 // quick reset
	recorder._step = 60000 / tempo / (_SYSTEM_TICK / 4) // ms length of 64th note
	recorder.nextThread = 0
	recorder.diff = 0
	var _current_time = Date.now()
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

function stopRecording() {
	recorder.active = false
	/*for (var i = 0; i < recorder.threads.length; i++) {
		writeNote(i)
	}*/writeNote(-1)
	var allSessions = recorder.threads.map(x=>x.session)
	definitions.value = allSessions.join(')\n\n')+')'
}

function keyToOctaveAndLetter(key) {
   let letters = ['c', 'c#', 'd', 'd#', 'e', 'f', 'f#', 'g', 'g#', 'a', 'a#', 'b']
   if (key === undefined) return [undefined, 'r']
   return [Math.floor(key/12)/*-1*/,letters[key%12]]
}


function writeNote(focus_index) {
	// End note on index, tick in time for all other threads
	let now = Date.now()
	let remaining = Math.round((now - recorder.prevTime) / recorder._step)
	recorder.diff += ((now - recorder.prevTime) / recorder._step) - remaining
	console.log(remaining, recorder.diff, recorder.threads.length)

	for (var index = 0; index < recorder.threads.length; index++) {
		let iter_remaining = remaining
   	let [octave, letter] = keyToOctaveAndLetter(recorder.threads[index].curNote)
   	let stringy = ''
   	if ((octave !== recorder.threads[index].prevOctave) && letter !== 'r') {
      	stringy += 'o' + octave
   		recorder.threads[index].prevOctave = octave
   	}
	
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
	
			for (; j < Math.floor(iter_remaining/i); j++) {
				stringy += letter + (_SYSTEM_TICK / i)
			}
			iter_remaining = iter_remaining % i
		}
		if (index === focus_index) {
			stringy += ')('
		}
		recorder.threads[index].session += stringy
	
		
	}
	
	// deferred increment and decrement
	if (recorder.diff > 1) {
		recorder.diff -= 1
	} else if (recorder.diff < 1) {
		recorder.diff += 1
	}

	recorder.prevTime = now

}

// This approach has synchronization issues between threads.
function writeNote_try1(index) {
	let now = Date.now()
   let [octave, letter] = keyToOctaveAndLetter(recorder.threads[index].curNote)
   let stringy = ''
   if (octave !== recorder.threads[index].prevOctave) {
      stringy += 'o' + octave
   }
   recorder.threads[index].prevOctave = octave

	// Using the legato 64ths approach from the monophonic midi prototype
	stringy += '('
	let remaining = Math.round((now - recorder.threads[index].prevTime) / recorder._step)
	recorder.threads[index].diff += ((now - recorder.threads[index].prevTime) / recorder._step) - remaining

	console.log(remaining, recorder.threads[index].diff)
	for (var i = _SYSTEM_TICK; i >= 1; i/=2) {
		var j = 0;
		// Catch up for diff
		if (i == 1) {
			if (recorder.threads[index].diff > 1) {
				j = -1
				recorder.threads[index].diff -= 1
			} else if (recorder.threads[index].diff < 1) {
				j = 1
				recorder.threads[index].diff += 1
			}
		}

		for (; j < Math.floor(remaining/i); j++) {
			stringy += letter + (_SYSTEM_TICK / i)
		}
		remaining = remaining % i
	}
	stringy += ')'
	recorder.threads[index].session += stringy

	recorder.threads[index].prevTime = now
	
}
