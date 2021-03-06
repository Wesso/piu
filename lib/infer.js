var possibleTriads  = require('./triads')
  , combi           = require('./combinatorics');

module.exports = exports = function infer(notes, enharmonics) {
  var triads, chords = [];

  if (enharmonics) {
    notes = notes.map(function(note) {
      return [note].concat(note.enharmonics());
    });

    // Flatten it
    notes = [].concat.apply([], notes);

    chords = combi.k_combinations(notes, 4).map(function(notecombi) {
      return infer(notecombi);
    });

    return [].concat.apply([], chords);
  }


  triads = possibleTriads(notes);
  triads.forEach(function(triad) {
    var indexes = triad.notes.map(function(n) { return n.toString() });
    var chromas = triad.notes.map(function(n) { return n.chroma() });
    var root = triad.notes[0], extensions = [];

    var exts = notes.filter(function(note) {
      return indexes.indexOf(note.toString()) === -1; 
    });

    for (var i = 0, length = exts.length; i < length; i++) {
      var ext = exts[i];
      var interval = root.interval(ext);
      if (chromas.indexOf(ext.chroma()) !== -1 ||
          Math.abs(interval.qualityValue()) > 2) return;

      interval = interval.direction() === 'down' ?  interval.invert() : interval;
      var q = interval.quality();
      var num = interval.number();

      if (num === 2 || num === 4)
        interval.coord[0]++;
      else if (num === 3 && triad.type.indexOf('sus') !== -1)
        return; // No thirds in sus chords
      else if (q === 'A' && num !== 2 && num !== 4)
        return;
      else if (q === 'd' && num !== 4 && !(num === 7 && triad.type === 'dim'))
        return;
      else if (q === 'dd' || q === 'AA')
        return;

      extensions.push(interval);
    }

    // Sort descending
    extensions.sort(function(a, b) { return b.number() - a.number(); });

    chords.push({
      root: root.name().toUpperCase() + root.accidental(),
      type: triad.type,
      exts: extensions
    });
  });

  return chords;
}
