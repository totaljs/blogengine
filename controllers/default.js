exports.install = function() {
	ROUTE('GET /', posts);
	ROUTE('GET /posts/{id}/', posts_detail);
	ROUTE('GET /tiles/', tiles);
	ROUTE('GET /rss/', rss);
	ROUTE('GET /json/', json);
	ROUTE('GET /{category}/', posts_category);
	ROUTE('GET /api/tiles/{id}/', tiles_detail);
};

function posts() {
	var self = this;
	self.query.limit = self.query.page && self.query.page !== '1' ? 18 : 14;
	self.query.languageid = CONF.language;
	self.memorize(self.url + '?' + self.uri.search, '2 minutes', function() {

		var page = self.query.page || '1';
		if (page === '1' && CONF.tiles) {
			FUNC.posts(self.query, function(err, response) {

				if (err) {
					self.invalid(err);
					return;
				}

				if (CONF.tiles) {
					FUNC.tiles({ limit: 4 }, function(err, tiles) {
						response.tiles = tiles || EMPTYOBJECT;
						self.view('index', response);
					});
				} else
					self.view('index', response);
			});
		} else
			FUNC.posts(self.query, self.callback('index'));
	});
}

function tiles() {
	var self = this;
	self.query.limit = 16;
	self.query.languageid = CONF.language;
	self.memorize(self.url + '?' + self.uri.search, '2 minutes', function() {
		FUNC.tiles(self.query, self.callback('tiles'));
	});
}

function tiles_detail(id) {
	var self = this;
	self.memorize(self.url, '1 minute', function() {
		FUNC.tiles_detail(id, self.callback());
	});
}

function posts_detail(id) {
	var self = this;
	self.memorize(self.url, '1 minute', function() {
		FUNC.posts_detail(id, self.callback('detail'));
	});
}

function json() {
	var self = this;
	self.query.languageid = CONF.language;
	FUNC.posts(self.query, function(err, response) {
		if (err)
			self.invalid(err);
		else {
			for (var item of response.items)
				item.url = CONF.url + '/posts/{0}/'.format(item.id);
			self.json(response.items);
		}
	});
}

function rss() {
	var self = this;
	self.memorize(self.url + '?' + self.uri.search, '2 minutes', function() {
		self.query.languageid = CONF.language;
		FUNC.posts(self.query, function(err, response) {

			if (err) {
				self.invalid(err);
				return;
			}

			var builder = ['<?xml version="1.0" encoding="UTF-8" ?><rss version="2.0"><channel><title>{name}</title><link>{url}</link><description>{description}</description>'.arg(CONF, 'html')];
			for (var item of response.items) {
				item.url = CONF.url;
				builder.push('<item><title>{name}</title><link>{url}/posts/{id}/</link><description>{summary}</description><image><url>{picture}</url></image></item>'.arg(item, 'html'));
			}
			builder.push('</channel></rss>');
			self.content(builder.join(''), 'text/xml');
		});
	});
}

function posts_category(category) {
	var self = this;
	var category = MAIN.cl && MAIN.cl.categories ? MAIN.cl.categories.findItem('linker', category) : null;
	if (category) {
		self.memorize(self.url + '?' + self.uri.search, '2 minutes', function() {
			self.query.categoryid = category.id;
			self.query.languageid = CONF.language;
			self.query.limit = self.query.page && self.query.page !== '1' ? 15 : 14;
			self.title(category.name);
			FUNC.posts(self.query, self.callback('index'));
		});
	} else
		self.throw404();
}