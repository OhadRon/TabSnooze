whenCreated = moment(whenCreated).fromNow();

$('body').append('<div id="tabsnoozelayer">You snoozed this tab '+ whenCreated+'.<div id="tabsnoozelayerx">x</div></div>');

$('#tabsnoozelayerx, #tabsnoozelayer').on('click',function(){
	$('#tabsnoozelayer').slideUp(100, function(){
		$('#tabsnoozelayer').remove();
	});
});

console.log(whenCreated);

$('#tabsnoozelayer').hide();

$(window).focus(function(){
	$('#tabsnoozelayer').slideDown(400);
});