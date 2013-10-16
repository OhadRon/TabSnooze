

$(window).ready(function(){

	whenCreated = moment(whenCreated).fromNow();

	$('body').prepend('<div id="tabsnoozelayer">You snoozed this tab '+ whenCreated+'.<div id="tabsnoozelayerx">x</div></div>');

	$('#tabsnoozelayerx, #tabsnoozelayer').on('click',function(){
		$('#tabsnoozelayer').slideUp(100, function(){
			$('#tabsnoozelayer').remove();
		});
	});

	$('#tabsnoozelayer').hide();

	if(!backgroundOpen){
		$('#tabsnoozelayer').slideDown(400);
	} else {
		$(window,document).on('focus hover click scroll',function(){
			$('#tabsnoozelayer').slideDown(400);
		});

	}
})