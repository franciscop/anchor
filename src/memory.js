const store = require('./store.js');
const recordar = require('recordar');

// If there is a noticeable difference
// 0.49999 ~ 0.5; 0.50001 ~ 0.5; 0.6 > 0.5
const equal = (accuracy => (a, b) => {
  return Math.abs(a - b) < accuracy;
})(0.01);

const memory = {
  dataset: data => {
    if (data) return memory.store(data);
    return memory.retrieve();
  },

  store: (data, name = memory.name) => {
    data = data instanceof Array ? data : [data];
    var stored = store.getAll();
    data = data.map((word, i) => Object.assign({}, word, {
      id: word.id || name + ':' + word.index
    })).map(word => Object.assign({}, word, {
      tries: (word.tries || (stored[word.id] ? stored[word.id].tries || [] : [])).map(tried => {
        tried.time = tried.time instanceof Date ? Math.round(tried.time.getTime()/1000) : tried.time;
        return tried;
      })
    }));

    data.forEach(word => store.set(word.id, word));
    return memory.retrieve();
  },

  retrieve: (name = memory.name) => new Promise((resolve, reject) => {
    var data = store.getAll();
    var sameset = word => word.id.split(':')[0] === name;
    var settime = word => Object.assign(word, {
      tries: word.tries.map(tried => Object.assign(tried, {
        time: new Date(tried.time * 1000)
      }))
    });
    resolve(Object.keys(data).map(key => data[key]).filter(sameset).map(settime));
  }),

  load: (url, name) => {
    memory.name = name || (url.split('/').pop() || '').replace(/\.json$/, '');
    return fetch(url).then(res => res.json()).then(memory.dataset);
  },

  // From here: https://developers.google.com/gdata/samples/spreadsheet_sample
  // and here: https://github.com/franciscop/drive-db
  sheet: set => new Promise((resolve, reject) => {

    if (!set || !set.sheet) return reject();

    memory.set = set;

    var parse = raw => raw.feed.entry.map((row, i) => {

      var entry = { index: i };

      // Loop through all of the fields (only some are valid)
      for (var field in row) {

        // Match only those field names that are valid
        if (field.match(/gsx\$[0-9a-zA-Z]+/)) {

          // Get the field real name
          var name = field.match(/gsx\$([0-9a-zA-Z]+)/)[1];

          // Store it and its value
          entry[name] = row[field].$t;
        }
      }

      return entry;
    });

    window.onloadsheet = function (data) {
      memory.name = set.title;
      memory.dataset(parse(data)).then(resolve);
    }

    var script = document.createElement('script');
    script.src = "https://spreadsheets.google.com/feeds/list/" + set.sheet + "/od6/public/values?alt=json-in-script&callback=onloadsheet";
    document.body.appendChild(script);
  }),

  init: (name, data) => new Promise((resolve, reject) => {
    memory.name = name;
    memory.dataset(data).then(resolve);
  }),

  pick: () => new Promise((resolve, reject) => {
    let time = new Date();
    memory.dataset().then((data) => {
      var chance = cb => (word, i, all) => Object.assign({}, word, { chance: cb(word, i, all) });
      Promise.all(data.map(one => recordar(one.tries, { word: one.word, halflife: 3600, minimum: 0.1 }))).then(all => {
        all.map((score, i) => {
          data[i].score = score;
        });
        // Sort by index and then by score
        let sorted = data.sort((a, b) => a.index - b.index).sort((a, b) => {
          if (!equal(a.score, b.score)) {
            return a.score - b.score;
          }
        });
        memory.word = sorted[0];
        console.log(sorted);
        resolve(sorted[0]);
      });
    })
  }),

  solve: (word = memory.word, type) => new Promise((resolve, reject) => {
    word.tries.push({ type: type, time: new Date() });
    memory.store(word);
    resolve();
  }),
  correct: word => memory.solve(word, 'good'),
  mistake: word => memory.solve(word, 'bad'),
  skip: word => memory.solve(word, 'skip')
};

module.exports = memory;
