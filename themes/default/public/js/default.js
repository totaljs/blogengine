// Online visitors counter
PING('GET /api/ping/');

$(document).ready(function() {

	var el = $('.markdown');
	if (el.length) {
		marked_video(el.find('.lang-video'));
		marked_iframe(el.find('.lang-iframe'));
		el.find('pre code').each(FN('(i,b) => hljs.highlightBlock(b)'));
	}

	$('.time').each(function() {
		var el = $(this);
		el.html(Tangular.helpers.time(el.html()));
	});

	loading(false, 800);
});

COMPONENT('emaildecode', function() {
	var self = this;
	self.readonly();
	self.make = function() {
		var m = self.html().replace(/\(\w+\)/g, function(value) {
			switch (value) {
				case '(at)':
					return '@';
				case '(dot)':
					return '.';
			}
			return value;
		});
		self.html('<a href="mailto:' + m + '">' + m + '</a>');
	};
});

COMPONENT('newsletter', function() {
	var self = this;
	var button;
	var input;

	self.readonly();
	self.make = function() {

		button = self.find('button');
		input = self.find('input');

		self.element.on('keydown', 'input', function(e) {
			if (e.keyCode !== 13)
				return;
			button.trigger('click');
		});

		button.on('click', function() {

			var mail = input.val();
			if (!mail.isEmail())
				return;

			AJAX('POST /api/newsletter/', { email: input.val() }, function(response) {

				if (response.success) {
					input.addClass('newsletter-success');
					input.val(self.attr('data-success'));
				}

				setTimeout(function() {
					input.val('');
					input.removeClass('newsletter-success');
				}, 3000);
			});
		});

	};
});

function loading(visible, timeout) {
	var el = $('#loading');

	if (!visible && !el.length)
		return;

	if (!el.length) {
		$(document.body).append('<div id="loading"></div>');
		el = $('#loading');
	}

	setTimeout(function() {
		if (visible)
			el.fadeIn(500);
		else
			el.fadeOut(500);
	}, timeout || 0);
}

COMPONENT('lazyload', function() {

	var self = this;

	self.visible_old = 0;
	self.isinit = false;
	self.isredraw = false;

	self.readonly();

	self.init = function() {

		window.$lazyload = [];
		window.$lazyload_can = false;

		var win = $(window);
		win.on('scroll', function(e) {

			if (!window.$lazyload_can)
				return;

			var arr = window.$lazyload;
			var top = win.scrollTop();
			var toph = top + win.height();

			for (var i = 0, length = arr.length; i < length; i++) {
				var item = arr[i];
				item.component.visible = toph >= item.top && top <= item.top + item.height;
				!item.remove && item.component.refresh(item);
			}
		});

		window.$lazyload_refresh = function(skip) {
			setTimeout2('$lazyload', function() {
				var arr = window.$lazyload;
				for (var i = 0, length = arr.length; i < length; i++) {
					var item = arr[i];
					if (item.remove)
						continue;
					if (item.component.id !== skip)
						item.top = item.component.element.offset().top;
					if (item.innerh)
						item.height = item.component.element.height();
				}
			}, 200);
		};

		setTimeout(function() {
			win.trigger('scroll');
		}, 500);

		setInterval(function() {
			$lazyload_refresh();
		}, 1000 * 60);
	};

	self.destroy = function() {
		self.clean();
	};

	self.clean = function() {
		var index = window.$lazyload.findIndex(function(item) {
			return item.component.id === self.id;
		});
		if (index === -1)
			return;
		window.$lazyload.splice(index, 1);
		window.$lazyload_can = window.$lazyload.length > 0;
	};

	self.refresh = function(item) {

		if (self.visible_old === self.visible)
			return;

		clearTimeout(self.visible_timeout);
		self.visible_old = self.visible;
		setTimeout2(self.id, function() {

			var attr;

			if (self.visible) {
				if (self.isinit) {
					self.isredraw = true;
					attr = 'redraw';
				} else {
					self.isinit = true;
					attr = 'init';
					item.remove = item.$remove;
					setTimeout(function() {
						$lazyload_refresh(self.id);
					}, 200);
				}
			} else if (self.isinit)
				attr = 'hide';

			if (!attr)
				return;

			var path = self.attr('data-' + attr);
			if (!path)
				return;

			var val = self.get(path);
			if (typeof(val) === 'function')
				val.call(self, self);
			else
				self.set(attr === 'hide' ? !self.visible : self.visible);

			if (!self.isinit || !item.remove)
				return;

			self.clean();
		}, 100);
	};

	self.make = function() {
		var self = this;
		var item = {};

		item.component = self;
		item.top = self.element.offset().top;
		item.type = 0;
		item.height = (self.attr('data-height') || '').replace(/px|\%/g, '').parseInt();
		item.$remove = self.attr('data-redraw') || self.attr('data-hide') ? false : true;
		item.remove = false;

		if (!item.height) {
			item.innerh = true;
			item.height = self.element.height();
		}

		$lazyload.push(item);
		$lazyload_can = true;

		setTimeout2('$lazyload.refresh', window.$lazyload_refresh, 200);
	};
});

Tangular.register('comment', function(value) {
	return smilefy(mailify(urlify(Tangular.helpers.encode(value).replace(/\n/g, '<br />'))));
});

function smilefy(str) {
	var db = { ':-)': 1, ':)': 1, ';)': 8, ':D': 0, '8)': 5, ':((': 7, ':(': 3, ':|': 2, ':P': 6, ':O': 4, ':*': 9, '+1': 10, '1': 11, '\/': 12 };
	return str.replace(/(\-1|[:;8O\-)DP(|\*]|\+1){1,3}/g, function(match) {
		var smile = db[match.replace('-', '')];
		return smile === undefined ? match : '<i class="smiles smiles-' + smile + '"></i>';
	});
}

function urlify(str) {
	return str.replace(/(((https?:\/\/)|(www\.))[^\s]+)/g, function(url, b, c) {
		var len = url.length;
		var l = url.substring(len - 1);
		if (l === '.' || l === ',')
			url = url.substring(0, len - 1);
		else
			l = '';
		url = c === 'www.' ? 'http://' + url : url;
		return '<a href="' + url + '" target="_blank">' + url + '</a>' + l;
	});
}

function mailify(str) {
	return str.replace(/(?:[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*|"(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21\x23-\x5b\x5d-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])*")@(?:(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?|\[(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?|[a-z0-9-]*[a-z0-9]:(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21-\x5a\x53-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])+)\])/g, function(m, b, c) {
		var len = m.length;
		var l = m.substring(len - 1);
		if (l === '.' || l === ',')
			m = m.substring(0, len - 1);
		else
			l = '';
		return '<a href="mailto:' + m + '">' + m + '</a>' + l;
	});
}