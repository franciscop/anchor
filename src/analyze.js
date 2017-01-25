let analyze = function(set){
  if (!set || !set.length) return;

  // Perform the analysis on each item
  let analysis = (one, i, all) => {
    one.tries = one.tries || [];
    var parts = one.id.split(':');
    one.index = parts ? parseInt(parts.pop()) : 0;
    let chance = 0.5;
    for (let key in analyze.factors) {
      chance *= analyze.factors[key](one, i, all);
    }
    // Bound it on top and bottom to 0 and 1
    return Math.max(0, Math.min(chance, 1));
  };

  var chance = cb => (word, i, all) => Object.assign({}, word, {
    chance: cb(word, i, all)
  });
  let sorted = set.map(chance(analysis)).sort((a, b) => b.chance - a.chance);
  sorted[0].all = sorted;
  return sorted[0];
}




// Every one of the factors should tend to 1
analyze.factors = {};

// Time factor; the longer the time, the more you don't know
analyze.factors.forget = function (word) {
  if (!word.tries.length) return 1;

  let last = word.tries.map(w => w.time).sort().shift();
  if (!last) return 1;
  // Wolfram Alpha: ln(x) / 8 from 0 to 10000
  // 1 = ln(x) / ln(const)
  let selffactor = Math.log(analyze.options.halflife);
  return Math.max(0, Math.log((new Date() - last) / 1000) / selffactor);
};

  // Accuracy factor; the more errors you make, the less that you know
analyze.factors.accuracy = function (word) {
  if (!word.tries.length) return 1;

  // Forget 50% in e ^ (-A * t)
  let coeffs = {
    hour: 0.0002,  // 1h
    day: 0.000008  // 24h
  };
  let size = (all, one) => {
    let timediff = (new Date() - one.time) / 1000;
    let remember = Math.pow(Math.E, (-coeffs.day * timediff));
    // Force each try to always influence even if it's just a bit
    remember = Math.max(remember, analyze.options.minimum);
    return all + remember;
  };

  var good = word.tries.filter(n => n.type === 'good').reduce(size, 1);
  var bad = word.tries.filter(n => n.type === 'bad').reduce(size, 1);
  return bad / good;
};

// Position of the index vs total size
// TODO: dynamic range depending on the dataset size
analyze.factors.index = function(word, i, all) {
  return 1.2 - 0.4 * (word.index / all.length);
};

// Make it slightly random
analyze.factors.random = function (word) {
  return 0.2 * Math.random() + 0.9;
};



analyze.options = {};
analyze.options.halflife = 3600;
analyze.options.minimum = 0.5;




if (typeof module !== 'undefined') {
  module.exports = analyze;
}
