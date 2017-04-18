const Fs = require('fs');
const filename = F.path.databases('settings.json');

NEWSCHEMA('SuperUser').make(function(schema) {
	schema.define('name', String, true);
	schema.define('login', String, true);
	schema.define('password', String, true);
	schema.define('roles', '[String]');
});

NEWSCHEMA('Settings').make(function(schema) {

	schema.define('url', 'Url', true);
	schema.define('emailcontactform', 'Email', true);
	schema.define('emailreply', 'Email', true);
	schema.define('emailsender', 'Email', true);
	schema.define('blogs', '[String]');
	schema.define('languages', '[Lower(2)]');
	schema.define('users', '[SuperUser]');

	// Saves settings into the file
	schema.setSave(function(error, model, options, callback) {

		var settings = U.extend({}, model.$clean());

		if (settings.url.endsWith('/'))
			settings.url = settings.url.substring(0, settings.url.length - 1);

		settings.datebackup = F.datetime;
		DB('settings_backup').insert(JSON.parse(JSON.stringify(settings)));
		delete settings.datebackup;

		// Writes settings into the file
		Fs.writeFile(filename, JSON.stringify(settings), function() {
			F.emit('settings.save', settings);
			callback(SUCCESS(true));
		});
	});

	// Gets settings
	schema.setGet(function(error, model, options, callback) {
		Fs.readFile(filename, function(err, data) {
			if (err)
				settings= { 'manager-superadmin': 'admin:admin' };
			else
				settings = JSON.parse(data.toString('utf8'));
			callback(settings);
		});
	});

	// Loads settings + rewrites framework configuration
	schema.addWorkflow('load', function(error, model, options, callback) {
		schema.get(null, function(err, settings) {

			F.config.custom = settings;

			// Rewrites internal framework settings
			F.config['mail-address-from'] = F.config.custom.emailsender;
			F.config['mail-address-reply'] = F.config.custom.emailreply;

			// Refreshes internal informations
			if (!F.config.custom.users)
				F.config.custom.users = [];

			if (!F.config.custom.languages)
				F.config.custom.languages = [];

			// Adds an admin (service) account
			var sa = CONFIG('manager-superadmin').split(':');
			F.config.custom.users.push({ name: 'Administrator', login: sa[0], password: sa[1], roles: [], sa: true });

			// Optimized for the performance
			var users = {};
			for (var i = 0, length = F.config.custom.users.length; i < length; i++) {
				var user = F.config.custom.users[i];
				var key = (user.login + ':' + user.password).hash();
				users[key] = user;
			}

			F.config.custom.users = users;

			F.emit('settings', settings);
			callback(SUCCESS(true));
		});
	});
});
