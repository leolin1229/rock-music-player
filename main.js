/**
 * Listens for the app launching then creates the window
 *
 * @see http://developer.chrome.com/apps/app.window.html
 */
// Use the runtime event listeners to set a window property indicating whether the
// app was launched normally or as a result of being restarted

chrome.app.runtime.onLaunched.addListener(function(data) {
    chrome.app.window.create('index.html', 
    	{bounds: {width:1150, height:650}, minWidth:1150, minHeight:600,  id:"EMP"}, 
    	function(app_win) {
    		app_win.contentWindow.__EMP__bRestart = false;
    	}
    );
    console.log("app launched");
});

chrome.app.runtime.onRestarted.addListener(function() {
    chrome.app.window.create('index.html', 
    	{bounds: {width:1150, height:650}, minWidth:1150, minHeight:600, id:"EMP"}, 
    	function(app_win) {
    		app_win.contentWindow.__EMP__bRestart = true;
    	}
    );
    console.log("app restarted");
});
