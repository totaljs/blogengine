exports.install = function() {
	// Auto-localize static HTML templates
	F.localize('/templates/*.html', ['compress']);

	// COMMON
	F.route(CONFIG('manager-url') + '/*', '~manager');
	F.route(CONFIG('manager-url') + '/upload/',                  upload, ['post', 'upload', 10000], 3084); // 3 MB
	F.route(CONFIG('manager-url') + '/upload/picture/',          upload_picture, ['post', 'upload', 10000], 3084); // 3 MB
	F.route(CONFIG('manager-url') + '/upload/markdown/',         upload_markdown, ['post', 'upload', 10000], 3084); // 3 MB
	F.route(CONFIG('manager-url') + '/logoff/',                  redirect_logoff);

	// DASHBOARD
	F.route(CONFIG('manager-url') + '/api/dashboard/',           json_dashboard);
	F.route(CONFIG('manager-url') + '/api/dashboard/online/',    json_dashboard_online);

	// BLOGS
	F.route(CONFIG('manager-url') + '/api/blogs/',               json_query,  ['*Blog']);
	F.route(CONFIG('manager-url') + '/api/blogs/',               json_save,   ['post', '*Blog'], 500);
	F.route(CONFIG('manager-url') + '/api/blogs/{id}/',          json_read,   ['*Blog']);
	F.route(CONFIG('manager-url') + '/api/blogs/',               json_remove, ['delete', '*Blog']);
	F.route(CONFIG('manager-url') + '/api/blogs/clear/',         json_blogs_clear, ['*Blog']);
	F.route(CONFIG('manager-url') + '/api/blogs/codelists/',     json_blogs_codelists);
	F.route(CONFIG('manager-url') + '/api/blogs/preview/',       json_blogs_preview, ['post']);
	F.route(CONFIG('manager-url') + '/api/blogs/stats/',         json_blogs_stats, ['post']);

	// COMMENTS
	F.route(CONFIG('manager-url') + '/api/comments/',            json_query,  ['*Comment']);
	F.route(CONFIG('manager-url') + '/api/comments/',            json_save,   ['post', '*Comment']);
	F.route(CONFIG('manager-url') + '/api/comments/{id}/',       json_read,   ['*Comment']);
	F.route(CONFIG('manager-url') + '/api/comments/',            json_remove, ['delete', '*Comment']);

	// NEWSLETTER
	F.route(CONFIG('manager-url') + '/api/newsletter/',          json_newsletter, ['*Newsletter']);
	F.route(CONFIG('manager-url') + '/api/newsletter/csv/',      file_newsletter, ['*Newsletter']);

	// SETTINGS
	F.route(CONFIG('manager-url') + '/api/settings/',            json_settings, ['*Settings']);
	F.route(CONFIG('manager-url') + '/api/settings/',            json_settings_save, ['put', '*Settings']);
};

// ==========================================================================
// COMMON
// ==========================================================================

// Upload (multiple) pictures
function upload() {

	var self = this;
	var id = [];

	self.files.wait(function(file, next) {
		file.read(function(err, data) {

			// Store current file into the HDD
			file.extension = U.getExtension(file.filename);
			id.push(DB('files').binary.insert(file.filename, data) + '.' + file.extension);

			// Next file
			setTimeout(next, 100);
		});

	}, function() {
		// Returns response
		self.json(id);
	});
}

// Upload (multiple) pictures
function upload_markdown() {

	var self = this;
	var id = [];

	self.files.wait(function(file, next) {
		file.read(function(err, data) {

			// Store current file into the HDD
			file.extension = U.getExtension(file.filename);
			var filename = DB('files').binary.insert(file.filename, data) + '.' + file.extension;
			id.push({ url: '/download/' + filename, filename: file.filename, width: file.width, height: file.height });

			// Next file
			setTimeout(next, 100);
		});

	}, function() {
		// Returns response
		self.json(id);
	});
}

// Upload pictures
function upload_picture() {

	var self = this;
	var file = self.files[0];

	if (!file || !file.isImage())
		return self.invalid().push('file', 'The file has invalid content.');

	file.image().make(function(builder) {
		builder.resizeAlign(U.parseInt(self.body.width), U.parseInt(self.body.height), 'top');
		builder.quality(90);
		builder.minify();
		builder.save(file.path, function() {
			self.json(DB('files').binary.insert(file.path) + '.jpg');
		});
	});
}


