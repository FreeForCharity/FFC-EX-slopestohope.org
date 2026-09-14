(function(){
  'use strict';
  document.querySelectorAll('.sth-hero').forEach(function(hero){
    var slides=hero.querySelectorAll('.sth-hero__slide'),current=0;
    if(slides.length<2)return;
    setInterval(function(){
      var next=(current+1)%slides.length;
      var image=slides[next].querySelector('img');
      if(!image.complete||!image.naturalWidth)return;
      slides[next].classList.add('is-active');
      slides[current].classList.remove('is-active');
      current=next;
    },3000);
  });
})();
