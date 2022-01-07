var moveDiv = document.getElementById('movediv');
moveDiv.onmousedown = ()=>{
window.onmousemove = function (e) {
    var x = e.pageX,
        y = e.pageY;
    moveDiv.style.top = (y) + 'px';
    moveDiv.style.left = (x) + 'px';
};
  window.onmouseup = ()=>{
    window.onmousemove = undefined;
  }
}
