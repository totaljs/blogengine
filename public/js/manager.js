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

function isError(arguments) {
	return false;
}

// Because of login form
if (window.su) {

	jRouting.route(managerurl + '/', function() {

		if (can('dashboard')) {
			SET('common.page', 'dashboard');
			return;
		}

		jRouting.redirect(managerurl + '/' + su.roles[0] + '/');
	});

	if (can('blogs')) {
		jRouting.route(managerurl + '/blogs/', function() {
			SET('common.page', 'blogs');
		});
	}

	if (can('comments')) {
		jRouting.route(managerurl + '/comments/', function() {
			SET('common.page', 'comments');
		});
	}

	if (can('newsletter')) {
		jRouting.route(managerurl + '/newsletter/', function() {
			SET('common.page', 'newsletter');
		});
	}

	if (can('settings')) {
		jRouting.route(managerurl + '/settings/', function() {
			SET('common.page', 'settings');
		});
	}
}

jRouting.on('location', function(url) {
	url = url.split('/');
	var nav = $('header nav');
	nav.find('.selected').removeClass('selected');
	nav.find('a[href="' + '/' + url[1] + '/' + (url[2] && url[2] + '/') + '"]').addClass('selected');
});

function resizer() {
	var h = $(window).height();
	var el = $('#body');
	if (!el.length)
		return;
	var t = el.offset().top + 100;
	el.css('min-height', h - t);
}

function success() {
	var el = $('#success');
	el.show();
	el.addClass('success-animation');
	setTimeout(function() {
		el.removeClass('success-animation');
		setTimeout(function() {
			el.hide();
		}, 1000);
	}, 1500);
	FIND('loading').hide(500);
}

function can(name) {
	if (!su.roles.length)
		return true;
	return su.roles.indexOf(name) !== -1;
}

Tangular.register('join', function(value) {
	if (value instanceof Array)
		return value.join(', ');
	return '';
});

Tangular.register('default', function(value, def) {
	if (value == null || value === '')
		return def;
	return value;
});

function mainmenu() {
	$('header nav').toggleClass('mainmenu-visible');
}

jRouting.on('location', function() {
	$('header nav').removeClass('mainmenu-visible');
});
