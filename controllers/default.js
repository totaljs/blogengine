exports.install = function() {
	// COMMON
	F.route('/', view_homepage, ['*Blog']);
	F.route('#contact', 'contact');

	// FILES
	F.file('/download/', file_read);
};

// ==========================================================================
// COMMON
// ==========================================================================

// Homepage
function view_homepage() {
	var self = this;
	self.memorize('homepage', '1 minute', DEBUG, function() {
		self.query.max = 10;
		self.query.draft = false;
		self.$query(self, self.callback('index'));
	});
}

// ==========================================================================
// FILES
// ==========================================================================

function file_read(req, res) {

	var id = req.split[1].replace('.' + req.extension, '');

	F.exists(req, res, function(next, filename) {
		NOSQL('files').binary.read(id, function(err, stream, header) {

			if (err) {
				next();
				return res.throw404();
			}

			var writer = require('fs').createWriteStream(filename);

			CLEANUP(writer, function() {
				res.file(filename);
				next();
			});

			stream.pipe(writer);
		});
	});
}