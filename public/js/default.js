function resizeforce() {

	var w = WIDTH();
	if (w === 'xs' || w === 'sm')
		return;

	var el = $('.body');
	if (el.length) {
		var h = WH - el.offset().top - 200;
		el.css('min-height', h);
		$('.panel').css('min-height', el.height());
	} else
		setTimeout(resizeforce, 500);
}

$(W).on('resize', resizeforce);
ON('ready', function() {
	resizeforce();
	setTimeout(resizeforce, 1000);
	setTimeout(resizeforce, 3000);
	setTimeout(resizeforce, 5000);
});

function tiledetail(id) {
	if (id instanceof jQuery)
		id = id.attrd('id');

	id = id.replace('tile', '');

	if (id.length > 25 || !(/^\d+/).test(id))
		return;

	location.hash = 'tile' + id;
	setTimeout2('tiledetail', function(id) {
		AJAX('GET /api/tiles/' + id, function(response) {
			SETTER('tiledetail/show', response, tiledetail);
		});
	}, 100, null, id);
}

$(W).on('hashchange', function() {
	if (location.hash.length > 10)
		tiledetail(location.hash.substring(1));
});

if (location.hash && location.hash.length > 10)
	tiledetail(location.hash.substring(1));
