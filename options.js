var BGPage = chrome.extension.getBackgroundPage();

console.log('Settings page loaded');

var _gaq = _gaq || [];
_gaq.push(['_setAccount', 'UA-44909415-1']);
_gaq.push(['_trackPageview']);

(function() {
  var ga = document.createElement('script'); ga.type = 'text/javascript'; ga.async = true;
  ga.src = 'https://ssl.google-analytics.com/ga.js';
  var s = document.getElementsByTagName('script')[0]; s.parentNode.insertBefore(ga, s);
})();

var storage = chrome.storage.local;

var snoozeList;

storage.get('snoozeList', function(result){
	snoozeList = result.snoozeList;


	// TODO: add a function in background.js that returns all the active snoozes, for this and for the popup count.

	for (var snooze in snoozeList){
		var thisSnooze = snoozeList[snooze];
		var timeFromNow = thisSnooze.openingTime-Date.now();

		var timeAgo = moment(thisSnooze.snoozeTime).fromNow();
		if(timeFromNow>0){	
			timeFromNow = (moment(thisSnooze.openingTime).fromNow());
			var image;
			if (thisSnooze.favIconUrl){
				image = '<img src="'+thisSnooze.favIconUrl+'">';
			} else {
				image = '';
			}
			var newLi = '<li>'+image+'<a href="'+thisSnooze.url+'">'+thisSnooze.title+'</a> '+timeFromNow+' (Snoozed '+ timeAgo+')<div class="deleteSnooze" data-id='+thisSnooze.id+'>delete</div></li>';
			$('#snoozeList').append(newLi);

			$('div.deleteSnooze[data-id='+thisSnooze.id+']').on('click', function(){
				var deletionAlarmName = 'snoozeTab'+$(this).attr('data-id');
				console.log('delete clicked', deletionAlarmName);
				$(this).parent('li').remove();
				chrome.alarms.clear(deletionAlarmName);
			});
		}
	}
});

$(window).load(function(){
	storage.get('options', function(result){
		var currentOptions;
		currentOptions = result.options;

		$('.optioncheckbox').each(function(){
			$(this).prop('checked', currentOptions[$(this).attr('data-option')]);
			$(this).change(function(){
				var optionName = $(this).attr('data-option');
				var newValue = $(this).prop('checked');
				storage.get('options', function(result){
					var newOptions = result.options;
					newOptions[optionName] = newValue;
					storage.set({ options : newOptions}, function(){});
				});
			});
		});

		$('input.timepreset').each(function(index){

			$(this).val(currentOptions.timepresets[index]);

			var $this = $(this);

			function validateIt(){
				if(isNumber($this.val())){
					var textValue = moment().add('h',$this.val()).fromNow(true);
					$this.siblings('.timedesc').text(textValue);
					$this.siblings('.timedesc').removeClass('error');
					storage.get('options', function(result){
						var newOptions = result.options;
						newOptions.timepresets[index] = parseFloat($this.val());
						storage.set({ options : newOptions}, function(){});
					});
				} else {
					$this.siblings('.timedesc').text('Not a valid number of hours');
					$this.siblings('.timedesc').addClass('error');
				}				
			};

			validateIt();

			$this.change(function(){
				validateIt();
			});

		});
	});

	$('#vinfo').text('Version '+chrome.app.getDetails().version);
});

// Check if something is a number (for hours)
function isNumber(n) {
  return !isNaN(parseFloat(n)) && isFinite(n);
};

