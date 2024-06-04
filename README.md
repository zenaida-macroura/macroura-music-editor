# macroura-music-editor
An MML &amp; MIDI editor targeting MuSICA for the MSX.

Optimistic Roadmap:
* [ ] MIDI Input
  * [x] Monophonic Recording
  * [ ] Polyphonic Recording
  * [ ] Audio feedback while recording
* [x] Chord Sequencer
* [ ] Drum Sequencer
* [x] Extended MML dialect transpiler
  * [x] Chord splitter
* [ ] Reimplement MuSICA Compiler in JS or wasm
  * [ ] Craft front-end replacement for the role previously filled by MuSICA/WebMSX
    * [ ] MML Editor
    * [ ] Voice Editor
  * [ ] MML to BGM (This is the hard part)
    * [ ] Block Data
    * [ ] Sequence Data
  * [ ] BGM to floppy with start script that launches the MuSICA player (now using WebMSX as the player only and not as an intermediary editor)

## Documentation

### Sketch Tools

#### Chord Sequencer

##### Chord Label Notation

The chord sequencer makes the base assumption that every chord is a tetrad built from a scale.  The 1 is implied by specifying the scale from which to build the chord, and all other notes in the tetrad must be specified.

The scale is determined by the initial letter in the tetrad.  Originally the chromatic scale was mapped from o-z to save characters, but now also supports regular chromatic letters and sharps.

```
New Schema: c  c# d  d# e  f  f# g  g# a  a# b
Old Schema: o  p  q  r  s  t  u  v  w  x  y  z

```
Do note that the new schema does not support defining via flats.  Sharps are used because the `#` symbol does not exist in the scale degree list, as defined by the following paragraphs.

After the first character defines the scale, the remaining characters specify which degrees in the scale build the tetrad (after the 1).  Some important distinctions here is that `7` refers to the major seven, so for a normal seventh chord, which uses the flat seven, use `s` instead.  Following that schema, the flat nine is `n`, the flat ten is `t`, the flat twelve is `w`, and the flat thirteen is `r`.  Another distinction of note is that flat and sharp five is indicated by `-` and `+`.
```
1 2 34 5 6 78 9 ab c d
 u m  - + s  n t  w r
```
When you wish to have a triad instead of a tetrad, replace one of the notes in the scale with `0` and a rest will be played for that channel.

Examples:
* C major triad: `o350`
* Cm7b5: `om-s`
* Em9: `sms9` (drop the five)
* F#7: `u35s`
* F#M7: `u357`

##### Sequence of Chords

Example:
```
cdsn=[o350]2r2[xm50]2r2[t350]2r2[v350]2r2
```
Is converted to:
```
cds1=c2r2a2r2f2r2g2r2
cds2=e2r2c2r2a2r2b2r2
cds3=g2r2e2r2c2r2d2r2
cds4=r2r2r2r2r2r2r2r2
```
