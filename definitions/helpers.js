DEF.helpers.paginate = function(model) {
	var paginate = new Pagination(model.count, model.page, model.limit, this.href('page', 'XyX').replace('XyX', '{0}'));
	return '{0}{1}{2}'.format(paginate.isPrev ? paginate.prev().html('<i class="fa fa-chevron-left"></i>', 'control') : '', paginate.html(6), paginate.isNext ? paginate.next().html('<i class="fa fa-chevron-right"></i>', 'control') : '');
};