let analyze = require('../src/analyze');

let timeago = (time) => {
  if (typeof time === 'number') time = { seconds: time };
  let diff = (time.seconds || 0) +
    (time.minutes || 0) * 60 +
    (time.hours || 0) * 3600 +
    (time.days || 0) * 24 * 3600;
  var d = new Date();
  d.setTime((d.getTime() / 1000 - diff) * 1000);
  return d;
};

let good = (ago) => ({ type: 'good', time: timeago(ago) });
let bad = (ago) => ({ type: 'bad', time: timeago(ago) });

let  point = (name, tries) => {
  let [set, index, word, meaning, extra] = name.split(':');
  return { id: set + ':' + index, word, meaning: meaning || word, extra, tries };
};

let closerToOne = (closer, farther) => {
  expect(Math.abs(1 - closer)).toBeLessThan(Math.abs(1 - farther));
};




describe('Analyze', () => {
  it('can be called empty', () => {
    expect(analyze()).toBe(undefined);
  });

  it('returns one if called with one', () => {
    expect(analyze([])).toBe(undefined);
  });

  it('returns one if called with one', () => {
    expect(analyze([{ id: 'a:0' }]).id).toBe('a:0');
  });

  it('can parse empty tries', () => {
    expect(analyze([{ id: 'a:0', tries: [] }]).id).toBe('a:0');
  });

  it('returns one if called with one', () => {
    let set = [ { id: 'a:0', tries: [] } ];
    expect(analyze(set).id).toBe('a:0');
  });

  it('returns by index when few', () => {
    let set = [
      point('set:0:a', [good(10)]),
      point('set:10:b', [good(10)]),
      point('set:11:c', [good(10)]),
      point('set:12:d', [good(10)])
    ];
    expect(analyze(set).word).toBe('a');
  });

  it('returns by failures', () => {
    let set = [
      point('set:0:a', [good(10)]),
      point('set:0:b', [good(10)]),
      point('set:0:c', [good(10)]),
      point('set:0:d', [good(10)]),
      point('set:0:e', [bad(10)])
    ];
    expect(analyze(set).word).toBe('e');
  });

  it('returns by time', () => {
    let set = [
      point('set:0:a', [good(10)]),
      point('set:0:b', [good(10)]),
      point('set:0:c', [good(10)]),
      point('set:0:d', [good(10)]),
      point('set:0:e', [good(10000)])
    ];
    expect(analyze(set).word).toBe('e');
  });

  it('half-life can be adjusted', () => {
    let data = point('set:0:a', [good(10)]);
    analyze.options.halflife = 3600;
    let chance = analyze.factors.forget(point('', [ good({ hours: 1 }) ]));
    expect(Math.round(chance * 100)).toBe(100);

    analyze.options.halflife = 24 * 3600;
    chance = analyze.factors.forget(point('', [ good(24 * 3600) ]));
    expect(Math.round(chance * 100)).toBe(100);

    analyze.options.halflife = 3600;
  });

  it('recent events are more relevant', () => {
    let set = [
      analyze.factors.accuracy(point('set:0:a', [bad(1)])),
      analyze.factors.accuracy(point('set:0:a', [bad({ hours: 1 })])),
      analyze.factors.accuracy(point('set:0:a', [bad({ hours: 12 })])),
      analyze.factors.accuracy(point('set:0:a', [bad({ days: 1 })]))
    ];

    // Older events are closer to 1 (less relevant)
    for (let i = 1; i < set.length; i++) {
      closerToOne(set[i], set[i-1]);
    }

    set = [
      analyze.factors.accuracy(point('set:0:a', [good(1)])),
      analyze.factors.accuracy(point('set:0:a', [good({ hours: 1 })])),
      analyze.factors.accuracy(point('set:0:a', [good({ hours: 12 })])),
      analyze.factors.accuracy(point('set:0:a', [good({ days: 1 })]))
    ];

    for (let i = 1; i < set.length; i++) {
      closerToOne(set[i], set[i-1]);
    }
  });

  it('is more important arecent mistake than old success', () => {
    let datapoint = point('set:0:a', [bad(10), good({ days: 1 })]);
    let factor = analyze.factors.accuracy(datapoint);
    expect(factor).toBeLessThan(1.5);
    expect(1).toBeLessThan(factor);
  });

  it('is more important a recent success than an old mistake', () => {
    let datapoint = point('set:0:a', [good(10), bad({ days: 1 })]);
    let factor = analyze.factors.accuracy(datapoint);
    expect(factor).toBeLessThan(1);
    expect(0.5).toBeLessThan(factor);
  });





  describe('some persona tests', () => {

    it('recent good nullify really old bad', () => {
      let chance = analyze([
        point('set:0:a', [good(10), bad({ days: 1 })])
      ]).chance;

      // console.log(chance);
      expect(chance < 0.2).toBe(true);
    });

    it('old enough and super old are the same', () => {
      let chance = analyze([
        point('set:0:a', [good({ days: 20 }), bad({ days: 20 })])
      ]).chance;

      let chanceb = analyze([
        point('set:0:a', [good({ days: 100 }), bad({ days: 100 })])
      ]).chance;

      // console.log(Math.round(chance * 10), Math.round(chanceb * 10));
      expect(Math.round(chance * 10)).toBe(Math.round(chanceb * 10));
    });

    it('many good nullify bad', () => {
      let chance = analyze([
        point('set:0:a', [good(10), good(10), good(10), good(10), bad(10)])
      ]).chance;

      // console.log(chance);
      expect(chance < 0.5).toBe(true);
    });
  });
});
