function resizeforce() {
	var w = WIDTH();
	if (w === 'xs' || w === 'sm')
		return;
	var el = $('.body');
	var h = WH - el.offset().top - 200;
	el.css('min-height', h);
	$('.panel').css('min-height', el.height());
}

$(window).on('resize', resizeforce);
ON('ready', function() {
	resizeforce();
	setTimeout(resizeforce, 1000);
	setTimeout(resizeforce, 3000);
	setTimeout(resizeforce, 5000);
});