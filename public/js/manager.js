// Trims empty fields
languages = languages.trim();

var common = {};

// Current page
common.page = '';

// Current form
common.form = '';

$(document).ready(function() {
	jR.clientside('.jrouting');

	$('.jrouting').each(function(index) {
		var el = $(this);
		el.toggleClass('hidden', su.roles.length && su.roles.indexOf(el.attr('data-role')) === -1);
	});

	FIND('loading', FN('() => this.hide(500)'));
	$(window).on('resize', resizer);
	resizer();
});

// Because of login form
if (window.su) {

	jR.route(managerurl + '/', function() {
		if (can('dashboard'))
			SET('common.page', 'dashboard');
		else
			jR.redirect(managerurl + '/' + su.roles[0] + '/');
	});

	can('blogs') && jR.route(managerurl + '/blogs/', function() {
		SET('common.page', 'blogs');
	});

	can('comments') && jR.route(managerurl + '/comments/', function() {
		SET('common.page', 'comments');
	});

	can('newsletter') && jR.route(managerurl + '/newsletter/', function() {
		SET('common.page', 'newsletter');
	});

	can('settings') && jR.route(managerurl + '/settings/', function() {
		SET('common.page', 'settings');
	});
}

jR.on('location', function(url) {
	url = url.split('/');
	var nav = $('header nav');
	nav.find('.selected').removeClass('selected');
	nav.find('a[href="' + '/' + url[1] + '/' + (url[2] && url[2] + '/') + '"]').addClass('selected');
});

function resizer() {
	var h = $(window).height();
	var el = $('#body');
	if (el.length) {
		var t = el.offset().top + 100;
		el.css('min-height', h - t);
	}
}

function success() {
	var el = $('#success');
	el.show();
	el.addClass('success-animation');
	setTimeout2('success', function() {
		el.removeClass('success-animation');
		setTimeout(function() {
			el.hide();
		}, 1000);
	}, 1500);
	SETTER('loading', 'hide', 500);
}

function can(name) {
	return su.roles.length ? su.roles.indexOf(name) !== -1 : true;
}

Tangular.register('join', function(value) {
	return value instanceof Array ? value.join(', ') : '';
});

Tangular.register('default', function(value, def) {
	return value == null || value === '' ? def : value;
});

function mainmenu() {
	$('header nav').toggleClass('mainmenu-visible');
}

jR.on('location', function() {
	$('header nav').removeClass('mainmenu-visible');
});
