(function(){
  'use strict';
  document.querySelectorAll('.sth-hero').forEach(function(hero){
    var slides=hero.querySelectorAll('.sth-hero__slide'),current=0,timer=null,engaged=false;
    if(slides.length<2)return;
    var motion=window.matchMedia?window.matchMedia('(prefers-reduced-motion: reduce)'):null;
    function advance(){
      var next=(current+1)%slides.length;
      var image=slides[next].querySelector('img');
      if(!image.complete||!image.naturalWidth)return;
      slides[next].classList.add('is-active');
      slides[current].classList.remove('is-active');
      current=next;
    }
    function stop(){if(timer){clearInterval(timer);timer=null;}}
    function sync(){
      if((motion&&motion.matches)||engaged||document.hidden){stop();return;}
      if(!timer)timer=setInterval(advance,3000);
    }
    hero.addEventListener('mouseenter',function(){engaged=true;sync();});
    hero.addEventListener('mouseleave',function(){engaged=false;sync();});
    hero.addEventListener('focusin',function(){engaged=true;sync();});
    hero.addEventListener('focusout',function(event){if(!hero.contains(event.relatedTarget)){engaged=false;sync();}});
    document.addEventListener('visibilitychange',sync);
    if(motion){
      if(motion.addEventListener)motion.addEventListener('change',sync);
      else if(motion.addListener)motion.addListener(sync);
    }
    sync();
  });
  var historicalMeter=document.querySelector('.elementor-element-5e86fc4 .eael-progressbar-circle');
  if(historicalMeter)historicalMeter.setAttribute('data-duration','0');
})();