// Upload base64
function upload_base64() {
	var self = this;

	if (!self.body.file) {
		self.json(null);
		return;
	}

	var type = self.body.file.base64ContentType();
	var data = self.body.file.base64ToBuffer();
	var ext;

	switch (type) {
		case 'image/png':
			ext = '.png';
			break;
		case 'image/jpeg':
			ext = '.jpg';
			break;
		case 'image/gif':
			ext = '.gif';
			break;
	}

	var id = DB('files').binary.insert('base64' + ext, data);
	self.json('/download/' + id + ext);
}

// Logoff
function redirect_logoff() {
	var self = this;
	self.res.cookie('__manager', '', '-1 days');
	self.redirect(CONFIG('manager-url'));
}

// ==========================================================================
// DASHBOARD
// ==========================================================================

// Reads basic informations for dashboard
function json_dashboard() {

	var self = this;
	var model = {};
	var counter = MODULE('webcounter');

	model.webcounter = {};
	model.webcounter.today = counter.today();
	model.webcounter.online = counter.online();

	if (!model.webcounter.today.pages)
		model.webcounter.today.pages = 0;

	model.webcounter.today.pages = Math.floor(parseFloat(model.webcounter.today.pages));

	var async = [];

	// Reads all monthly stats
	async.push(function(next) {
		counter.monthly(function(stats) {
			model.webcounter.stats = stats;
			next();
		});
	});

	// Reads dashboard information from all registered schemas which they have defined `dashboard` operation.
	async.push(function(next) {

		var pending = [];

		EACHSCHEMA(function(group, name, schema) {
			if (schema.operations && schema.operations['dashboard'])
				pending.push(schema);
		});

		pending.wait(function(schema, next) {
			schema.operation('dashboard', null, function(err, data) {
				if (!err && data)
					model[schema.name] = data;
				next();
			});
		}, next);
	});

	async.async(() => self.json(model));
}

// Reads online users
function json_dashboard_online() {
	var self = this;
	var counter = MODULE('webcounter');
	var memory = process.memoryUsage();
	var model = {};
	model.visitors = counter.online();
	model.today = counter.today();
	model.last = counter.today().last;
	model.memoryused = (memory.heapUsed / 1024 / 1024).floor(2);
	model.memorytotal = (memory.heapTotal / 1024 / 1024).floor(2);
	self.json(model);
}

// ==========================================================================
// POSTS
// ==========================================================================

// Gets all posts
function json_query() {
	var self = this;
	self.$query(self, self.callback());
}

// Saves (update or create) specific post
function json_save() {
	var self = this;
	self.body.$save(self, self.callback());
}

// Removes specific post
function json_remove() {
	var self = this;
	self.$remove(self.body.id, self.callback());
}

// Reads a specific post by ID
function json_read(id) {
	var self = this;
	self.id = id;
	self.$get(self, self.callback());
}

// Clears all blogs
function json_blogs_clear() {
	var self = this;
	self.$workflow('clear', self.callback());
}

// Reads all post categories and manufacturers
function json_blogs_codelists() {
	var self = this;
	self.json({ categories: F.global.blogs, tags: F.global.blogstags });
}

function json_blogs_stats() {
	var self = this;
	NOSQL('blogs').counter.count(self.body, self.callback());
}

function json_blogs_preview() {
	var self = this;
	self.content(markdown(self.body.body || ''), 'text/html');
}

// ==========================================================================
// SETTINGS
// ==========================================================================

// Reads custom settings
function json_settings() {
	var self = this;
	self.$get(null, self.callback());
}

// Saves and refresh custom settings
function json_settings_save() {
	var self = this;
	self.body.$async(self.callback(), 0).$save().$workflow('load');
}

// ==========================================================================
// NEWSLETTER
// ==========================================================================

// Reads all emails from newsletter file
function json_newsletter() {
	var self = this;
	self.$query(self.callback());
}

// Downloads all email address as CSV
function file_newsletter() {
	var self = this;
	self.$workflow('download', self);
}