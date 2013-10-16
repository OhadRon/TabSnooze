console.log('TabSnooze Loaded!');


// Analytics
var _gaq = _gaq || [];
_gaq.push(['_setAccount', 'UA-44909415-1']);
_gaq.push(['_trackPageview']);

(function() {
  var ga = document.createElement('script'); ga.type = 'text/javascript'; ga.async = true;
  ga.src = 'https://ssl.google-analytics.com/ga.js';
  var s = document.getElementsByTagName('script')[0]; s.parentNode.insertBefore(ga, s);
})();

// Get main storage
var storage = chrome.storage.local;

// Defaults
var DEFAULT_OPTIONS = {
	closetab: true,
	notifications: true,
	snoozebar: true,
	background: true,
	timepresets: [0.0005, 0.16, 1, 2, 6, 12, 24, 168]
}

// Set default options if they're not set
storage.get('options', function(result){
	console.log(result.options);
	if (!result.options){
		storage.set({ options : DEFAULT_OPTIONS }, function(){});
		_gaq.push(['_trackEvent', 'Installed', 'Installed']);
	}
});

// Set up empty snooze list if not set
storage.get('snoozeList', function(result){
	if (!result.snoozeList)	storage.set({ snoozeList : {}}, function(){});
});

// Listener for updated tabs
chrome.tabs.onUpdated.addListener(showPageAction);

function showPageAction(tabId, changeInfo, tab) {
	if(changeInfo.status=='complete'){
	    chrome.pageAction.show(tabId);
	}
};

var lastOpenedTab;

function snooze(tab, time){
	
	// Decide on the name of the snooze in the storage
	var snoozeId = 'snoozeTab'+tab.id;

	console.log("Snoozing "+tab.title+" in "+time+" seconds. ("+snoozeId+")");

	var url = tab.url;

	_gaq.push(['_trackEvent', 'Snoozing', 'Snoozing', 'Snoozing', time]);

	var openTime = Date.now() + (time * 1000);

	tab.openTime = openTime;
	tab.snoozeTime = Date.now();
	tab.snoozedAlready = false;

	chrome.alarms.create(snoozeId, { when: openTime });
	chrome.tabs.remove(tab.id);

	// Store the tab info under the snoozeId
	storage.get('snoozeList', function(result){
		var newList = result.snoozeList;
		newList[snoozeId] = tab;
		storage.set({ snoozeList : newList}, function(){});
	});

}

chrome.alarms.onAlarm.addListener(function(alarm){
	storage.get('snoozeList',function(result){

		var tab;
		tab = result.snoozeList[alarm.name];

		var newTab;

		console.log('Creating new tab: '+tab.title);

		_gaq.push(['_trackEvent', 'Snooze Succesful', 'Snooze Succesful']);

		chrome.tabs.create({
			index: 999,
			url: tab.url,
			active: false
		}, function(createdTab){
			lastOpenedTab = createdTab;
			chrome.tabs.executeScript(createdTab.id, {'file':'jquery.min.js'});
			chrome.tabs.executeScript(createdTab.id, {'file':'content.js'});
			chrome.tabs.insertCSS(createdTab.id, {'file':'content.css'});
		});
		
		chrome.notifications.create('snooze'+tab.id,{
			type: "basic",
			title: "Tab Woke Up!",
			message: tab.title,
			iconUrl: "images/icon19.png"
		}, function(){
			_gaq.push(['_trackEvent', 'Notification Created', 'Notification Created']);
		});
	});
});

chrome.notifications.onClicked.addListener(function(notificationId){
	console.log('Notification clicked for tab '+lastOpenedTab.id);
	console.log('Focusing tab (tab '+lastOpenedTab.id+') (window '+lastOpenedTab.windowId+')');
	chrome.tabs.update(lastOpenedTab.id, {selected: true});
	chrome.windows.update(lastOpenedTab.windowId, {focused:true});
	chrome.notifications.clear(notificationId, function(){});
	_gaq.push(['_trackEvent', 'Notification Cleared']);
});			
