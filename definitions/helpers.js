const SMILES = { ':-)': 1, ':)': 1, ';)': 8, ':D': 0, '8)': 5, ':((': 7, ':(': 3, ':|': 2, ':P': 6, ':O': 4, ':*': 9, '+1': 10, '1': 11, '\/': 12 };
const SMILES_REGEXP = /(\-1|[:;8O\-)DP(|\*]|\+1){1,3}/g;

// Helper for pagination rendering
// Eshop uses this helper
F.helpers.pagination = function(model) {
	return new Pagination(model.count, model.page, model.limit).html(8);
};

global.marked = require('marked');
global.marked.setOptions({ gfm: true, breaks: true, sanitize: true, tables: true });

global.markdown = function(text) {
	return marked(text).replace(/<img/g, '<img class="img-responsive img-rounded"').replace(/<table/g, '<table class="table table-bordered"');
};