const id = chrome.runtime.id;
chrome.webRequest.onBeforeRequest.addListener(
    function(details) { return {cancel: true, redirectUrl: `chrome-extension://${id}/main.html`}; },
    {urls: [`chrome-extension://${id}/*`]},
    ["blocking"]
  );

// get url client side window.location.href or 