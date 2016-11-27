// For administration area
NEWSCHEMA('Comment').make(function(schema) {

	schema.define('id', 'UID', true);
	schema.define('idblog', 'UID', true);
	schema.define('name', 'String(40)', true);
	schema.define('user', 'String(50)', true);
	schema.define('email', 'Email', true);
	schema.define('body', String, true);
	schema.define('datecreated', Date);
	schema.define('admin', Boolean);
	schema.define('approved', Boolean);
	schema.define('approved_old', Boolean);

	schema.setQuery(function(error, controller, callback) {

		var options = controller.query;

		options.page = U.parseInt(options.page) - 1;
		options.max = U.parseInt(options.max, 20);

		if (options.page < 0)
			options.page = 0;

		var take = U.parseInt(options.max);
		var skip = U.parseInt(options.page * options.max);
		var filter = NOSQL('comments').find();

		options.idblog && filter.where('idblog', options.idblog);
		options.approved && filter.where('approved', true);
		options.search && filter.like('search', options.search.keywords(true, true));
		!options.idblog && filter.sort('datecreated', true);

		filter.take(take);
		filter.skip(skip);

		filter.callback(function(err, docs, count) {

			var data = {};
			data.count = count;
			data.items = docs;
			data.limit = options.max;
			data.pages = Math.ceil(data.count / options.max) || 1;
			data.page = options.page + 1;

			if (options.idblog || !data.count)
				return callback(data);

			// NoSQL
			NOSQL('blogs').find().make(function(builder) {
				builder.fields('id', 'name', 'picture', 'perex', 'category_linker', 'linker');
				builder.in('id', data.items.map(n => n.idblog));
				builder.callback(function(err, response) {
					data.items.forEach(function(item) {
						var blog = response.findItem('id', item.idblog);
						if (!blog)
							return;
						item.name = blog.name;
						item.perex = blog.perex;
						item.picture = blog.picture;
						item.category_linker = blog.category_linker;
						item.linker = blog.linker;
					});
					callback(data);
				});
			});
		});
	});

	schema.setRemove(function(error, id, callback) {
		NOSQL('comments').find().make(function(builder) {
			builder.first();
			builder.fields('idblog');
			builder.where('id', id);
			builder.callback(function(err, item) {
				if (!item)
					return callback(SUCCESS(false));
				NOSQL('comments').remove().where('id', id).callback(function() {
					schema.workflow2('recount', item.idblog);
					callback(SUCCESS(true));
				});
			});
		});
	});

	schema.setSave(function(error, model, controller, callback) {

		var plain = model.$plain();

		model.search = (model.body || '').keywords(true, true).join(' ').max(1000);
		plain.approved_old = undefined;
		plain.id = undefined;
		plain.datecreated = undefined;

		NOSQL('comments').modify(plain).where('id', model.id).callback(function(err, count) {

			// Returns response
			callback(SUCCESS(true));

			if (!count)
				return;

			F.emit('comments.save', model);

			// Creates backup
			model.datebackup = F.datetime;
			NOSQL('comments_backup').insert(model);

			// Recounts comments
			model.approved_old !== model.approved && schema.workflow2('recount', model.idblog);
		});
	});

	schema.addWorkflow('recount', function(error, model, idblog, callback) {
		NOSQL('comments').find().make(function(builder) {
			builder.fields('datecreated');
			builder.where('idblog', idblog);
			builder.where('approved', true);
			builder.callback(function(err, response) {

				var max;

				response.forEach(function(item) {
					var ticks = item.datecreated.parseDate().getTime();
					if (max)
						max = Math.max(max, ticks);
					else
						max = ticks;
				});

				NOSQL('blogs').modify({ countcomments: response.length, datecommented: new Date(max) }).where('id', idblog);

				// Refreshes cache
				F.cache.removeAll('comments' + idblog);
				refresh();
			});
		});
	});

	schema.addWorkflow('stats', function(error, model, options, callback) {
		NOSQL('comments').counter.monthly('all', callback);
	});
});

function refresh() {
	var options = {};
	options.max = 5;
	options.approved = true;
	GETSCHEMA('Comment').query({ query: options }, function(err, response) {

		F.global.commentslatest = response.items.map(function(item) {
			item.body = item.body.max(100);
			return item;
		});

		F.cache.remove('homepage');
		F.cache.remove('partial-latest');
	});
}

// For public comment forms
NEWSCHEMA('CommentForm').make(function(schema) {

	schema.define('idblog', 'UID', true);
	schema.define('user', 'String(40)', true);
	schema.define('email', 'Email', true);
	schema.define('body', 'String(3000)', true);

	schema.setSave(function(error, model, controller, callback) {

		model.id = UID();
		model.datecreated = F.datetime;
		model.ip = controller.req.ip;
		model.search = (model.body || '').keywords(true, true).join(' ').max(1000);
		model.approved = false;

		F.emit('comments.save', model);
		var db = NOSQL('comments');
		db.insert(model).callback(() => callback(SUCCESS(true)));
		db.counter.hit('all');
		db.counter.hit(model.idblog);
	});

	schema.addWorkflow('check', function(error, model, idblog, callback) {
		NOSQL('blogs').find().make(function(builder) {
			builder.first();
			builder.fields('name');
			builder.where('id', model.idblog);
			builder.callback(function(err, response) {
				!response && error.push('error-404-blog');

				// Gets blog name
				if (response)
					model.name = response.name;

				callback(SUCCESS(true));
			});
		});
	});

	// Sends email
	schema.addWorkflow('notify', function(error, model, idblog, callback) {
		var mail = F.mail(F.config.custom.emailcontactform, '@(New comment:) ' + model.name, '=?/mails/comment', model, '');
		mail.reply(model.email, true);
		callback(SUCCESS(true));
	});
});

F.on('settings', refresh);