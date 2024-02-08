const SVG = '<svg width="100%" height="100%" viewBox="0 0 {0} {1}" version="1.1" xmlns="http://www.w3.org/2000/svg"><rect x="0" y="0" width="{0}" height="{1}" style="fill:#bbb"/></svg>';

FUNC.cl = function(callback) {
	var language = CONF.language;
	RESTBuilder.GET('https://bufferwall.com/api/ex/cl/' + (language ? ('?languageid=' + language) : '')).header('x-token', CONF.token).exec(callback);
};

FUNC.account = function(callback) {
	RESTBuilder.GET('https://bufferwall.com/api/ex/account/').header('x-token', CONF.token).exec(callback);
};

FUNC.posts = function(query, callback, timeoutcount) {

	if (timeoutcount > 3) {
		callback('Timeout', null);
		return;
	}

	RESTBuilder.GET('https://bufferwall.com/api/ex/posts/', query).header('x-token', CONF.token).exec(function(err, response, output) {
		if (output.status === 408)
			setTimeout(FUNC.posts, 500, query, callback, (timeoutcount || 0) + 1);
		else
			callback(err, response);
	});
};

FUNC.tiles = function(query, callback) {
	RESTBuilder.GET('https://bufferwall.com/api/ex/tiles/', query).header('x-token', CONF.token).exec(callback);
};

FUNC.posts_detail = function(id, callback) {
	RESTBuilder.GET('https://bufferwall.com/api/ex/posts/' + id).header('x-token', CONF.token).exec(function(err, response) {

		if (response instanceof Array) {
			callback(response[0].error, null);
			return;
		}

		callback(err, response);
	});
};

FUNC.tiles_detail = function(id, callback) {
	RESTBuilder.GET('https://bufferwall.com/api/ex/tiles/' + id).header('x-token', CONF.token).exec(function(err, response) {
		if (response instanceof Array)
			callback(response[0].error, null);
		else
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