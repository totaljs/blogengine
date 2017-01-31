F.helpers.pagination = function(model) {
	return new Pagination(model.count, model.page, model.limit, this.href('page', 'XyX').replace('XyX', '{0}')).html(8);
};

global.marked = require('marked');
global.marked.setOptions({ gfm: true, breaks: true, sanitize: true, tables: true });

global.markdown = function(text) {
	return marked(text).replace(/<img/g, '<img class="img-responsive img-rounded"').replace(/<table/g, '<table class="table table-bordered"');
};