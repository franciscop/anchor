function touch(cb){
  var start;
  touch.callbacks = touch.callbacks || [];
  touch.callbacks.push(cb);
  if (touch.attached) return;
  touch.attached = true;
  document.addEventListener('touchstart', function(e){
    if (!e.touches.length) return;
    start = {
      x: e.touches[0].clientX,
      y: e.touches[0].clientY
    };
  });
  document.addEventListener('touchend', function(e){
    if (!e.changedTouches.length) return;
    var end = {
      x: e.changedTouches[0].clientX,
      y: e.changedTouches[0].clientY
    };
    var diff = { x: end.x - start.x, y: end.y - start.y };
    touch.callbacks.forEach(function(cb){
      cb(diff, start, end);
    });
  });
}
