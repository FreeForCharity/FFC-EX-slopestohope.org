(function(){
  'use strict';
  var PRODUCTION_HOSTS=['slopestohope.org','www.slopestohope.org'];
  var RESTRICTED_REGIONS=['AT','BE','BG','HR','CY','CZ','DK','EE','FI','FR','DE','GR','HU','IE','IT','LV','LT','LU','MT','NL','PL','PT','RO','SK','SI','ES','SE','IS','LI','NO','GB','CH'];
  var TAG_ID='GT-MKTP8299';
  var MEASUREMENT_ID='G-XEWDW3TYVZ';

  // Analytics is never initialized in local, preview, or arbitrary hosts.
  if(PRODUCTION_HOSTS.indexOf(window.location.hostname.toLowerCase())===-1)return;
  if(window.__sthGoogleTagConfigured)return;

  window.dataLayer=window.dataLayer||[];
  window.gtag=window.gtag||function(){window.dataLayer.push(arguments);};

  // Region defaults are queued before any configuration command. Google applies
  // the region-specific default over the global default for restricted visitors.
  window.gtag('consent','default',{
    analytics_storage:'denied',
    ad_storage:'denied',
    ad_user_data:'denied',
    ad_personalization:'denied',
    region:RESTRICTED_REGIONS
  });
  window.gtag('consent','default',{
    analytics_storage:'granted',
    ad_storage:'denied',
    ad_user_data:'denied',
    ad_personalization:'denied'
  });

  window.__sthGoogleTagConfigured=true;
  window.gtag('js',new Date());
  window.gtag('set','linker',{domains:['slopestohope.com']});
  window.gtag('config',TAG_ID,{
    allow_google_signals:false,
    allow_ad_personalization_signals:false
  });
  var script=document.createElement('script');
  script.id='sth-google-tag';
  script.async=true;
  script.src='https://www.googletagmanager.com/gtag/js?id='+encodeURIComponent(TAG_ID);
  document.head.appendChild(script);
  document.documentElement.dataset.analyticsMeasurementId=MEASUREMENT_ID;
})();
