PNG EARN CONNECT — Mobile-ready web app package

This updated project includes mobile layout refinements, a web app manifest, app icons, and a service worker for installability/offline caching.

FILES
- index.html: app screens
- css/style.css: responsive design
- js/app.js: demo interactions
- manifest.webmanifest: app install metadata
- service-worker.js: basic offline cache
- icons/: app icons

IMPORTANT
This is still a DEMO, not a production financial service. Account data/passwords are stored in browser localStorage and are not secure for real accounts. Do not use a real or reused password. No real earnings or payments are processed. Video recordings are not uploaded to a server.

ANDROID APK NEXT STEP
The project must be hosted over HTTPS before an online wrapper such as PWABuilder can assess/package it. The service worker and camera require HTTPS or localhost. This ZIP itself is not an APK. A suitable HTTPS host and APK build/signing step are still needed.

Keep all folders together when extracting. Do not open only index.html outside the project folder, or the CSS/JavaScript may not load.
