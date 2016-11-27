var memory = {
  dataset: data => new Promise((resolve, reject) => {

    if (data) {
      return memory.store(data).then(resolve);
    }

    memory.retrieve().then(resolve);
  }),

  store: (data, name = memory.name) => new Promise((resolve, reject) => {
    data = data instanceof Array ? data : [data];
    var stored = store.getAll();
    data = data.map((word, i) => Object.assign(word, {
      id: word.id || name + ':' + i
    })).map(word => Object.assign(word, {
      tries: (word.tries || (stored[word.id] ? stored[word.id].tries || [] : [])).map(tried => {
        tried.time = tried.time instanceof Date ? Math.round(tried.time.getTime()/1000) : tried.time;
        return tried;
      })
    }));

    data.forEach(word => store.set(word.id, word));
    resolve(memory.retrieve());
  }),

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

  load: (url, name) => new Promise((resolve, reject) => {
    memory.name = name || (url.split('/').pop() || '').replace(/\.json$/, '');
    fetch(url).then(res => res.json()).then(data => memory.dataset(data, name)).then(resolve);
  }),

  // From here: https://developers.google.com/gdata/samples/spreadsheet_sample
  // and here: https://github.com/franciscop/drive-db
  sheet: set => new Promise((resolve, reject) => {

    if (!set || !set.sheet) return reject();

    var parse = raw => raw.feed.entry.map(row => {

      var entry = {};

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

  randomTable: [],
  randomIndex: 0,
  random: () => {
    if (!memory.randomTable.length) {
      for (var i=1e6; i--;) {
        memory.randomTable.push(Math.random());
      }
    }

    memory.randomIndex++;
    if (memory.randomIndex >= memory.randomTable.length) memory.randomIndex = 0;
    return memory.randomTable[memory.randomIndex];
  },

  // Every one of the factors should tend to 1
  factors: [

    // Map each try to a number (0.5, 0.8 or 2) and make them approach to 1
    // the further away in time that they are. This way, recent tries get more
    // value than older values
    function error (word) {
      if (!word || !word.tries || !word.tries.length) return 1;

      var chances = word.tries.map(tried => Object.assign({}, tried, {
        timediff: (new Date() - tried.time) / 1000
      })).map(tried => Object.assign({}, tried, {
        // Get the coefficient of importance depending on the time
        // Adjust the "0.001" for the X axis, now in 200s you get 0.5 (0.0003 = 1h)
        // Wolfram Alpha: LogLinearPlot 1 / (0.001 * x + 1) from 0 to 10000000
        coeff: 1 / (0.001 * tried.timediff + 1)
      })).map(tried => Object.assign({}, tried, {
        value: { good: 0.5, bad: 2, skip: 1.5 }[tried.type] || 1
      })).map(tried => tried.coeff * tried.value + (1 - tried.coeff));

      console.log(chances.reduce((all, one) => all * one, 1).toFixed(2), word.kanji, chances);

      // Multiply all of the coefficients
      return chances.reduce((all, one) => all * one, 1);
    },

    // // Time factor; the longer the time, the more you don't know
    // function forget (word) {
    //   var last = word.tries[word.tries.length - 1];
    //   if (!last) return 1;
    //   // Wolfram Alpha: ln(x) / 8 from 0 to 10000
    //   return Math.max(0, Math.log((new Date() - last.time) / 1000) / 8);
    // },
    //
    // // Accuracy factor; the more errors you make, the less that you know
    // function accuracyfactor(word) {
    //   if (!word.tries.length) return 1;
    //
    //   var good = word.tries.filter(n => n.type === 'good').length + 1;
    //   var bad = word.tries.filter(n => n.type === 'bad').length + 1;
    //   var skip = word.tries.filter(n => n.type === 'skip').length;
    //   return (bad + (skip * 0.2)) / good;
    // },

    // Make it slightly random
    function randomfactor(word) {
      return 0.2 * memory.random() + 0.9;
    }

    // Make it slightly random
    function randomfactor(word) {
      return 0.2 * memory.random() + 0.9;
    }
  ],


  chance: (word, i, all) => {
    var j = parseInt(word.id.split(':')[1]);
    if (!word.tries.length) return 0.6 - 0.2 * j / (all.length || 1);
    var chance = memory.factors.reduce((chance, cb) => chance * cb(word), 0.5);
    console.log("Chances:", word.kanji, chance);
    if (chance < 0) return 0;
    if (chance > 1) return 1;
    return chance;
  },

  pick: () => new Promise((resolve, reject) => {
    memory.dataset().then((data) => {
      var chance = cb => (word, i, all) => Object.assign({}, word, { chance: cb(word, i, all) });
      var sorted = data.map(chance(memory.chance)).sort((a, b) => b.chance - a.chance);
      memory.word = sorted[0];
      resolve(sorted[0]);
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

// Initialize it
memory.random();
