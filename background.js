var timeStamp = function(){
	return '[' + new Date().toTimeString() + '] ';
}

console.log(timeStamp(), 'TabSnooze Loaded!');


var currentVersion = chrome.app.getDetails().version;
var loadTime = Date.now();

// Analytics
var _gaq = _gaq || [];
_gaq.push(['_setAccount', 'UA-44909415-1']);
_gaq.push(['_trackPageview']);
_gaq.push(['_trackEvent', 'Loaded', 'Loaded', currentVersion ]);

(function() {
  var ga = document.createElement('script'); ga.type = 'text/javascript'; ga.async = true;
  ga.src = 'https://ssl.google-analytics.com/ga.js';
  var s = document.getElementsByTagName('script')[0]; s.parentNode.insertBefore(ga, s);
})();

// Get main storage
var storage = chrome.storage.local;

// Inform when the extension has been upgraded
chrome.runtime.onInstalled.addListener(function (details){
	if (details.previousVersion != currentVersion){
		console.log('Version upgraded:', currentVersion);
		_gaq.push(['_trackEvent', 'Upgraded', 'Upgraded', currentVersion]);		
	}
});

// Refresh everything on a new session
chrome.runtime.onStartup.addListener(function(){
	console.log(timeStamp(), 'Startup detected, reloading.')
	chrome.runtime.reload();
});


function seeStorage(){
	chrome.storage.local.get(null,function(result){ console.log(result)});
}

function seeOptions(){
	chrome.storage.local.get('options',function(result){ console.log(result)});
}

function clearStorage(){
	storage.set({ snoozeList : {}}, function(){});
}

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
	console.log(timeStamp(),'Current options:', result.options);
	if (!result.options){
		storage.set({ options : DEFAULT_OPTIONS }, function(){});
		_gaq.push(['_trackEvent', 'Installed', 'Installed']);
	}
});

// Set up empty snooze list if not set
storage.get('snoozeList', function(result){
	if (!result.snoozeList)	storage.set({ snoozeList : {}}, function(){});
});


function clearUsedAlarms(){
	console.log('Clearing used alarms...');
	var clearCount = 0;
	storage.get('snoozeList', function(result){
		var newList = result.snoozeList;
		for (var snooze in newList){
			var thisSnooze = newList[snooze];
			if (thisSnooze.openedAlready){
				delete newList[snooze];
				clearCount += 1;
			} else if (thisSnooze.openingTime < Date.now()-15000){
				console.warn('Deleting failed snooze', newList[snooze]);
				delete newList[snooze];
				clearCount += 1;
			}
		};
		storage.set({ snoozeList : newList}, function(){});
		console.log(timeStamp(),'Finished clearing '+clearCount+ ' alarms.');
	});
}

clearUsedAlarms();

// Listener for updated tabs
chrome.tabs.onUpdated.addListener(showPageAction);

// Shows the page action when tab url is ready
function showPageAction(tabId, changeInfo, tab) {
	// if(changeInfo.status=='complete'){
	    chrome.pageAction.show(tabId); 
	// } TODO: figure out why sometimes there's no tabID ready.
};

function snooze(tab, time){
	
	// Decide on the name of the snooze in the storage
	var snoozeId = 'snoozeTab'+tab.id;

	console.log(timeStamp(),"Snoozing "+tab.title+" in "+time+" seconds. ("+snoozeId+")");

	var url = tab.url;

	_gaq.push(['_trackEvent', 'Snoozing', 'Snoozing', 'Snoozing', time]);

	var openingTime = Date.now() + (time * 1000);

	tab.openingTime = openingTime;
	tab.snoozeTime = Date.now();
	tab.openedAlready = false;

	chrome.alarms.create(snoozeId, { when: openingTime });

	// Store the tab info under the snoozeId
	storage.get('snoozeList', function(result){
		var newList = result.snoozeList;
		newList[snoozeId] = tab;
		console.log(timeStamp(),'Storing alarm', snoozeId);
		storage.set({ snoozeList : newList}, function(){});
	});

	// Close the tab if the options say so.
	storage.get('options', function(result){
		if(result.options.closetab){
			chrome.tabs.remove(tab.id);
		}
	});
}

