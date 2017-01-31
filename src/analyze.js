let memoriza;
if (typeof module !== 'undefined') {
  memoriza = require('./memory/index.js');
}

let analyze = function(set){
  if (!set || !set.length) return;

  // Perform the analysis on each item
  let analysis = (one, i, all) => {
    one.tries = one.tries || [];
    var parts = one.id.split(':');
    one.index = parts ? parseInt(parts.pop()) : 0;
    return memoriza()(one.tries);
  };

  var chance = cb => (word, i, all) => Object.assign({}, word, {
    chance: cb(word, i, all)
  });
  let sorted = set.map(chance(analysis)).sort((a, b) => b.chance - a.chance);
  sorted[0].all = sorted;
  return sorted[0];
}


if (typeof module !== 'undefined') {
  module.exports = analyze;
}
