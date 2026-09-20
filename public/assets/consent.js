(function(){
  'use strict';
  var KEY='slopesToHopeAnalyticsConsent';
  var COOKIE='sth_analytics';
  var TAG_ID='GT-MKTP8299';
  var MEASUREMENT_ID='G-XEWDW3TYVZ';
  var HUBSPOT_PORTAL_ID='244348981';
  var PRIOR_CONSENT_COUNTRIES=new Set(['AT','BE','BG','HR','CY','CZ','DE','DK','EE','ES','FI','FR','GR','HU','IE','IT','LT','LU','LV','MT','NL','PL','PT','RO','SE','SI','SK','IS','LI','NO','GB','GG','JE','IM']);
  var analyticsLoaded=false;
  var regionDecision='pending';

  function cookiePreference(){
    var match=document.cookie.match(/(?:^|;\s*)sth_analytics=(granted|denied)(?:;|$)/);
    return match?match[1]:null;
  }
  function preference(){
    var stored=null;
    try{stored=localStorage.getItem(KEY);}catch(_error){}
    var cookie=cookiePreference();
    if(stored==='denied'||cookie==='denied')return 'denied';
    if(stored==='granted'||cookie==='granted')return 'granted';
    return null;
  }
  function writePreferenceCookie(value){
    if(value!=='granted'&&value!=='denied')return;
    var cookie=COOKIE+'='+value+'; Path=/; Max-Age=31536000; SameSite=Lax';
    if(location.protocol==='https:')cookie+='; Secure';
    document.cookie=cookie;
  }
  function remember(value){
    try{localStorage.setItem(KEY,value);}catch(_error){}
    writePreferenceCookie(value);
  }
  function isCloudflareRumUrl(value){
    if(!value)return false;
    try{
      var url=new URL(String(value),location.href);
      return url.hostname==='static.cloudflareinsights.com'||
        ((url.hostname===location.hostname||url.hostname==='cloudflareinsights.com')&&url.pathname==='/cdn-cgi/rum');
    }catch(_error){return false;}
  }
  function analyticsDenied(){
    var saved=preference();
    return saved==='denied'||(saved===null&&regionDecision!=='allowed');
  }
  function rumScriptMustBeRemoved(){
    var saved=preference();
    return saved==='denied'||regionDecision==='blocked';
  }
  function removeCloudflareRumScripts(root){
    if(!rumScriptMustBeRemoved())return;
    (root||document).querySelectorAll?.('script[src*="static.cloudflareinsights.com/beacon.min.js"]').forEach(function(script){script.remove();});
  }
  function installCloudflareRumGuard(){
    if(window.__sthCloudflareRumGuardInstalled)return;
    window.__sthCloudflareRumGuardInstalled=true;

    if(typeof navigator.sendBeacon==='function'){
      var nativeSendBeacon=navigator.sendBeacon.bind(navigator);
      try{
        navigator.sendBeacon=function(url,data){
          if(analyticsDenied()&&isCloudflareRumUrl(url))return true;
          return nativeSendBeacon(url,data);
        };
      }catch(_error){}
    }

    if(typeof window.fetch==='function'){
      var nativeFetch=window.fetch.bind(window);
      window.fetch=function(input,init){
        var url=typeof input==='string'||input instanceof URL?String(input):input&&input.url;
        if(analyticsDenied()&&isCloudflareRumUrl(url))return Promise.resolve(new Response(null,{status:204,statusText:'No Content'}));
        return nativeFetch(input,init);
      };
    }

    if(window.XMLHttpRequest){
      var nativeOpen=XMLHttpRequest.prototype.open;
      var nativeSend=XMLHttpRequest.prototype.send;
      XMLHttpRequest.prototype.open=function(method,url){
        this.__sthCloudflareRumUrl=url;
        return nativeOpen.apply(this,arguments);
      };
      XMLHttpRequest.prototype.send=function(){
        if(analyticsDenied()&&isCloudflareRumUrl(this.__sthCloudflareRumUrl))return;
        return nativeSend.apply(this,arguments);
      };
    }

    removeCloudflareRumScripts(document);
    if(window.MutationObserver&&document.documentElement){
      new MutationObserver(function(records){
        if(!rumScriptMustBeRemoved())return;
        records.forEach(function(record){
          record.addedNodes.forEach(function(node){
            if(node.nodeType!==1)return;
            if(node.matches?.('script[src*="static.cloudflareinsights.com/beacon.min.js"]'))node.remove();
            else removeCloudflareRumScripts(node);
          });
        });
      }).observe(document.documentElement,{childList:true,subtree:true});
    }
  }

  installCloudflareRumGuard();
  window.disableHubSpotCookieBanner=true;
  window.dataLayer=window.dataLayer||[];
  window.gtag=window.gtag||function(){window.dataLayer.push(arguments);};
  var savedPreference=preference();
  if(savedPreference)writePreferenceCookie(savedPreference);
  window.gtag('consent','default',{analytics_storage:savedPreference==='granted'?'granted':'denied',ad_storage:'denied',ad_user_data:'denied',ad_personalization:'denied',personalization_storage:'denied'});

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
  function deleteGoogleAnalyticsCookies(){
    document.cookie.split(';').forEach(function(cookie){
      var name=cookie.split('=')[0].trim();
      if(name==='_ga'||name.indexOf('_ga_')===0){
        document.cookie=name+'=; Path=/; Max-Age=0; SameSite=Lax';
      }
    });
  }
  function enableAnalytics(){
    regionDecision='allowed';
    window['ga-disable-'+MEASUREMENT_ID]=false;
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
  function disableAnalytics(){
    regionDecision='blocked';
    window['ga-disable-'+MEASUREMENT_ID]=true;
    window.gtag('consent','update',{analytics_storage:'denied'});
    disableHubSpotTracking();
    removeCloudflareRumScripts(document);
    document.getElementById('sth-google-tag')?.remove();
    document.getElementById('sth-hubspot-tracking')?.remove();
    deleteGoogleAnalyticsCookies();
    analyticsLoaded=false;
    document.documentElement.removeAttribute('data-analytics-measurement-id');
  }
  function markReady(mode){
    document.documentElement.dataset.analyticsConsentMode=mode;
    window.__sthAnalyticsReady=true;
  }
  async function detectCountry(){
    var controller=typeof AbortController==='function'?new AbortController():null;
    var timeout=controller?setTimeout(function(){controller.abort();},3000):null;
    try{
      var options={cache:'no-store',credentials:'omit'};
      if(controller)options.signal=controller.signal;
      var response=await fetch('/cdn-cgi/trace',options);
      if(!response.ok)return null;
      var text=await response.text();
      var match=text.match(/(?:^|\n)loc=([A-Z]{2})(?:\n|$)/);
      return match?match[1]:null;
    }catch(_error){return null;}
    finally{if(timeout)clearTimeout(timeout);}
  }
  function requiresPriorConsent(country){return !!country&&PRIOR_CONSENT_COUNTRIES.has(country);}
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
    panel.innerHTML='<p id="sth-consent-title"><strong>Analytics and privacy</strong></p><p>We use analytics and performance measurement to understand how visitors use this site. Where prior consent is required, analytics stays off until you accept. Elsewhere, analytics is enabled by default and you can opt out at any time. See our <a href="/privacy-policy/">Privacy Policy</a>.</p><div class="sth-consent__actions"><button type="button" data-consent="granted">Accept analytics</button><button type="button" data-consent="denied">Decline analytics</button></div>';
    document.body.appendChild(panel);
    var settings=document.querySelector('[data-open-cookie-settings]');
    function show(){panel.classList.add('is-visible');panel.querySelector('button').focus();}
    function hide(){panel.classList.remove('is-visible');if(settings)settings.focus({preventScroll:true});}
    panel.addEventListener('click',function(event){
      var value=event.target&&event.target.getAttribute('data-consent');
      if(!value)return;
      remember(value);
      if(value==='granted')enableAnalytics();else disableAnalytics();
      hide();
      markReady(value==='granted'?'user-granted':'user-denied');
    });
    document.querySelectorAll('[data-open-cookie-settings]').forEach(function(button){button.addEventListener('click',show);});
    panel.addEventListener('keydown',function(event){if(event.key==='Escape')hide();});

    var saved=preference();
    if(saved==='denied'){
      disableAnalytics();
      markReady('saved-denied');
      return;
    }
    if(saved==='granted'){
      enableAnalytics();
      markReady('saved-granted');
      return;
    }

    regionDecision='pending';
    detectCountry().then(function(country){
      var current=preference();
      if(current==='denied'){disableAnalytics();markReady('saved-denied');return;}
      if(current==='granted'){enableAnalytics();markReady('saved-granted');return;}
      if(requiresPriorConsent(country)||!country){
        disableAnalytics();
        show();
        markReady(country?'prior-consent':'prior-consent-fallback');
      }else{
        enableAnalytics();
        markReady('default-on');
      }
    });
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',render);else render();
})();
