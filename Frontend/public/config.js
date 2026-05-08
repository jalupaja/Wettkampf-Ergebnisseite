// Runtime config used by the frontend. During container runtime this file is
// generated from the environment; this default is suitable for local dev.
// Runtime config used by the frontend. During container runtime this file is
// generated from the environment; this default is suitable for local dev.
//
// Use the page's host for the API base so the frontend works when accessed
// via localhost or the machine's network address (e.g. http://192.168.x.y:5173).
// Previously this hard-coded "http://localhost:3001" caused browsers on
// other machines to attempt to reach their own localhost which fails and
// shows a generic CORS/network error. By using the page hostname we ensure
// the browser talks to the backend running on the same machine that serves
// the frontend preview.
;(function(){
  const proto = (typeof location !== 'undefined' && location.protocol) ? location.protocol.replace(':','') : 'http';
  const host = (typeof location !== 'undefined' && location.hostname) ? location.hostname : 'localhost';
  window.RUNTIME_CONFIG = {
    VITE_API_URL: `${proto}://${host}:3001`
  };
})();
