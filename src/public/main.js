'use strict';

(function() {
  let socket = io('/command');
  let canvas = document.getElementsByClassName('whiteboard')[0];
  let colors = document.getElementsByClassName('color');
  let context = canvas.getContext('2d');

  let selectedColor = 'black';
  let drawing = false;
  let saved = {};


  // Load initial image
  let image = new Image();
  image.onload = function() {
    context.drawImage(image, 0, 0);
  }; 
  image.src = '/canvas';

  // Start listening mouse events
  canvas.addEventListener('mousedown', onMouseDown, false);
  canvas.addEventListener('mouseup', onMouseUp, false);
  canvas.addEventListener('mouseout', onMouseUp, false);
  canvas.addEventListener('mousemove', throttle(onMouseMove, 10), false);

  for (let i = 0; i < colors.length; i++){
    colors[i].addEventListener('click', onColorUpdate, false);
  }

  socket.on('drawing', onDrawingEvent);

  window.addEventListener('resize', onResize, false);
  onResize();


  function drawLine(x0, y0, x1, y1, color, emit){
    context.beginPath();
    context.moveTo(x0, y0);
    context.lineTo(x1, y1);
    context.strokeStyle = color;
    context.lineWidth = 5;
    context.stroke();
    context.closePath();

    if (!emit) { return; }

    socket.emit('drawing', {
      x0: x0,
      y0: y0,
      x1: x1,
      y1: y1,
      color: color
    });
  }

  function getCanvasPoint(e) {
    let rect = canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
  }

  function onMouseDown(e){
    drawing = true;
    saved = getCanvasPoint(e);
  }

  function onMouseUp(e){
    if (!drawing) { return; }
    drawing = false;
    let current = getCanvasPoint(e);
    drawLine(saved.x, saved.y, current.x, current.y, selectedColor, true);
  }

  function onMouseMove(e){
    if (!drawing) { return; }
    let current = getCanvasPoint(e);
    drawLine(saved.x, saved.y, current.x, current.y, selectedColor, true);
    saved = current;
  }

  function onColorUpdate(e){
    selectedColor = e.target.className.split(' ')[1];
  }

  // limit the number of events per second
  function throttle(callback, delay) {
    let previousCall = new Date().getTime();
    return function() {
      let time = new Date().getTime();

      if ((time - previousCall) >= delay) {
        previousCall = time;
        callback.apply(null, arguments);
      }
    };
  }

  function onDrawingEvent(data){
    drawLine(data.x0, data.y0, data.x1, data.y1, data.color);
  }

  // make the canvas fill its parent
  function onResize() {
//    canvas.width = window.innerWidth;
//    canvas.height = window.innerHeight;
  }

})();
