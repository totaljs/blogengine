const SVG = '<svg width="100%" height="100%" viewBox="0 0 {0} {1}" version="1.1" xmlns="http://www.w3.org/2000/svg"><rect x="0" y="0" width="{0}" height="{1}" style="fill:#bbb"/></svg>';

FUNC.cl = function(callback) {
	RESTBuilder.GET('https://bufferwall.com/api/ex/cl/').header('x-token', CONF.token).exec(callback);
};

FUNC.account = function(callback) {
	RESTBuilder.GET('https://bufferwall.com/api/ex/account/').header('x-token', CONF.token).exec(callback);
};

FUNC.posts = function(query, callback) {
	RESTBuilder.GET('https://bufferwall.com/api/ex/posts/', query).header('x-token', CONF.token).exec(callback);
};

function replaceimages(text) {

	// External
	if (text.indexOf('https://bufferwall.com/download/') == -1)
		return text;

	var index = text.indexOf('_');
	if (index === -1)
		return text;

	var size = text.substring(index + 1, text.indexOf('.', index)).split('x');
	if (size.length !== 2)
		return text;
	return '<img src="data:image/svg+xml;base64,' + Buffer.from(SVG.format(size[0], size[1]), 'utf8').toString('base64') + '" data-src="' + text.substring(10);
}

FUNC.posts_detail = function(id, callback) {
	RESTBuilder.GET('https://bufferwall.com/api/ex/posts/' + id).header('x-token', CONF.token).exec(function(err, response) {

		if (response instanceof Array) {
			callback(response[0].error, null);
			return;
		}

		if (response && response.body)
			response.body = response.body.replace(/<img src\=".*?"/g, replaceimages);

		callback(err, response);
	});
};

function refresh() {

	FUNC.cl(function(err, response) {
		MAIN.cl = response;
	});

	FUNC.account(function(err, response) {
		MAIN.account = response;
	});
}

function init() {

	FUNC.cl(function(err, response) {
		MAIN.cl = response;
		PAUSESERVER('codelist');
	});

	FUNC.account(function(err, response) {
		MAIN.account = response;
		PAUSESERVER('account');
	});
}


ON('service', function(counter) {
	if (counter % 5 === 0)
		refresh();
});

ON('ready', init);

PAUSESERVER('codelist');
PAUSESERVER('account');