const FlashCard = require('./flash.js');
const memory = require('./memory.js');
const cookies = require('cookiesjs');
console.log(cookies);


var card = new FlashCard('.hero', { out: 300, confirm: 'Clear all data?' });

// card.open = () => display();
card.open = () => display();
card.down = card.flip;
card.up = card.flip;
card.left = () => card.close().then(memory.mistake).then(card.open);
card.right = () => card.close().then(memory.correct).then(card.open);
card.reset = () => {
  store.clear();
  setTimeout(() => {
    window.location.href = window.location;
  }, 100);
}

u('footer a.mistake').handle('click', e => {
  u('.slide').addClass('left');
  card.left();
});

u('footer a.flip').handle('click', e => {
  card.flip();
});

u('footer a.correct').handle('click', e => {
  u('.slide').addClass('right');
  card.right();
});

function process(word){
  return {
    id: word.id,
    index: word.index,
    // titletopleft: 'Number of the card being displayed',
    // topleft: '#' + word.index,
    // titletopright: 'Current score for this word, ~' +
    //   Math.floor(100 - 100 * word.chance) + '%',
    topleft: '★'.repeat(Math.ceil(5 * word.score)) + '☆'.repeat(5 - Math.ceil(5 * word.score)),
    bottomleft: word.tries.slice(-5).reverse().map(tried => `
      <span
        title="${tried.type} answer ${moment(tried.time).fromNow()}"
        class="circle ${tried.type}"></span>
    `).join(''),
    titlebottomright: 'Time from the last try at this card',
    bottomright: word.tries.slice(-1).map(tried => moment ?
      moment(tried.time).fromNow() : '').join(''),

    top: word.extra || '',
    middle: word.word,
    bottom: word.meaning
  };
}

var sortA = (a, b) => parseInt(a.topleft.replace(/\#/, '')) -
  parseInt(b.topleft.replace(/\#/, ''));
var sortB = (a, b) => b.bottomright.length - a.bottomright.length;

var display = (initial) => memory.pick().then(word => {
  word = initial && initial.id ? initial : word;
  memory.word = word;
  card.load(process(word));

  memory.retrieve().then(data => {
    var table = document.querySelector('table');
    if (!table) return;
    table.innerHTML = `
      <tr>
        <th>#</th>
        <th>Word</th>
        <th>Meaning</th>
        <th>Help</th>
        <th class="col-recent">Recent</th>
        <th class="actions">Actions</th>
      </tr>
      ${data.map(word => process(word)).sort(sortA).sort(sortB).map(w => `
        <tr class="${w.id === word.id ? 'important' : ''}">
          <td data-name="#">${w.index}</td>
          <td data-name="Word">${w.middle}</td>
          <td data-name="Meaning">${w.bottom}</td>
          <td data-name="Help">${w.top}</td>
          <td data-name="Recent" class="recent">${w.bottomright}</td>
          <td data-name="Actions" class="actions">
            <a href="#" title="Reset data" data-id="${w.id}" class="pseudo button reload">↻</a>
            ${w.id === word.id ? '' : `
              <a href="#" title="Show slide" data-id="${w.id}" class="pseudo button play">►</a>
            `}
          </td>
        </tr>
      `).join('')}
    `;

    u('.button.reload').on('click', e => {
      var id = e.target.getAttribute('data-id');
      memory.retrieve().then(data => {
        var word = data.find(w => w.id === id);
        word.tries = [];
        memory.store(word).then(() => display(word));
      })
    });

    u('.button.play').on('click', e => {
      var id = e.target.getAttribute('data-id');
      memory.retrieve().then(data => {
        var word = data.find(w => w.id === id);
        display(word);
      })
    });
  });
});

var datasets = [{
  title: 'Japanese Vocabulary N5',
  sheet: '1z7cU-Sp6RG2HtnCy_GmANrxSGKvBUxk2Z0seLE29lew',
  author: 'http://www.tanos.co.uk/',
  active: false
}, {
  title: 'Japanese Kanji N5',
  sheet: '1HidFAQeHKZ5d_d3MRkNY-zGdn0jh6ZWX7Sdmz3Gnerk',
  author: 'http://www.tanos.co.uk/',
  active: false
}, {
  title: 'Minna no Nihongo 1',
  sheet: '1x0Bq4W9SEBnN4TXKZh47FY0a0Mg0z-BiSRHOw02dN0c',
  author: 'me',
  active: false
}, {
  title: 'Hiragana',
  sheet: '1Sue3deRy2f6KrNrZ1RQ00EIwBc5jBYdVF-2ha5pozlA',
  author: 'Francisco',
  active: false
}];

function setDataset (set) {

  cookies({ dataset: set });

  // Handle the right datasheet in the memory
  memory.sheet(set).then(display);

  var card = u(`.modal .card[data-id="${set.sheet}"]`);
  u('title').html('⚓ ' + set.title);
  u('nav .menu .change').html(set.title + ' ▼');
  u('.modal.datasets .card').removeClass('active');
  card.addClass('active');

  // Page meta
  u('title').html('⚓ ' + set.title);
  u('#datasets').first().checked = false;
}

setDataset(cookies('dataset') || datasets[0]);
let active = cookies('dataset').sheet;
datasets.forEach((set, i) => {
  if (set.sheet === active) {
    datasets[i].active = true;
  }
});


u('.modal.datasets .content').html('').append((set, i) => `
  <div data-id="${set.sheet}" class="card ${set.active ? 'active' : ''}">
    <header>
      <h3>${set.title}</h3>
    </header>
    <footer>
      <a class="button set" data-sheet="${set.sheet}" href="#">Study</a>
      <a class="pseudo button showlist" href="https://docs.google.com/spreadsheets/d/${set.sheet}" target="_blank">Show list</a>

      <a class="pseudo button author" href="${set.author}" target="_blank">Author</a>
      <div style="clear: both"></div>
    </footer>
  </div>
`, datasets);

u('.button.change').on('click', e => {

  var json = JSON.stringify(store.getAll());
  var blob = new Blob([json], {type: "application/json"});
  var url  = URL.createObjectURL(blob);

  u('.button.download').attr('href', url);
});

u('.set').on('click', e => {
  e.preventDefault();
  var sheet = u(e.currentTarget).attr('data-sheet');
  setDataset(datasets.find(data => data.sheet === sheet));
});

u('.modal.create').ajax(res => {
  u('.modal.create .content').removeClass('loading');
  var message = 'Thank you, we will ';
  if (u('.modal.create [name="email"]').first().value) {
    message += 'contact you soon';
  } else {
    message += 'review it and upload it';
  }
  u('.modal.create .content').html(message);
  u('.modal.create footer a, .modal.create footer input').remove();
}, () => {
  u('.modal.create .content').addClass('loading');
});



document.addEventListener("DOMContentLoaded", function() {
  [].forEach.call(document.querySelectorAll('.dropimage'), function(file){
    file.onchange = function(e){
      var inputfile = this, reader = new FileReader();
      reader.onloadend = function(e2){
        // console.log(reader.result);
        var all = JSON.parse(reader.result);

        var res = confirm('All the data will be removed. Proceed?');
        u('input[type="checkbox"]').each(check => check.checked = false);
        if (!res) {
          return console.log("Skipping deletion");
        }
        store.clear();
        for (var id in all) {
          store.set(id, all[id]);
        }
      };
      reader.readAsText(e.target.files[0], 'utf-8');
    };
  });
});
