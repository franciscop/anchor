var FlashCard = function(selector, opts){
  if (!(this instanceof FlashCard)) {
    return new FlashCard(selector, opts);
  }

  opts = Object.assign({
    confirm: 'Are you sure?',
    duration: 300,
    click: false
  }, opts);

  opts = Object.assign({
    in: opts.duration,
    out: opts.duration
  }, opts);

  this.container = document.querySelector(selector);
  this.element;
  this.transition = false;

  this.load = content => {

    this.flipped = false;
    this.transition = true;

    this.container.innerHTML = `
      <div class="slide in ${opts.click ? 'clickable' : ''}" data-id="${content.id}">
        <div class="corners">
          <div title="${content.titletopleft || ''}" class="corner top left">
            ${content.topleft || ''}
          </div>
          <div title="${content.titletopright || ''}" class="corner top right">
            ${content.topright || ''}
          </div>
          <div title="${content.titlebottomleft || ''}" class="corner bottom left">
            ${content.bottomleft || ''}
          </div>
          <div title="${content.titlebottomright || ''}" class="corner bottom right">
            ${content.bottomright || ''}
          </div>
        </div>

        <div class="content top">${content.top || ''}</div>
        <div class="content middle">${content.middle || ''}</div>
        <div class="content bottom">${content.bottom || ''}</div>
      </div>
    `;

    this.element = this.container.querySelector('.slide');
    if (opts.click) {
      this.element.addEventListener('click', this.tap);
    }
    setTimeout(() => this.element.classList.remove('in'), 10);
    setTimeout(() => {
      this.transition = false;
    }, opts.in);
  };

  this.close = () => new Promise((resolve, reject) => {
    this.transition = true;
    this.element.classList.add('out');
    setTimeout(() => {
      this.transition = false;
      resolve();
    }, opts.out);
  });

  this.flip = () => {
    this.flipped = true;
    if (this.element) {
      this.element.classList.add('flipped');
    }
  }

  this.touching = false;
  this.tap = () => {
    if (this.touching) return;
    this.touching = true;
    setTimeout(() => { this.touching = false }, opts.duration);

    if (!this.flipped) {
      return this.flip();
    }
    this.element.classList.add('out');
    return this.up();
  }

  document.addEventListener('keydown', e => {
    var available = { 27: 'escape', 32: 'space', 37: 'left', 38: 'up', 39: 'right', 40: 'down' };

    // If a modal is active don't show it
    if ([...document.querySelectorAll('.modal > input')].filter(check => check.checked).length) {
      return;
    }

    if (!(e.keyCode in available) || this.transition) return;
    e.preventDefault();

    var key = available[e.keyCode];
    if (key === 'space') {
      this.tap(e);
    }

    if (['up', 'down', 'left', 'right'].includes(key)) {
      this.element.classList.add(key);
      if (key in this) this[key]();
      return;
    }

    if (key === 'escape' && opts.confirm && confirm(opts.confirm)) {
      if (this.reset) this.reset();
    }
  });

  touch(diff => {
    if (diff.x < -100 && diff.y < 100 && diff.y > -100) {
      this.element.classList.add('left');
      if (this.left) this.left();
    }
    if (diff.x > 100 && diff.y < 100 && diff.y > -100) {
      this.element.classList.add('right');
      if (this.right) this.right();
    }
    if (diff.y < -100 && diff.x < 100 && diff.x > -100) {
      this.element.classList.add('up');
      if (this.up) this.up();
    }
    if (diff.y > 100 && diff.x < 100 && diff.x > -100) {
      this.element.classList.add('down');
      if (this.down) this.down();
    }
  });

  return this;
}
