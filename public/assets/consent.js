(function(){
  'use strict';
  var KEY='slopesToHopeAnalyticsConsent';
  var TAG_ID='GT-MKTP8299';
  var MEASUREMENT_ID='G-XEWDW3TYVZ';
  var HUBSPOT_PORTAL_ID='244348981';
  var analyticsLoaded=false;
  window.dataLayer=window.dataLayer||[];
  window.gtag=window.gtag||function(){window.dataLayer.push(arguments);};
  window.gtag('consent','default',{analytics_storage:'denied',ad_storage:'denied',ad_user_data:'denied',ad_personalization:'denied'});
  function preference(){try{return localStorage.getItem(KEY);}catch(_error){return null;}}
  function remember(value){try{localStorage.setItem(KEY,value);}catch(_error){}}
  function loadScript(id,src){if(document.getElementById(id))return;var script=document.createElement('script');script.id=id;script.async=true;script.src=src;document.head.appendChild(script);}
  function enableAnalytics(){
    window.gtag('consent','update',{analytics_storage:'granted'});
    if(analyticsLoaded)return;
    analyticsLoaded=true;
    loadScript('sth-google-tag','https://www.googletagmanager.com/gtag/js?id='+encodeURIComponent(TAG_ID));
    window.gtag('js',new Date());
    window.gtag('set','linker',{domains:['slopestohope.com']});
    window.gtag('config',TAG_ID);
    loadScript('sth-hubspot-tracking','https://js-na2.hs-scripts.com/'+HUBSPOT_PORTAL_ID+'.js');
    document.documentElement.dataset.analyticsMeasurementId=MEASUREMENT_ID;
  }
  function disableAnalytics(){window.gtag('consent','update',{analytics_storage:'denied'});document.documentElement.removeAttribute('data-analytics-measurement-id');}
  function render(){
    var panel=document.createElement('section');
    panel.className='sth-consent';panel.id='sth-cookie-consent';panel.setAttribute('role','dialog');panel.setAttribute('aria-modal','false');panel.setAttribute('aria-labelledby','sth-consent-title');
    panel.innerHTML='<p id="sth-consent-title"><strong>Analytics and privacy</strong></p><p>We use optional analytics to understand how visitors use this site. You can accept or decline analytics. See our <a href="/privacy-policy/">Privacy Policy</a>.</p><div class="sth-consent__actions"><button type="button" data-consent="granted">Accept analytics</button><button type="button" data-consent="denied">Decline analytics</button></div>';
    document.body.appendChild(panel);
    var settings=document.querySelector('[data-open-cookie-settings]');
    function show(){panel.classList.add('is-visible');panel.querySelector('button').focus();}
    function hide(){panel.classList.remove('is-visible');if(settings)settings.focus({preventScroll:true});}
    panel.addEventListener('click',function(event){var value=event.target&&event.target.getAttribute('data-consent');if(!value)return;remember(value);if(value==='granted')enableAnalytics();else disableAnalytics();hide();});
    document.querySelectorAll('[data-open-cookie-settings]').forEach(function(button){button.addEventListener('click',show);});
    panel.addEventListener('keydown',function(event){if(event.key==='Escape'&&preference())hide();});
    var saved=preference();if(saved==='granted')enableAnalytics();else if(saved==='denied')disableAnalytics();else show();
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',render);else render();
})();
