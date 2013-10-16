$('body').append('<div id="tabsnoozelayer">You snoozed this tab a while ago.<div id="tabsnoozelayerx">x</div></div>');

$('#tabsnoozelayerx, #tabsnoozelayer').on('click',function(){
	$('#tabsnoozelayer').slideUp(100, function(){
		$('#tabsnoozelayer').remove();
	});
});

$('#tabsnoozelayer').hide();

$(window).focus(function(){
	$('#tabsnoozelayer').slideDown(400);
});