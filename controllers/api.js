// This API uses the website

exports.install = function() {
	// COMMON
	F.route('/api/ping/',              json_ping);

	// COMMENTS
	F.route('/api/comments/{id}/',     json_comments_query, ['*Comment']);
	F.route('/api/comments/',          json_comments_save, ['post', '*CommentForm']);

	// BLOGS
	F.route('/api/blogs/',             json_blogs_query, ['*Blog']);

	// NEWSLETTER
	F.route('/api/newsletter/',        json_save, ['post', '*Newsletter']);

	// CONTACTFORM
	F.route('/api/contact/',           json_save, ['post', '*Contact']);
};

// ==========================================================================
// COMMON
// ==========================================================================

function json_ping() {
	var self = this;
	self.plain('null');
}

// ==========================================================================
// BLOGS
// ==========================================================================

function json_blogs_query() {
	var self = this;
	self.query.draft = false;
	self.$query(self, self.callback());
}

// ==========================================================================
// COMMENTS
// ==========================================================================

function json_comments_query(id) {
	var self = this;
	self.memorize('comments' + id, '1 minute', function() {
		self.query.idblog = id;
		self.query.max = 50;
		self.query.approved = true;
		self.$query(self, self.callback());
	});
}

function json_comments_save() {
	var self = this;
	self.$async(self.callback(), 1).$workflow('check', self).$save(self).$workflow('notify', self);
}

// ==========================================================================
// NEWSLETTER, CONTACTFORM
// ==========================================================================

// Appends a new email into the newsletter list
function json_save() {
	var self = this;
	self.body.$save(self.callback());
}
