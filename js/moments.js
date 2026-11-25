/* The one place the six "moment" photographs are named.
   To swap a photo, replace the files in assets/moments/ (same names) or edit this list.
   Each photo ships at three widths: <file>-800.jpg, -1600.jpg and -2400.jpg
   (made by _tools/prepare-assets.py from the licensed masters).
   pos / posTall are CSS object-position values for the wide and the tall crop.
   deep: true adds a darker scrim under the caption for bright photos. */
window.TIDY_MOMENTS = {
  base: 'assets/moments/',
  widths: [800, 1600, 2400],
  items: [
    { id: 'D1', file: 'D1-fireworks', name: 'Fireworks', size: '1.6 GB',
      line: 'Happening now. And your phone is full.',
      alt: 'A crowd holding up phones under a sky full of golden fireworks.',
      pos: '50% 62%', posTall: '50% 50%' },
    { id: 'D2', file: 'D2-first-steps', name: 'First steps', size: '1.3 GB', deep: true,
      line: 'First steps. No space left to film them.',
      alt: 'A baby in overalls taking first steps in front of a couch, holding a parent’s hands.',
      pos: '50% 38%', posTall: '52% 50%' },
    { id: 'D3', file: 'D3-concert', name: 'Concert', size: '900 MB',
      line: 'Your song starts. Your phone stops.',
      alt: 'A hand filming a concert stage on a phone, with yellow and purple lights.',
      pos: '50% 40%', posTall: '37% 50%' },
    { id: 'D4', file: 'D4-caught-out', name: 'Caught out', size: '700 MB',
      line: 'Storage full. Again.',
      alt: 'A woman on a couch staring at her phone in disbelief.',
      pos: '50% 34%', posTall: '50% 50%' },
    { id: 'D5', file: 'D5-sunset', name: 'Sunset', size: '800 MB',
      line: 'The perfect light. No space left.',
      alt: 'A woman photographing a golden sunset over the sea.',
      pos: '50% 46%', posTall: '57% 50%' },
    { id: 'D6', file: 'D6-city-trip', name: 'City trip', size: '600 MB',
      line: 'Once in a lifetime. Zero space left.',
      alt: 'Hands holding a phone up to photograph a city square at dusk.',
      pos: '60% 40%', posTall: '86% 50%' }
  ]
};