function deleteSnooze(id){
	var deletionAlarmName = 'snoozeTab'+id;
	console.log('deleting alarm', deletionAlarmName);
	chrome.alarms.clear(deletionAlarmName);

	storage.get('snoozeList', function(result){
		var newList = result.snoozeList;
		delete newList[deletionAlarmName];
		console.log(timeStamp(),'Deleted snooze', id);
		storage.set({ snoozeList : newList}, function(){});
	});

}

chrome.alarms.onAlarm.addListener(function(alarm){
	console.log(timeStamp(),'Alarm activated:', alarm)
	storage.get(function(result){

		var tab = result.snoozeList[alarm.name];

		if (!tab){
			console.warn(timeStamp(),'No corresponding snooze for this alarm!',alarm.name);
		}

		// Get the options
		var options = result.options;
		var newTab;

		console.log(timeStamp(),'Creating new tab: '+tab.title, tab);

		var createTheNewTab = function(){
			chrome.tabs.create({
				url: tab.url,
				active: !options.background // Decide if the created tab should be active
			}, function(createdTab){
				console.log(timeStamp(),'Created a tab:',createdTab);
				if (createdTab){ // To make sure we don't make a party for errors
					if (options.snoozebar){
						console.log('Showing snoozebar', createdTab.id);
						chrome.tabs.executeScript(createdTab.id, {'file':'jquery.min.js'});
						chrome.tabs.executeScript(createdTab.id, {'file':'moment.min.js'});
						chrome.tabs.insertCSS(createdTab.id, {'file':'content.css'});
						var whenCreated = tab.snoozeTime;
						// Pass the snooze time parameter to the content script.
						chrome.tabs.executeScript(createdTab.id, {code:'var whenCreated='+whenCreated+';'});
						chrome.tabs.executeScript(createdTab.id, {code:'var backgroundOpen='+options.background+';'});
						chrome.tabs.executeScript(createdTab.id, {'file':'content.js'});
					}
					if (options.notifications){		
						console.log('Showing notification', createdTab.id);
						chrome.notifications.create('snoozeNotif'+createdTab.id,{
							type: "basic",
							title: "A Tab Woke Up!",
							message: tab.title,
							eventTime: Date.now(),
							iconUrl: "images/icon19.png"
						}, function(){
							_gaq.push(['_trackEvent', 'Notification Created', 'Notification Created']);
						});
					}

					// Mark the current alarm as opened already.
					var newList = result.snoozeList;
					newList[alarm.name].openedAlready = true;
					newList[alarm.name].realOpeningTime = Date.now();
					storage.set({ snoozeList : newList}, function(){});				
					_gaq.push(['_trackEvent', 'Snooze Succesful', 'Snooze Succesful']);
				} else {
					// If the tab creation was failed because the window was not ready, delay by a few seconds.
					console.warn(timeStamp(),'Tab creation failed! Delaying alarm', alarm);
					chrome.alarms.create(alarm.name, { when: Date.now()+4000 });
				}
			});			
		};

		createTheNewTab();
	});
});

chrome.notifications.onClicked.addListener(function(notificationId){
	// Get the tab id
	var tabId = parseInt(notificationId.substr(11));
	console.log('Notification clicked for tab '+tabId);
	// Get the actual tab object
	chrome.tabs.get(tabId, function(tab){
		if(tab){	
			console.log('Focusing tab (tab '+tab.id+') (window '+tab.windowId+')');
			chrome.tabs.update(tab.id, {selected: true});
			chrome.windows.update(tab.windowId, {focused:true});
			chrome.notifications.clear(notificationId, function(){});
			_gaq.push(['_trackEvent', 'Notification Cleared']);
		} else {
			console.log('Tab was not found',tabId);
		}
	});
});			
