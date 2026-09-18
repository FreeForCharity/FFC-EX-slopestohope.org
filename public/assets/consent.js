(function(){
  'use strict';
  var KEY='slopesToHopeAnalyticsConsent';
  var TAG_ID='GT-MKTP8299';
  var MEASUREMENT_ID='G-XEWDW3TYVZ';
  var HUBSPOT_PORTAL_ID='244348981';
  var analyticsLoaded=false;
  window.disableHubSpotCookieBanner=true;
  window.dataLayer=window.dataLayer||[];
  window.gtag=window.gtag||function(){window.dataLayer.push(arguments);};
  var savedPreference=preference();
  window.gtag('consent','default',{analytics_storage:savedPreference==='denied'?'denied':'granted',ad_storage:'denied',ad_user_data:'denied',ad_personalization:'denied'});
  function preference(){try{return localStorage.getItem(KEY);}catch(_error){return null;}}
  function remember(value){try{localStorage.setItem(KEY,value);}catch(_error){}}
  function loadScript(id,src){if(document.getElementById(id))return;var script=document.createElement('script');script.id=id;script.async=true;script.src=src;document.head.appendChild(script);}
  function hubSpotQueues(){
    window._hsq=window._hsq||[];
    window._hsp=window._hsp||[];
    return {tracking:window._hsq,privacy:window._hsp};
  }
  function enableHubSpotTracking(){
    var queues=hubSpotQueues();
    queues.tracking.push(['doNotTrack',{track:true}]);
    queues.privacy.push(['setHubSpotConsent',{analytics:true,advertisement:false,functionality:true}]);
    loadScript('sth-hubspot-tracking','https://js-na2.hs-scripts.com/'+HUBSPOT_PORTAL_ID+'.js');
  }
  function disableHubSpotTracking(){
    var queues=hubSpotQueues();
    queues.tracking.push(['doNotTrack']);
    queues.privacy.push(['setHubSpotConsent',{analytics:false,advertisement:false,functionality:true}]);
    queues.privacy.push(['revokeCookieConsent']);
  }
  function enableAnalytics(){
    window.gtag('consent','update',{analytics_storage:'granted'});
    enableHubSpotTracking();
    if(analyticsLoaded)return;
    analyticsLoaded=true;
    loadScript('sth-google-tag','https://www.googletagmanager.com/gtag/js?id='+encodeURIComponent(TAG_ID));
    window.gtag('js',new Date());
    window.gtag('set','linker',{domains:['slopestohope.com']});
    window.gtag('config',TAG_ID);
    document.documentElement.dataset.analyticsMeasurementId=MEASUREMENT_ID;
  }
  function disableAnalytics(){window.gtag('consent','update',{analytics_storage:'denied'});disableHubSpotTracking();document.documentElement.removeAttribute('data-analytics-measurement-id');}
  function ensureSettingsControl(){
    var links=document.querySelector('footer .sth-footer-links');
    if(!links)return;
    var button=links.querySelector('[data-open-cookie-settings]')||document.querySelector('footer [data-open-cookie-settings]');
    if(!button){
      button=document.createElement('button');
      button.type='button';
      button.setAttribute('data-open-cookie-settings','');
      button.textContent='Cookie settings';
    }
    button.hidden=false;
    links.appendChild(button);
  }
  function render(){
    ensureSettingsControl();
    var panel=document.createElement('section');
    panel.className='sth-consent';panel.id='sth-cookie-consent';panel.setAttribute('role','dialog');panel.setAttribute('aria-modal','false');panel.setAttribute('aria-labelledby','sth-consent-title');
    panel.innerHTML='<p id="sth-consent-title"><strong>Analytics and privacy</strong></p><p>We use analytics to understand how visitors use this site. Analytics is enabled by default, and you can turn it off or back on here. See our <a href="/privacy-policy/">Privacy Policy</a>.</p><div class="sth-consent__actions"><button type="button" data-consent="granted">Accept analytics</button><button type="button" data-consent="denied">Decline analytics</button></div>';
    document.body.appendChild(panel);
    var settings=document.querySelector('[data-open-cookie-settings]');
    function show(){panel.classList.add('is-visible');panel.querySelector('button').focus();}
    function hide(){panel.classList.remove('is-visible');if(settings)settings.focus({preventScroll:true});}
    panel.addEventListener('click',function(event){var value=event.target&&event.target.getAttribute('data-consent');if(!value)return;remember(value);if(value==='granted')enableAnalytics();else disableAnalytics();hide();});
    document.querySelectorAll('[data-open-cookie-settings]').forEach(function(button){button.addEventListener('click',show);});
    panel.addEventListener('keydown',function(event){if(event.key==='Escape'&&preference())hide();});
    // Enable analytics by default unless the visitor previously opted out.
    // The footer control remains available to change the setting at any time.
    var saved=preference();if(saved==='denied')disableAnalytics();else enableAnalytics();
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',render);else render();
})();
