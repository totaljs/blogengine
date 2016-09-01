NEWSCHEMA('Blog').make(function(schema) {

	schema.define('id', 'UID');
	schema.define('category', 'String(50)');
	schema.define('language', 'Lower(2)');
	schema.define('name', 'String(80)', true);
	schema.define('perex', 'String(200)', true);
	schema.define('picture', 'String');
	schema.define('tags', '[Lower]');
	schema.define('comments', Boolean);
	schema.define('draft', Boolean);
	schema.define('draft_old', Boolean);
	schema.define('body', String);
	schema.define('datecreated', Date);

	NOSQL('blogs').view('listing').make(function(filter) {
		filter.fields('id', 'category', 'name', 'datecreated', 'linker', 'category_linker', 'picture', 'perex', 'tags', 'countcomments', 'countviews', 'draft');
		filter.sort('datecreated', true);
	});

	schema.setQuery(function(error, controller, callback) {

		var options = controller.query;

		options.page = U.parseInt(options.page) - 1;
		options.max = U.parseInt(options.max, 20);

		if (options.page < 0)
			options.page = 0;

		var take = U.parseInt(options.max);
		var skip = U.parseInt(options.page * options.max);
		var filter = NOSQL('blogs').find('listing');

		options.language && filter.where('language', options.language);
		options.category && filter.where('category_linker', options.category);
		options.search && filter.like('search', options.search.keywords(true, true));

		if (options.tag) {
			var tag = F.global.blogstags.findItem('linker', options.tag);
			tag && filter.in('tags', tag.name);
		}

		options.draft === false && filter.in('draft', false);
		options.linker && filter.where('linker', '<>', options.linker);

		filter.take(take);
		filter.skip(skip);

		filter.callback(function(err, docs, count) {

			var data = {};

			data.count = count;
			data.items = docs;
			data.limit = options.max;
			data.pages = Math.ceil(data.count / options.max);

			if (data.pages === 0)
				data.pages = 1;

			data.page = options.page + 1;

			// Returns data
			callback(data);
		});
	});

	// Gets a specific blog
	schema.setGet(function(error, model, controller, callback) {
		var options = controller.query;
		var filter = NOSQL('blogs').one();
		options.category && filter.where('category_linker', options.category);
		options.linker && filter.where('linker', options.linker);
		controller.id && filter.where('id', controller.id);
		filter.callback(callback, 'error-404-blog');
	});

	schema.setRemove(function(error, id, callback) {
		NOSQL('blogs').remove().make(function(builder) {
			builder.where('id', id);
			builder.callback(function(err, count) {
				count && NOSQL('comments').remove().where('idblog', id);
				callback(SUCCESS(true));
				setTimeout(refresh, 1000);
			});
		});
	});

	schema.setSave(function(error, model, controller, callback) {

		var newbie = false;

		if (!model.id) {
			newbie = true;
			model.id = UID();
			model.datecreated = F.datetime;
			model.author = controller.user.name;
			model.countcomments = 0;
			model.datecommented = null;
		}

		if (!model.draft && model.draft_old) {
			model.datecreated = F.datetime;
			model.linker = F.datetime.format('yyyyMMdd') + '-' + model.name.slug();
		}

		model.search = ((model.name || '') + ' ' + (model.body || '')).keywords(true, true).join(' ').max(1000);
		model.author = controller.user.name || '';

		var category = F.global.blogs.find('name', model.category);
		if (category)
			model.category_linker = category.linker;

		var fn = function(err, count) {

			// Returns response
			callback(SUCCESS(true));

			if (!count)
				return;

			F.emit('blogs.save', model);
			setTimeout(refresh, 1000);

			if (newbie)
				return;

			model.datebackuped = new Date();
			NOSQL('blogs_backup').insert(model);
		};

		if (newbie)
			return NOSQL('blogs').insert(model).callback(fn);

		NOSQL('blogs').modify(model).where('id', model.id).callback(fn);

		// Refreshes cache
		F.cache.removeAll(model.linker);
	});
});

// Refreshes internal informations
function refresh() {

	var categories = {};
	var tags = {};
	var latest = [];

	if (F.config.custom.blogs)
		F.config.custom.blogs.forEach(item => categories[item] = 0);

	var prepare = function(doc) {

		if (!doc.draft && categories[doc.category] !== undefined)
			categories[doc.category] += 1;

		doc.tags && doc.tags.forEach(function(name) {

			if (doc.draft) {
				if (tags[name] === undefined)
					tags[name] = 0;
				return;
			}

			if (tags[name] === undefined)
				tags[name] = 1;
			else
				tags[name] += 1;
		});

		if (doc.draft)
			return;

		latest.length > 5 && latest.shift();
		latest.push({ name: doc.name, linker: doc.linker, category: doc.category, category_linker: doc.category_linker, picture: doc.picture, datecreated: doc.datecreated, countcomments: doc.countcomments });
	};

	NOSQL('blogs').find().prepare(prepare).callback(function() {
		var output = [];
		Object.keys(categories).forEach(key => output.push({ name: key, linker: key.slug(), count: categories[key] }));
		F.global.blogs = output;

		output = [];
		Object.keys(tags).forEach(key => output.push({ name: key, linker: key.slug(), count: tags[key] }));
		output.quicksort('count', true);

		F.global.blogstags = output;

		latest.quicksort('datecreated', true);
		F.global.blogslatest = latest;

		// Refreshes cache
		F.cache.removeAll('partial-menu');
		F.cache.removeAll('partial-tags');
	});
}

F.on('settings', refresh);