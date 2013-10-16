
var BGPage = chrome.extension.getBackgroundPage();

document.activeElement.blur();


var _gaq = _gaq || [];
_gaq.push(['_setAccount', 'UA-44909415-1']);
_gaq.push(['_trackPageview']);

(function() {
  var ga = document.createElement('script'); ga.type = 'text/javascript'; ga.async = true;
  ga.src = 'https://ssl.google-analytics.com/ga.js';
  var s = document.getElementsByTagName('script')[0]; s.parentNode.insertBefore(ga, s);
})();


$('#settings').on('click',function(){
	chrome.tabs.create({
		'url': chrome.extension.getURL("options.html"),
		'active':true
	});
});

var storage = chrome.storage.local;

$(window).ready(function(){
	storage.get('options', function(result){
		var currentOptions;
		currentOptions = result.options;


		for (var i = 0; i < currentOptions.timepresets.length; i++) {
			var newTimePreset;
			newTimePreset = currentOptions.timepresets[i]*3600;
			var timeString = moment().add('ms',newTimePreset*1000).fromNow(true);
			var line = '<div><a href="#" data-time="'+newTimePreset+'">'+timeString+'</a></div>'

			$('#snoozeoptions').append(line);
		};

		$('a').on('click',function(){
		   	console.log('snooze clicked');

		   	var time = parseInt($(this).attr('data-time'));	   	

		   	chrome.tabs.query({
		   		active: true
		   	},function(thisTab){
		   		BGPage.snooze(thisTab[0], time);
		   	});

	   		window.close();
		});

	});
});