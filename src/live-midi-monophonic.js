/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */
/*
This file's a bit of a mess.  Ideally when we rewrite the MIDI recorder to be both mono- and polyphonic we'll be able to clean this up.
TODO:
* When recorder.diff > 2, insert a 64th note to bring it back into approximate sync.  For < -2, remove a 64th note (as long as the preceeding note is longer than a 64th).  Also TODO, check to make sure that's not the wrong way around.
* Pressing a chord increases recorder.diff.
* Spamming notes but not chording decreases recorder.diff to below zero.
 */
navigator.requestMIDIAccess().then(requestMIDIAccessSuccess, requestMIDIAccessFailure);

// Minimum required to not crash if MIDI event intercepted before starting to record
let recorder = {active: false}

// Set all of the variables we need for transcoding MIDI data to MML.
function startRecording() {
   recorder.curNote = undefined
   recorder.prevOctave = undefined
   recorder.prevTime = Date.now()
   recorder.tempo = 180
   recorder._step = 60000 / recorder.tempo / 16 // ms length of 64th note
   recorder.diff = 0

   recorder.active = true
   recorder.session = 'v15@1t' + recorder.tempo
}

function stopRecording() {
   recorder.active = false
   writeNote()
   console.log(recorder.session)
   definitions.value = recorder.session
}

function writeNote() {
   let now = Date.now()
   let [octave, letter] = keyToOctaveAndLetter(recorder.curNote)
   let stringy = ''
   if (octave !== recorder.prevOctave) {
      stringy += 'o' + octave
   }
   recorder.prevOctave = octave
   if (false) {
      // round to the nearest fraction
      stringy += letter

      let number = 64 / ((now - recorder.prevTime) / recorder._step)
      if (number > 64) number = 64
      if (number < 1) console.warn('Length greater than one measure')
      let adjustment = ''
      /*number = Math.round(number*2)/2
      console.log(number)
      if (number%1 == 0.5) {
         adjustment = '.'
         number += 0.5
      }*/
      recorder.diff += number - Math.round(number)
      number = Math.round(number)

      // now we can math it out
      recorder.session += stringy + number + adjustment
   } else {
      // legato 64ths, combining downwards by powers of 2
      stringy += '('
      let remaining = Math.round((now - recorder.prevTime) / recorder._step)
      // log offset from real time
      recorder.diff += ((now - recorder.prevTime) / recorder._step) - remaining

      console.log(remaining, recorder.diff)
      for (let i = 64; i >= 1; i /= 2) {
         for (let j = 0; j < Math.floor(remaining/i); j++) {
            stringy += letter + (64 / i)
         }
         remaining = remaining % i
      }

      stringy += ')'
      recorder.session += stringy
   }
   recorder.prevTime = now
}

function keyToOctaveAndLetter(key) {
   let letters = ['c', 'c#', 'd', 'd#', 'e', 'f', 'f#', 'g', 'g#', 'a', 'a#', 'b']
   if (key === undefined) return [recorder.prevOctave, 'r']
   return [Math.floor(key/12)/*-1*/,letters[key%12]]
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
      // note start on channel 1
      writeNote()
      recorder.curNote = key
   } else if (command === 128) {
      // note end on channel 2
      if (recorder.curNote === key) {
         writeNote()
         recorder.curNote = undefined
      }
   }
}
