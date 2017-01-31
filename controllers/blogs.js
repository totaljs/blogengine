exports.install = function() {
	F.route('#blogs', view_blogs, ['*Blog']);
	F.route('#category', view_blogs_category, ['*Blog']);
	F.route('#detail', view_blogs_detail, ['*Blog']);
	F.route('/rss/', rss, ['*Blog']);
};

function view_blogs() {
	var self = this;
	self.query.max = 10;
	self.query.draft = false;

	// Total.js monitoring fulltext stats
	self.query.search && MODULE('webcounter').inc('fulltext');

	// DB
	self.$query(self, self.callback('all'));
}

function view_blogs_category(category) {
	var self = this;

	self.repository.category = F.global.blogs.findItem('linker', category);
	if (!self.repository.category)
		return self.throw404();

	self.query.category = category;
	self.query.max = 10;
	self.query.draft = false;
	self.$query(self, self.callback('category'));
}

function view_blogs_detail(category, linker) {
	var self = this;

	self.repository.category = F.global.blogs.findItem('linker', category);
	if (!self.repository.category)
		return self.throw404();

	self.memorize('detail.{0}.{1}'.format(category, linker), '5 minutes', DEBUG, function() {

		self.query.linker = linker;
		self.query.category = category;

		self.$read(self, function(err, response) {

			if (err || !response)
				return self.throw404(err);

			if (!self.robot) {
				NOSQL('blogs').counter.hit(response.id);
				MODULE('webcounter').increment('blogs');
			}

			response.body = markdown(response.body);

			self.query.skip = response.id;
			self.query.max = 8;
			self.query.draft = false;
			self.query.page = 1;

			self.$query(self, function(err, items) {
				response.others = items;
				self.view('detail', response);
			});

		});
	});
}

function rss() {
	var self = this;
	self.query.max = 30;
	self.query.draft = false;
	self.$query(self, function(err, docs) {
		var builder = [];
		for (var i = 0, length = docs.items.length; i < length; i++) {
			var doc = docs.items[i];
			builder.push('<item><title>{0}</title><link>{1}/</link><description>{2}</description><pubDate>{3}</pubDate></item>'.format(doc.name.encode(), self.hostname(self.sitemap_url('detail', doc.category_linker, doc.linker)), doc.perex.encode(), doc.datecreated));
		}
		self.content('<?xml version="1.0" encoding="UTF-8" ?><rss version="2.0"><channel><title>{0}</title><link>{1}</link><description>{2}</description>{3}</channel></rss>'.format(F.config.name, self.hostname(), F.config.description, builder.join('')), 'text/xml');
	});
}
