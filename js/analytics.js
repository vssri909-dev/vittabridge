// VittaBridge — Google Analytics
// Replace G-XXXXXXXXXX with your real Measurement ID from analytics.google.com

(function() {
  var GA_ID = 'G-75XM8KSW9Q';

  var script = document.createElement('script');
  script.async = true;
  script.src = 'https://www.googletagmanager.com/gtag/js?id=' + GA_ID;
  document.head.appendChild(script);

  window.dataLayer = window.dataLayer || [];
  function gtag(){ dataLayer.push(arguments); }
  gtag('js', new Date());
  gtag('config', GA_ID);
})();
