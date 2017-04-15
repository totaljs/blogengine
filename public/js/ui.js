COMPONENT('click', function() {
	var self = this;

	self.readonly();

	self.click = function() {
		var value = self.attr('data-value');
		if (typeof(value) === 'string')
			self.set(self.parser(value));
		else
			self.get(self.attr('data-jc-path'))(self);
	};

	self.make = function() {
		self.event('click', self.click);
		var enter = self.attr('data-enter');
		enter && $(enter).on('keydown', 'input', function(e) {
			e.keyCode === 13 && setTimeout(function() {
				!self.element.get(0).disabled && self.click();
			}, 100);
		});
	};
});

COMPONENT('exec', function() {
	var self = this;
	self.readonly();
	self.blind();
	self.make = function() {
		self.event('click', self.attr('data-selector') || '.exec', function() {
			var el = $(this);
			var attr = el.attr('data-exec');
			var path = el.attr('data-path');
			attr && EXEC(attr, el);
			path && SET(path, new Function('return ' + el.attr('data-value'))());
		});
	};
});

COMPONENT('visible', function() {
	var self = this;
	var condition = self.attr('data-if');
	self.readonly();
	self.setter = function(value) {
		var is = true;
		if (condition)
			is = EVALUATE(self.path, condition);
		else
			is = value ? true : false;
		self.toggle('hidden', !is);
	};
});

COMPONENT('message', function() {
	var self = this;
	var is = false;
	var visible = false;
	var timer;

	self.readonly();
	self.singleton();

	self.make = function() {
		self.classes('ui-message hidden');

		self.event('click', 'button', function() {
			self.hide();
		});

		$(window).on('keyup', function(e) {
			if (!visible)
				return;
			e.keyCode === 27 && self.hide();
		});
	};

	self.warning = function(message, icon, fn) {
		if (typeof(icon) === 'function') {
			fn = icon;
			icon = undefined;
		}
		self.callback = fn;
		self.content('ui-message-warning', message, icon || 'fa-warning');
	};

	self.success = function(message, icon, fn) {

		if (typeof(icon) === 'function') {
			fn = icon;
			icon = undefined;
		}

		self.callback = fn;
		self.content('ui-message-success', message, icon || 'fa-check-circle');
	};

	self.hide = function() {
		self.callback && self.callback();
		self.classes('-ui-message-visible');
		timer && clearTimeout(timer);
		timer = setTimeout(function() {
			visible = false;
			self.classes('hidden');
		}, 1000);
	};

	self.content = function(cls, text, icon) {
		!is && self.html('<div><div class="ui-message-body"><span class="fa fa-warning"></span><div class="ui-center"></div></div><button>' + (self.attr('data-button') || 'Close') + '</button></div>');
		timer && meout(timer);
		visible = true;
		self.find('.ui-message-body').removeClass().addClass('ui-message-body ' + cls);
		self.find('.fa').removeClass().addClass('fa ' + icon);
		self.find('.ui-center').html(text);
		self.classes('-hidden');
		setTimeout(function() {
			self.classes('ui-message-visible');
		}, 5);
	};
});

COMPONENT('validation', function() {

	var self = this;
	var path;
	var elements;

	self.readonly();

	self.make = function() {
		elements = self.find(self.attr('data-selector') || 'button');
		elements.prop({ disabled: true });
		self.evaluate = self.attr('data-if');
		path = self.path.replace(/\.\*$/, '');
		self.watch(self.path, self.state, true);
	};

	self.state = function() {
		var disabled = jC.disabled(path);
		if (!disabled && self.evaluate)
			disabled = !EVALUATE(self.path, self.evaluate);
		elements.prop({ disabled: disabled });
	};
});

COMPONENT('checkbox', function() {

	var self = this;
	var input;
	var isRequired = self.attr('data-required') === 'true';

	self.validate = function(value) {
		var type = typeof(value);
		if (input.prop('disabled') || !isRequired)
			return true;
		value = type === 'undefined' || type === 'object' ? '' : value.toString();
		return value === 'true' || value === 'on';
	};

	self.required = function(value) {
		self.find('span').toggleClass('ui-checkbox-label-required', value === true);
		isRequired = value;
		return self;
	};

	!isRequired && self.noValid();

	self.make = function() {
		self.classes('ui-checkbox');
		self.html('<div><i class="fa fa-check"></i></div><span{1}>{0}</span>'.format(self.html(), isRequired ? ' class="ui-checkbox-label-required"' : ''));
		self.event('click', function() {
			self.dirty(false);
			self.getter(!self.get(), 2, true);
		});
	};

	self.setter = function(value) {
		self.toggle('ui-checkbox-checked', value ? true : false);
	};
});

COMPONENT('dropdown', function() {

	var self = this;
	var isRequired = self.attr('data-required') === 'true';
	var select;
	var container;

	self.validate = function(value) {

		if (select.prop('disabled') || !isRequired)
			return true;

		var type = typeof(value);
		if (type === 'undefined' || type === 'object')
			value = '';
		else
			value = value.toString();

		EXEC('$calendar.hide');

		if (self.type === 'currency' || self.type === 'number')
			return value > 0;

		return value.length > 0;
	};

	!isRequired && self.noValid();

	self.required = function(value) {
		self.find('.ui-dropdown-label').toggleClass('ui-dropdown-label-required', value);
		self.noValid(!value);
		isRequired = value;
		!value && self.state(1, 1);
	};

	self.render = function(arr) {

		var builder = [];
		var value = self.get();
		var template = '<option value="{0}"{1}>{2}</option>';
		var propText = self.attr('data-source-text') || 'name';
		var propValue = self.attr('data-source-value') || 'id';
		var emptyText = self.attr('data-empty');

		emptyText !== undefined && builder.push('<option value="">{0}</option>'.format(emptyText));

		for (var i = 0, length = arr.length; i < length; i++) {
			var item = arr[i];
			if (item.length)
				builder.push(template.format(item, value === item ? ' selected="selected"' : '', item));
			else
				builder.push(template.format(item[propValue], value === item[propValue] ? ' selected="selected"' : '', item[propText]));
		}

		select.html(builder.join(''));
	};

	self.make = function() {

		var options = [];

		(self.attr('data-options') || '').split(';').forEach(function(item) {
			item = item.split('|');
			options.push('<option value="{0}">{1}</option>'.format(item[1] === undefined ? item[0] : item[1], item[0]));
		});

		self.classes('ui-dropdown-container');

		var label = self.html();
		var html = '<div class="ui-dropdown"><span class="fa fa-sort"></span><select data-jc-bind="">{0}</select></div>'.format(options.join(''));
		var builder = [];

		if (label.length) {
			var icon = self.attr('data-icon');
			builder.push('<div class="ui-dropdown-label{0}">{1}{2}:</div>'.format(isRequired ? ' ui-dropdown-label-required' : '', icon ? '<span class="fa {0}"></span> '.format(icon) : '', label));
			builder.push('<div class="ui-dropdown-values">{0}</div>'.format(html));
			self.html(builder.join(''));
		} else
			self.html(html).addClass('ui-dropdown-values');

		select = self.find('select');
		container = self.find('.ui-dropdown');

		var ds = self.attr('data-source');
		if (!ds)
			return;

		var prerender = function(path) {
			var value = self.get(self.attr('data-source'));
			!NOTMODIFIED(self.id, value) && self.render(value || EMPTYARRAY);
		};

		self.watch(ds, prerender, true);
	};

	self.state = function(type, who) {
		if (!type)
			return;
		var invalid = self.isInvalid();
		if (invalid === self.$oldstate)
			return;
		self.$oldstate = invalid;
		container.toggleClass('ui-dropdown-invalid', self.isInvalid());
	};
});

COMPONENT('textbox', function() {

	var self = this;
	var isRequired = self.attr('data-required') === 'true';
	var validation = self.attr('data-validate');
	var input;
	var container;

	self.validate = function(value) {

		if (input.prop('disabled') || !isRequired)
			return true;

		var type = typeof(value);

		if (type === 'undefined' || type === 'object')
			value = '';
		else
			value = value.toString();

		EMIT('reflow', self.name);

		switch (self.type) {
			case 'email':
				return value.isEmail();
			case 'url':
				return value.isURL();
			case 'currency':
			case 'number':
				return value > 0;
		}

		return validation ? self.evaluate(value, validation, true) ? true : false : value.length > 0;
	};

	!isRequired && self.noValid();

	self.required = function(value) {
		self.find('.ui-textbox-label').toggleClass('ui-textbox-label-required', value);
		self.noValid(!value);
		isRequired = value;
		!value && self.state(1, 1);
	};

	self.make = function() {

		var attrs = [];
		var builder = [];
		var tmp;

		attrs.attr('type', self.type === 'password' ? self.type : 'text');
		attrs.attr('placeholder', self.attr('data-placeholder'));
		attrs.attr('maxlength', self.attr('data-maxlength'));
		attrs.attr('data-jc-keypress', self.attr('data-jc-keypress'));
		attrs.attr('data-jc-keypress-delay', self.attr('data-jc-keypress-delay'));
		attrs.attr('data-jc-bind', '');
		attrs.attr('name', self.path);

		tmp = self.attr('data-align');
		tmp && attrs.attr('class', 'ui-' + tmp);
		self.attr('data-autofocus') === 'true' && attrs.attr('autofocus');

		var content = self.html();
		var icon = self.attr('data-icon');
		var icon2 = self.attr('data-control-icon');
		var increment = self.attr('data-increment') === 'true';

		builder.push('<input {0} />'.format(attrs.join(' ')));

		if (!icon2 && self.type === 'date')
			icon2 = 'fa-calendar';
		else if (self.type === 'search') {
			icon2 = 'fa-search ui-textbox-control-icon';
			self.event('click', '.ui-textbox-control-icon', function() {
				self.$stateremoved = false;
				$(this).removeClass('fa-times').addClass('fa-search');
				self.set('');
			});
			self.getter2 = function(value) {
				if (self.$stateremoved && !value)
					return;
				self.$stateremoved = value ? false : true;
				self.find('.ui-textbox-control-icon').toggleClass('fa-times', value ? true : false).toggleClass('fa-search', value ? false : true);
			};
		}

		icon2 && builder.push('<div><span class="fa {0}"></span></div>'.format(icon2));
		increment && !icon2 && builder.push('<div><span class="fa fa-caret-up"></span><span class="fa fa-caret-down"></span></div>');
		increment && self.event('click', '.fa-caret-up,.fa-caret-down', function(e) {
			var el = $(this);
			var inc = -1;
			if (el.hasClass('fa-caret-up'))
				inc = 1;
			self.change(true);
			self.inc(inc);
		});

		self.type === 'date' && self.event('click', '.fa-calendar', function(e) {
			e.preventDefault();
			window.$calendar && window.$calendar.toggle($(this).parent().parent(), self.find('input').val(), function(date) {
				self.set(date);
			});
		});

		if (!content.length) {
			self.classes('ui-textbox ui-textbox-container');
			self.html(builder.join(''));
			input = self.find('input');
			container = self.find('.ui-textbox');
			return;
		}

		var html = builder.join('');
		builder = [];
		builder.push('<div class="ui-textbox-label{0}">'.format(isRequired ? ' ui-textbox-label-required' : ''));
		icon && builder.push('<span class="fa {0}"></span> '.format(icon));
		builder.push(content);
		builder.push(':</div><div class="ui-textbox">{0}</div>'.format(html));

		self.html(builder.join(''));
		self.classes('ui-textbox-container');
		input = self.find('input');
		container = self.find('.ui-textbox');
	};

	self.state = function(type, who) {
		if (!type)
			return;
		var invalid = self.isInvalid();
		if (invalid === self.$oldstate)
			return;
		self.$oldstate = invalid;
		container.toggleClass('ui-textbox-invalid', invalid);
	};
});

COMPONENT('textarea', function() {

	var self = this;
	var isRequired = self.attr('data-required') === 'true';
	var input;
	var container;

	self.validate = function(value) {

		var type = typeof(value);
		if (input.prop('disabled') || !isRequired)
			return true;

		if (type === 'undefined' || type === 'object')
			value = '';
		else
			value = value.toString();

		EMIT('reflow', self.name);
		return value.length > 0;
	};

	!isRequired && self.noValid();

	self.required = function(value) {
		self.find('.ui-textarea-label').toggleClass('ui-textarea-label-required', value);
		self.noValid(!value);
		isRequired = value;
		!value && self.state(1, 1);
	};

	self.make = function() {

		var attrs = [];
		var builder = [];
		var tmp;

		attrs.attr('placeholder', self.attr('data-placeholder'));
		attrs.attr('maxlength', self.attr('data-maxlength'));
		attrs.attr('data-jc-bind', '');

		tmp = self.attr('data-height');
		tmp && attrs.attr('style', 'height:' + tmp);
		self.attr('data-autofocus') === 'true' && attrs.attr('autofocus');
		builder.push('<textarea {0}></textarea>'.format(attrs.join(' ')));

		var element = self.element;
		var content = element.html();

		if (!content.length) {
			self.classes('ui-textarea ui-textarea-container');
			self.html(builder.join(''));
			input = self.find('textarea');
			container = self.element;
			return;
		}

		var height = self.attr('data-height');
		var icon = self.attr('data-icon');
		var html = builder.join('');

		builder = [];
		builder.push('<div class="ui-textarea-label{0}">'.format(isRequired ? ' ui-textarea-label-required' : ''));
		icon && builder.push('<span class="fa {0}"></span>'.format(icon));
		builder.push(content);
		builder.push(':</div><div class="ui-textarea">{0}</div>'.format(html));

		self.html(builder.join(''));
		self.classes('ui-textarea-container');
		input = self.find('textarea');
		container = self.find('.ui-textarea');
	};

	self.state = function(type) {
		if (!type)
			return;
		var invalid = self.isInvalid();
		if (invalid === self.$oldstate)
			return;
		self.$oldstate = invalid;
		container.toggleClass('ui-textarea-invalid', invalid);
	};
});

COMPONENT('template', function() {
	var self = this;
	self.readonly();
	self.make = function(template) {

		if (template) {
			self.template = Tangular.compile(template);
			return;
		}

		var script = self.find('script');

		if (!script.length) {
			script = self.element;
			self.element = self.element.parent();
		}

		self.template = Tangular.compile(script.html());
		script.remove();
	};

	self.setter = function(value) {
		if (NOTMODIFIED(self.id, value))
			return;
		if (!value)
			return self.classes('hidden');
		KEYPRESS(function() {
			self.html(self.template(value)).removeClass('hidden');
		}, 100, self.id);
	};
});

COMPONENT('repeater', function() {

	var self = this;
	var recompile = false;

	self.readonly();

	self.make = function() {
		var element = self.find('script');

		if (!element.length) {
			element = self.element;
			self.element = self.element.parent();
		}

		var html = element.html();
		element.remove();
		self.template = Tangular.compile(html);
		recompile = html.indexOf('data-jc="') !== -1;
	};

	self.setter = function(value) {

		if (!value || !value.length) {
			self.empty();
			return;
		}

		var builder = [];
		for (var i = 0, length = value.length; i < length; i++) {
			var item = value[i];
			item.index = i;
			builder.push(self.template(item).replace(/\$index/g, i.toString()).replace(/\$/g, self.path + '[' + i + ']'));
		}

		self.html(builder);
		recompile && jC.compile();
	};
});

COMPONENT('error', function() {
	var self = this;
	var element;

	self.readonly();

	self.make = function() {
		self.append('<ul class="ui-error hidden"></ul>');
		element = self.find('ul');
	};

	self.setter = function(value) {

		if (!(value instanceof Array) || !value.length) {
			element.addClass('hidden');
			return;
		}

		var builder = [];
		for (var i = 0, length = value.length; i < length; i++)
			builder.push('<li><span class="fa fa-times-circle"></span> ' + value[i].error + '</li>');

		element.empty();
		element.append(builder.join(''));
		element.removeClass('hidden');
	};
});

COMPONENT('cookie', function() {
	var self = this;
	self.singleton();
	self.readonly();

	self.cancel = function() {
		document.cookie.split(';').forEach(function(key) {
			jC.cookies.set(key.split('=')[0], '', '-2 days');
		});
		try {
			Object.keys(localStorage).forEach(function(key) {
				localStorage.removeItem(key);
			});
		} catch (e) {}
		location.href = 'about:blank';
		return self;
	};

	self.make = function() {

		var cookie;

		// private mode
		try {
			cookie = localStorage.getItem('cookie');
		} catch (e) {}

		if (cookie) {
			self.classes('hidden');
			return;
		}

		self.classes('-hidden ui-cookie');
		self.append('<button name="agree">' + (self.attr('data-agree') || 'OK') + '</button>');
		self.append('<button name="cancel">' + (self.attr('data-cancel') || 'Cancel') + '</button>');

		self.event('click', 'button', function() {

			if (this.name === 'cancel')
				return self.cancel();

			// private mode
			try {
				localStorage.setItem('cookie', '1');
			} catch (e) {}
			self.classes('hidden');
		});
	};
});

// ==========================================================
// @{BLOCK manager}
// ==========================================================

COMPONENT('textboxtags', function() {

	var self = this;
	var isRequired = self.attr('data-required') === 'true';
	var isString = false;
	var container;

	if (!window.$textboxtagstemplate)
		window.$textboxtagstemplate = Tangular.compile('<div class="ui-textboxtags-tag" data-name="{{ name }}">{{ name }}<i class="fa fa-times"></i></div>');

	var template = window.$textboxtagstemplate;

	self.validate = function(value) {
		return isRequired ? value && value.length > 0 : true;
	};

	self.required = function(value) {
		self.find('.ui-textboxtags-label').toggleClass('ui-textboxtags-label-required', value);
		self.noValid(!value);
		isRequired = value;
		!value && self.state(1, 1);
	};

	self.make = function() {

		var height = self.attr('data-height');
		var icon = self.attr('data-icon');
		var content = self.html();
		var html = '<div class="ui-textboxtags-values"' + (height ? ' style="min-height:' + height + '"' : '') + '><input type="text" placeholder="' + (self.attr('data-placeholder') || '') + '" /></div>';

		isString = self.type === 'string';

		if (content.length) {
			self.empty();
			self.append('<div class="ui-textboxtags-label' + (isRequired ? ' ui-textboxtags-label-required' : '') + '">' + (icon ? '<span class="fa ' + icon + '"></span> ' : '') + content + ':</div>');
			self.append('<div class="ui-textboxtags">' + html + '</div>');
		} else {
			self.classes('ui-textboxtags');
			self.append(html);
		}

		self.event('click', function(e) {
			self.find('input').focus();
		});

		container = self.find('.ui-textboxtags-values');
		container.on('click', '.fa-times', function(e) {

			e.preventDefault();
			e.stopPropagation();

			var el = $(this);
			var arr = self.get();

			if (isString)
				arr = self.split(arr);

			if (!arr || !(arr instanceof Array) || !arr.length)
				return;

			var index = arr.indexOf(el.parent().attr('data-name'));
			if (index === -1)
				return;

			arr.splice(index, 1);
			self.set(isString ? arr.join(', ') : arr);
			self.change(true);
		});

		self.event('keydown', 'input', function(e) {

			if (e.keyCode === 8) {
				if (this.value)
					return;
				var arr = self.get();
				if (isString)
					arr = self.split(arr);
				if (!arr || !(arr instanceof Array) || !arr.length)
					return;
				arr.pop();
				self.set(isString ? arr.join(', ') : arr);
				self.change(true);
				return;
			}

			if (e.keyCode !== 13 || !this.value)
				return;

			var arr = self.get();
			var value = this.value;

			if (isString)
				arr = self.split(arr);

			if (!(arr instanceof Array))
				arr = [];

			if (arr.indexOf(value) === -1)
				arr.push(value);
			else
				return;

			this.value = '';
			self.set(isString ? arr.join(', ') : arr);
			self.change(true);
		});
	};

	self.split = function(value) {
		if (!value)
			return new Array(0);
		var arr = value.split(',');
		for (var i = 0, length = arr.length; i < length; i++)
			arr[i] = arr[i].trim();
		return arr;
	};

	self.setter = function(value) {

		if (NOTMODIFIED(self.id, value))
			return;

		container.find('.ui-textboxtags-tag').remove();

		if (!value || !value.length)
			return;

		var arr = isString ? self.split(value) : value;
		var builder = '';
		for (var i = 0, length = arr.length; i < length; i++)
			builder += template({ name: arr[i] });

		container.prepend(builder);
	};

	self.state = function(type) {
		self.find('.ui-textboxtags').toggleClass('ui-textboxtags-invalid', self.isInvalid());
	};
});

COMPONENT('page', function() {
	var self = this;
	var isProcessed = false;
	var isProcessing = false;
	var reload = self.attr('data-reload');

	self.hide = function() {
		self.set('');
	};

	self.getter = null;
	self.setter = function(value) {

		if (isProcessing)
			return;

		var el = self.element;
		var is = el.attr('data-if') == value;

		if (isProcessed || !is) {
			el.toggleClass('hidden', !is);

			if (is && reload)
				self.get(reload)();
			return;
		}

		var loading = FIND('loading');
		loading.show();
		isProcessing = true;
		INJECT(el.attr('data-template'), el, function() {
			isProcessing = false;

			var init = el.attr('data-init');
			if (init) {
				var fn = GET(init || '');
				if (typeof(fn) === 'function')
					fn(self);
			}

			isProcessed = true;
			el.toggleClass('hidden', !is);
			loading.hide(1200);
		});
	};
});

COMPONENT('grid', function() {

	var self = this;
	var target;
	var page;

	self.click = function(index, row, button) {console.log(index, row, button)};
	self.make = function(template) {

		var element = self.find('script');

		self.template = Tangular.compile(element.html());
		self.event('click', 'tr', function() {});
		self.classes('ui-grid');
		self.html('<div><div class="ui-grid-page"></div><table width="100%" cellpadding="0" cellspacing="0" border="0"><tbody></tbody></table></div><div data-jc="pagination" data-jc-path="{0}" data-max="8" data-pages="{1}" data-items="{2}" data-target-path="{3}"></div>'.format(self.path, self.attr('data-pages'), self.attr('data-items'), self.attr('data-pagination-path')));
		self.event('click', 'button', function() {
			switch (this.name) {
				default:
					var index = parseInt($(this).closest('tr').attr('data-index'));
					self.click(index, self.get().items[index], this);
					break;
			}
		});

		target = self.find('tbody');
		page = self.find('.ui-grid-page');

		setTimeout(function() {
			var max = self.attr('data-max');
			if (max === 'auto')
				self.max = (Math.floor(($(window).height() - (self.element.offset().top + 110)) / 26));
			else
				self.max = parseInt(max);
			if (self.max < 10)
				self.max = 10;
		}, 10);

		return true;
	};

	self.refresh = function() {
		self.set(self.get());
	};

	self.prerender = function(index, row) {
		return self.template(row).replace('<tr', '<tr data-index="' + index + '"');
	};

	self.setter = function(value) {
		var output = [];
		var items = value.items;

		if (items) {
			for (var i = 0, length = items.length; i < length; i++)
				output.push(self.prerender(i, items[i]));
		}

		if (!output.length) {
			var empty = self.attr('data-empty');
			if (empty) {
				page.html('&nbsp;');
				output.push('<tr><td style="text-align:center;padding:50px 0;background-color:white"><div style="padding:40px 20px;border:2px solid #F0F0F0;max-width:500px;margin:0 auto;border-radius:4px">{0}</div></td></tr>'.format(empty));
			} else
				page.empty();
		} else {
			var format = self.attr('data-page');
			if (format)
				page.html(format.replace(/\#/g, value.page));
			else
				page.empty();
		}

		target.html(output);
	};
});

COMPONENT('form', function() {

	var self = this;
	var autocenter;

	if (!MAN.$$form) {
		window.$$form_level = window.$$form_level || 1;
		MAN.$$form = true;
		$(document).on('click', '.ui-form-button-close', function() {
			SET($(this).attr('data-path'), '');
			window.$$form_level--;
		});

		$(window).on('resize', function() {
			FIND('form', true).forEach(function(component) {
				!component.element.hasClass('hidden') && component.resize();
			});
		});

		$(document).on('click', '.ui-form-container', function(e) {
			var el = $(e.target);
			if (!(el.hasClass('ui-form-container-padding') || el.hasClass('ui-form-container')))
				return;
			var form = $(this).find('.ui-form');
			var cls = 'ui-form-animate-click';
			form.addClass(cls);
			setTimeout(function() {
				form.removeClass(cls);
			}, 300);
		});
	}

	self.readonly();
	self.submit = function(hide) { self.hide(); };
	self.cancel = function(hide) { self.hide(); };
	self.onHide = function(){};

	var hide = self.hide = function() {
		self.set('');
		self.onHide();
	};

	self.resize = function() {
		if (!autocenter)
			return;
		var ui = self.find('.ui-form');
		var fh = ui.innerHeight();
		var wh = $(window).height();
		var r = (wh / 2) - (fh / 2);
		if (r > 30)
			ui.css({ marginTop: (r - 15) + 'px' });
		else
			ui.css({ marginTop: '20px' });
	};

	self.make = function() {
		var width = self.attr('data-width') || '800px';
		var submit = self.attr('data-submit');
		var enter = self.attr('data-enter');
		autocenter = self.attr('data-autocenter') === 'true';
		self.condition = self.attr('data-if');

		$(document.body).append('<div id="{0}" class="hidden ui-form-container"><div class="ui-form-container-padding"><div class="ui-form" style="max-width:{1}"><div class="ui-form-title"><span class="fa fa-times ui-form-button-close" data-path="{2}"></span>{3}</div>{4}</div></div>'.format(self._id, width, self.path, self.attr('data-title')));

		var el = $('#' + self._id);
		el.find('.ui-form').get(0).appendChild(self.element.get(0));
		self.classes('-hidden');
		self.replace(el);

		self.event('scroll', function() {
			EMIT('reflow', self.name);
		});

		self.find('button').on('click', function(e) {
			window.$$form_level--;
			switch (this.name) {
				case 'submit':
					self.submit(hide);
					break;
				case 'cancel':
					!this.disabled && self[this.name](hide);
					break;
			}
		});

		enter === 'true' && self.event('keydown', 'input', function(e) {
			e.keyCode === 13 && !self.find('button[name="submit"]').get(0).disabled && self.submit(hide);
		});
	};

	self.setter = function(value) {

		setTimeout2('noscroll', function() {
			$('html').toggleClass('noscroll', $('.ui-form-container').not('.hidden').length ? true : false);
		}, 50);

		var isHidden = !EVALUATE(self.path, self.condition);
		self.toggle('hidden', isHidden);
		EMIT('reflow', self.name);

		if (isHidden) {
			self.release(true);
			self.find('.ui-form').removeClass('ui-form-animate');
			return;
		}

		self.resize();
		self.release(false);

		var el = self.find('input,select,textarea');
		el.length && el.eq(0).focus();

		window.$$form_level++;
		self.css('z-index', window.$$form_level * 10);
		self.element.scrollTop(0);

		setTimeout(function() {
			self.find('.ui-form').addClass('ui-form-animate');
		}, 300);

		// Fixes a problem with freezing of scrolling in Chrome
		setTimeout2(self.id, function() {
			self.css('z-index', (window.$$form_level * 10) + 1);
		}, 1000);
	};
});

COMPONENT('pictureupload', function() {

	var self = this;
	var width = +self.attr('data-width');
	var height = +self.attr('data-height');
	var empty;
	var img;
	var url;

	self.readonly();

	self.make = function() {

		var canvas = document.createElement('canvas');
		canvas.width = width;
		canvas.height = height;
		var ctx = canvas.getContext('2d');
		ctx.fillStyle = 'white';
		ctx.fillRect(0, 0, width, height);
		empty = canvas.toDataURL('image/jpeg');
		canvas = null;

		url = self.attr('data-url');
		if (!url) {
			if (window.managerurl)
				url = window.managerurl + '/upload/picture/';
			else
				url = location.pathname;
		}

		var html = self.html();
		var icon = self.attr('data-icon');

		self.toggle('ui-pictureupload');
		self.html((html ? '<div class="ui-pictureupload-label">{0}{1}:</div>'.format(icon ? '<i class="fa {0}"></i>'.format(icon) : '', html) : '') + '<input type="file" accept="image/*" class="hidden" /><img src="{0}" class="img-responsive" alt="" />'.format(empty, width, height));

		img = self.find('img');

		img.on('click', function() {
			self.find('input').trigger('click');
		});

		self.event('change', 'input', function(evt) {
			self.upload(evt.target.files);
		});

		self.event('dragenter dragover dragexit drop dragleave', function (e) {

			e.stopPropagation();
			e.preventDefault();

			switch (e.type) {
				case 'drop':
					break;
				case 'dragenter':
				case 'dragover':
					return;
				case 'dragexit':
				case 'dragleave':
				default:
					return;
			}

			self.upload(e.originalEvent.dataTransfer.files);
		});
	};

	self.upload = function(files) {

		if (!files.length)
			return;

		var el = this;
		var data = new FormData();
		data.append('file', files[0]);
		data.append('width', width);
		data.append('height', height);

		UPLOAD(url, data, function(response, err) {

			SETTER('loading', 'hide', 100);

			if (err) {
				SETTER('message', 'warning', self.attr('data-error-large'));
				return;
			}

			el.value = '';
			self.set(response);
			self.change(true);
		});
	};

	self.setter = function(value) {
		if (value)
			img.attr('src', (self.attr('data-path') || '{0}').format(value));
		else
			img.attr('src', empty);
	};
});

COMPONENT('dropdowncheckbox', function() {

	var self = this;
	var required = self.attr('data-required') === 'true';
	var datasource = '';
	var container;
	var data = [];
	var values;

	if (!window.$dropdowncheckboxtemplate)
		window.$dropdowncheckboxtemplate = Tangular.compile('<div><label><input type="checkbox" value="{{ index }}" /><span>{{ text }}</span></label></div>');

	var template = window.$dropdowncheckboxtemplate;

	self.validate = function(value) {
		return required ? value && value.length > 0 : true;
	};

	self.make = function() {

		var options = [];
		var element = self.element;
		var arr = (element.attr('data-options') || '').split(';');

		for (var i = 0, length = arr.length; i < length; i++) {
			var item = arr[i].split('|');
			var value = item[1] === undefined ? item[0] : item[1];
			if (self.type === 'number')
				value = parseInt(value);
			var obj = { value: value, text: item[0], index: i };
			options.push(template(obj));
			data.push(obj);
		}

		var content = element.html();
		var icon = element.attr('data-icon');
		var html = '<div class="ui-dropdowncheckbox"><span class="fa fa-sort"></span><div class="ui-dropdowncheckbox-selected"></div></div><div class="ui-dropdowncheckbox-values hidden">' + options.join('') + '</div>';

		if (content.length > 0) {
			element.empty();
			element.append('<div class="ui-dropdowncheckbox-label' + (required ? ' ui-dropdowncheckbox-label-required' : '') + '">' + (icon ? '<span class="fa ' + icon + '"></span> ' : '') + content + ':</div>');
			element.append(html);
		} else
			element.append(html);

		self.classes('ui-dropdowncheckbox-container');
		container = self.find('.ui-dropdowncheckbox-values');
		values = self.find('.ui-dropdowncheckbox-selected');

		self.event('click', '.ui-dropdowncheckbox', function(e) {

			var el = $(this);
			if (el.hasClass('ui-disabled'))
				return;

			container.toggleClass('hidden');

			if (window.$dropdowncheckboxelement) {
				window.$dropdowncheckboxelement.addClass('hidden');
				window.$dropdowncheckboxelement = null;
			}

			if (!container.hasClass('hidden'))
				window.$dropdowncheckboxelement = container;

			e.stopPropagation();
		});

		self.event('click', 'input,label', function(e) {

			e.stopPropagation();

			var is = this.checked;
			var index = parseInt(this.value);
			var value = data[index];

			if (value === undefined)
				return;

			value = value.value;

			var arr = self.get();
			if (!(arr instanceof Array))
				arr = [];

			var index = arr.indexOf(value);

			if (is) {
				if (index === -1)
					arr.push(value);
			} else {
				if (index !== -1)
					arr.splice(index, 1);
			}

			self.reset(true);
			self.set(arr, undefined, 2);
		});

		var ds = self.attr('data-source');

		if (!ds)
			return;

		self.watch(ds, prepare);
		setTimeout(function() {
			prepare(ds, GET(ds));
		}, 500);
	};

	function prepare(path, value) {

		if (NOTMODIFIED(path, value))
			return;

		var clsempty = 'ui-dropdowncheckbox-values-empty';

		if (!value) {
			container.addClass(clsempty).empty().html(self.attr('data-empty'));
			return;
		}

		var kv = self.attr('data-source-value') || 'id';
		var kt = self.attr('data-source-text') || 'name';
		var builder = '';

		data = [];
		for (var i = 0, length = value.length; i < length; i++) {
			var isString = typeof(value[i]) === 'string';
			var item = { value: isString ? value[i] : value[i][kv], text: isString ? value[i] : value[i][kt], index: i };
			data.push(item);
			builder += template(item);
		}

		if (builder)
			container.removeClass(clsempty).empty().append(builder);
		else
			container.addClass(clsempty).empty().html(self.attr('data-empty'));

		self.setter(self.get());
	}

	self.setter = function(value) {

		if (NOTMODIFIED(self.id, value))
			return;

		var label = '';
		var empty = self.attr('data-placeholder');

		if (value && value.length) {
			var remove = [];
			for (var i = 0, length = value.length; i < length; i++) {
				var selected = value[i];
				var index = 0;
				var is = false;

				while (true) {
					var item = data[index++];
					if (item === undefined)
						break;
					if (item.value != selected)
						continue;
					label += (label ? ', ' : '') + item.text;
					is = true;
				}

				if (!is)
					remove.push(selected);
			}

			var refresh = false;

			while (true) {
				var item = remove.shift();
				if (item === undefined)
					break;
				value.splice(value.indexOf(item), 1);
				refresh = true;
			}

			if (refresh)
				MAN.set(self.path, value);
		}

		container.find('input').each(function() {
			var index = parseInt(this.value);
			var checked = false;
			if (!value || !value.length)
				checked = false;
			else if (data[index])
				checked = data[index];
			if (checked)
				checked = value.indexOf(checked.value) !== -1;
			this.checked = checked;
		});

		if (!label && value) {
			// invalid data
			// it updates model without notification
			MAN.set(self.path, []);
		}

		if (!label && empty) {
			values.html('<span>{0}</span>'.format(empty));
			return;
		}

		values.html(label);
	};

	self.state = function(type) {
		self.find('.ui-dropdowncheckbox').toggleClass('ui-dropdowncheckbox-invalid', self.isInvalid());
	};

	if (window.$dropdowncheckboxevent)
		return;

	window.$dropdowncheckboxevent = true;
	$(document).on('click', function(e) {
		if (!window.$dropdowncheckboxelement)
			return;
		window.$dropdowncheckboxelement.addClass('hidden');
		window.$dropdowncheckboxelement = null;
	});
});

COMPONENT('textboxlist', function() {
	var self = this;
	var container;
	var empty = {};
	var skip = false;

	self.template = Tangular.compile('<div class="ui-textboxlist-item"><div><i class="fa fa-times"></i></div><div><input type="text" maxlength="{{ max }}" placeholder="{{ placeholder }}" value="{{ value }}" /></div></div>');
	self.make = function() {

		empty.max = (self.attr('data-maxlength') || '100').parseInt();
		empty.placeholder = self.attr('data-placeholder');
		empty.value = '';

		var html = self.html();
		var icon = self.attr('data-icon');

		if (icon)
			icon = '<i class="fa {0}"></i>'.format(icon);

		self.toggle('ui-textboxlist');
		self.html((html ? '<div class="ui-textboxlist-label">{1}{0}:</div>'.format(html, icon) : '') + '<div class="ui-textboxlist-items"></div>' + self.template(empty).replace('-item"', '-item ui-textboxlist-base"'));
		container = self.find('.ui-textboxlist-items');

		self.event('click', '.fa-times', function() {
			var el = $(this);
			var parent = el.closest('.ui-textboxlist-item');
			var value = parent.find('input').val();
			var arr = self.getArray();

			parent.remove();

			var index = arr.indexOf(value);
			if (index === -1)
				return;
			arr.splice(index, 1);
			skip = true;
			self.set(self.path, arr, 2);
			self.change(true);
		});

		self.getArray = function() {
			var arr = self.get();
			if (!arr)  {
				arr = [];
				self.set(arr);
			}
			return arr;
		};

		self.event('change keypress', 'input', function(e) {

			if (e.type !== 'change' && e.keyCode !== 13)
				return;

			var el = $(this);

			var value = this.value.trim();
			if (!value)
				return;

			var arr = [];
			var base = el.closest('.ui-textboxlist-base').length > 0;

			if (base && e.type === 'change')
				return;

			if (base) {
				self.getArray().indexOf(value) === -1 && self.push(self.path, value, 2);
				this.value = '';
				self.change(true);
				return;
			}

			container.find('input').each(function() {
				arr.push(this.value.trim());
			});

			skip = true;
			self.set(self.path, arr, 2);
			self.change(true);
		});
	};

	self.setter = function(value, path, type) {

		if (skip) {
			skip = false;
			return;
		}

		if (!value || !value.length) {
			container.empty();
			return;
		}

		var builder = [];

		value.forEach(function(item) {
			empty.value = item;
			builder.push(self.template(empty));
		});

		container.empty().append(builder.join(''));
	};
});

COMPONENT('codemirror', function() {

	var self = this;
	var required = self.attr('data-required') === 'true';
	var skipA = false;
	var skipB = false;
	var editor;

	self.validate = function(value) {
		return required ? value && value.length > 0 : true;
	};

	self.codemirror = function() {
		return editor;
	};

	self.make = function() {

		var height = self.attr('data-height');
		var icon = self.attr('data-icon');
		var content = self.html();

		self.html('<div class="ui-codemirror-label' + (required ? ' ui-codemirror-label-required' : '') + '">' + (icon ? '<span class="fa ' + icon + '"></span> ' : '') + content + ':</div><div class="ui-codemirror"></div>');

		var container = self.find('.ui-codemirror');
		var options = {};

		options.lineNumbers = self.attr('data-linenumbers') === 'true';
		options.mode = self.attr('data-type') || 'htmlmixed';
		options.indentUnit = 4;

		if (options.mode === 'markdown') {
			options.styleActiveLine = true;
			options.lineWrapping = true;
			options.matchBrackets = true;
			options.extraKeys = { Enter: 'newlineAndIndentContinueMarkdownList' };
		}

		editor = CodeMirror(container.get(0), options);
		height !== 'auto' && editor.setSize('100%', height || '200px');

		editor.on('change', function(a, b) {

			if (skipB && b.origin !== 'paste') {
				skipB = false;
				return;
			}

			setTimeout2(self.id, function() {
				skipA = true;
				self.reset(true);
				self.dirty(false);
				self.set(editor.getValue());
			}, 200);
		});

		skipB = true;
	};

	self.getter = null;
	self.setter = function(value, path) {

		if (skipA === true) {
			skipA = false;
			return;
		}

		skipB = true;
		editor.setValue(value || '');
		editor.refresh();
		skipB = true;

		CodeMirror.commands['selectAll'](editor);
		var f = editor.getCursor(true);
		var t = editor.getCursor(false);
		skipB = true;
		editor.setValue(editor.getValue());
		skipB = true;

		setTimeout(function() {
			editor.refresh();
		}, 200);

		setTimeout(function() {
			editor.refresh();
		}, 1000);
	};

	self.state = function(type) {
		self.find('.ui-codemirror').toggleClass('ui-codemirror-invalid', self.isInvalid());
	};
});

COMPONENT('calendar', function() {

	var self = this;
	var skip = false;
	var skipDay = false;
	var visible = false;
	var callback;

	self.days = self.attr('data-days').split(',');
	self.months = self.attr('data-months').split(',');
	self.first = parseInt(self.attr('data-firstday'));
	self.today = self.attr('data-today');
	self.months_short = [];

	for (var i = 0, length = self.months.length; i < length; i++) {
		var m = self.months[i];
		if (m.length > 4)
			m = m.substring(0, 3) + '.';
		self.months_short.push(m);
	}

	self.readonly();
	self.click = function(date) {};

	function getMonthDays(dt) {

		var m = dt.getMonth();
		var y = dt.getFullYear();

		if (m === -1) {
			m = 11;
			y--;
		}

		return (32 - new Date(y, m, 32).getDate());
	}

	function calculate(year, month, selected) {

		var d = new Date(year, month, 1);
		var output = { header: [], days: [], month: month, year: year };
		var firstDay = self.first;
		var firstCount = 0;
		var from = d.getDay() - firstDay;
		var today = new Date();
		var ty = today.getFullYear();
		var tm = today.getMonth();
		var td = today.getDate();
		var sy = selected ? selected.getFullYear() : -1;
		var sm = selected ? selected.getMonth() : -1;
		var sd = selected ? selected.getDate() : -1;
		var days = getMonthDays(d);

		if (from < 0)
			from = 7 + from;

		while (firstCount++ < 7) {
			output.header.push({ index: firstDay, name: self.days[firstDay] });
			firstDay++;
			if (firstDay > 6)
				firstDay = 0;
		}

		var index = 0;
		var indexEmpty = 0;
		var count = 0;
		var prev = getMonthDays(new Date(year, month - 1, 1)) - from;

		for (var i = 0; i < days + from; i++) {

			var obj = { isToday: false, isSelected: false, isEmpty: false, isFuture: false, number: 0, index: ++count };

			if (i >= from) {
				obj.number = ++index;
				obj.isSelected = sy === year && sm === month && sd === index;
				obj.isToday = ty === year && tm === month && td === index;
				obj.isFuture = ty < year;

				if (!obj.isFuture && year === ty) {
					if (tm < month)
						obj.isFuture = true;
					else if (tm === month)
						obj.isFuture = td < index;
				}

			} else {
				indexEmpty++;
				obj.number = prev + indexEmpty;
				obj.isEmpty = true;
			}

			output.days.push(obj);
		}

		indexEmpty = 0;
		for (var i = count; i < 42; i++)
			output.days.push({ isToday: false, isSelected: false, isEmpty: true, isFuture: false, number: ++indexEmpty, index: ++count });
		return output;
	}

	self.hide = function() {
		self.classes('hidden');
		visible = false;
		return self;
	};

	self.toggle = function(el, value, callback, offset) {
		if (self.element.hasClass('hidden'))
			self.show(el, value, callback, offset);
		else
			self.hide();
		return self;
	};

	self.show = function(el, value, callback, offset) {

		if (!el)
			return self.hide();

		var off = el.offset();
		var h = el.innerHeight();

		self.css({ left: off.left + (offset || 0), top: off.top + h + 12 }).removeClass('hidden');
		self.click = callback;
		self.date(value);
		visible = true;
		return self;
	};

	self.make = function() {

		self.classes('ui-calendar hidden');

		self.event('click', '.ui-calendar-today', function() {
			var dt = new Date();
			self.hide();
			self.click && self.click(dt);
		});

		self.event('click', '.ui-calendar-day', function() {
			var arr = this.getAttribute('data-date').split('-');
			var dt = new Date(parseInt(arr[0]), parseInt(arr[1]), parseInt(arr[2]));
			self.find('.ui-calendar-selected').removeClass('ui-calendar-selected');
			$(this).addClass('ui-calendar-selected');
			skip = true;
			self.hide();
			self.click && self.click(dt);
		});

		self.event('click', 'button', function(e) {

			e.preventDefault();
			e.stopPropagation();

			var arr = this.getAttribute('data-date').split('-');
			var dt = new Date(parseInt(arr[0]), parseInt(arr[1]), 1);
			switch (this.name) {
				case 'prev':
					dt.setMonth(dt.getMonth() - 1);
					break;
				case 'next':
					dt.setMonth(dt.getMonth() + 1);
					break;
			}
			skipDay = true;
			self.date(dt);
		});

		$(document.body).on('scroll', function() {
			visible && EXEC('$calendar.hide');
		});

		window.$calendar = self;

		self.on('reflow', function() {
			visible && EXEC('$calendar.hide');
		});
	};

	self.date = function(value) {

		if (typeof(value) === 'string')
			value = value.parseDate();

		var empty = !value;

		if (skipDay) {
			skipDay = false;
			empty = true;
		}

		if (skip) {
			skip = false;
			return;
		}

		if (!value)
			value = new Date();

		old = value;

		var output = calculate(value.getFullYear(), value.getMonth(), value);
		var builder = [];

		for (var i = 0; i < 42; i++) {

			var item = output.days[i];

			if (i % 7 === 0) {
				builder.length && builder.push('</tr>');
				builder.push('<tr>');
			}

			var cls = [];

			if (item.isEmpty)
				cls.push('ui-calendar-disabled');
			else
				cls.push('ui-calendar-day');

			!empty && item.isSelected && cls.push('ui-calendar-selected');
			item.isToday && cls.push('ui-calendar-day-today');
			builder.push('<td class="{0}" data-date="{1}-{2}-{3}">{3}</td>'.format(cls.join(' '), output.year, output.month, item.number));
		}

		builder.push('</tr>');

		var header = [];
		for (var i = 0; i < 7; i++)
			header.push('<th>{0}</th>'.format(output.header[i].name));

		self.html('<div class="ui-calendar-header"><button class="ui-calendar-header-prev" name="prev" data-date="{0}-{1}"><span class="fa fa-chevron-left"></span></button><div class="ui-calendar-header-info">{2} {3}</div><button class="ui-calendar-header-next" name="next" data-date="{0}-{1}"><span class="fa fa-chevron-right"></span></button></div><table cellpadding="0" cellspacing="0" border="0"><thead>{4}</thead><tbody>{5}</tbody></table>'.format(output.year, output.month, self.months[value.getMonth()], value.getFullYear(), header.join(''), builder.join('')) + (self.today ? '<div><a href="javascript:void(0)" class="ui-calendar-today">' + self.today + '</a></div>' : ''));
	};
});

COMPONENT('tabmenu', function() {
	var self = this;
	self.readonly();
	self.make = function() {
		self.event('click', 'li', function() {
			var el = $(this);
			if (el.hasClass('selected'))
				return;
			self.set(self.parser(el.attr('data-value')));
		});
	};
	self.setter = function(value) {
		self.find('.selected').removeClass('selected');
		self.find('li[data-value="' + value + '"]').addClass('selected');
	};
});

COMPONENT('disable', function() {
	var self = this;
	var condition;
	var selector;
	var validate;

	self.readonly();

	self.make = function() {
		condition = self.attr('data-if');
		selector = self.attr('data-selector') || 'input,texarea,select';
		validate = self.attr('data-validate');
		if (validate)
			validate = validate.split(',').trim();
	};

	self.setter = function(value) {
		var is = true;

		if (condition)
			is = EVALUATE(self.path, condition);
		else
			is = value ? false : true;

		self.find(selector).each(function() {
			var el = $(this);
			var tag = el.get(0).tagName;
			if (tag === 'INPUT' || tag === 'SELECT') {
				el.prop('disabled', is);
				el.parent().toggleClass('ui-disabled', is);
			} else
				el.toggleClass('ui-disabled', is);
		});

		validate && validate.forEach(FN('n => jC.reset(n)'));
	};

	self.state = function(type) {
		self.update();
	};
});

COMPONENT('confirm', function() {
	var self = this;
	var is = false;
	var visible = false;

	self.readonly();
	self.singleton();

	self.make = function() {
		self.toggle('ui-confirm hidden', true);
		self.event('click', 'button', function() {
			self.hide($(this).attr('data-index').parseInt());
		});

		self.event('click', function(e) {
			if (e.target.tagName !== 'DIV')
				return;
			var el = self.find('.ui-confirm-body');
			el.addClass('ui-confirm-click');
			setTimeout(function() {
				el.removeClass('ui-confirm-click');
			}, 300);
		});
	};

	self.confirm = function(message, buttons, fn) {
		self.callback = fn;

		var builder = [];

		buttons.forEach(function(item, index) {
			builder.push('<button data-index="{1}">{0}</button>'.format(item, index));
		});

		self.content('ui-confirm-warning', '<div class="ui-confirm-message">{0}</div>{1}'.format(message.replace(/\n/g, '<br />'), builder.join('')));
	};

	self.hide = function(index) {
		self.callback && self.callback(index);
		self.classes('-ui-confirm-visible');
		setTimeout2(self.id, function() {
			visible = false;
			self.classes('hidden');
		}, 1000);
	};

	self.content = function(cls, text) {
		!is && self.html('<div><div class="ui-confirm-body"></div></div>');
		visible = true;
		self.find('.ui-confirm-body').empty().append(text);
		self.classes('-hidden');
		setTimeout2(self.id, function() {
			self.classes('ui-confirm-visible');
		}, 5);
	};
});

COMPONENT('loading', function() {
	var self = this;
	var pointer;

	self.readonly();
	self.singleton();

	self.make = function() {
		self.classes('ui-loading');
	};

	self.show = function() {
		clearTimeout(pointer);
		self.classes('-hidden');
		return self;
	};

	self.hide = function(timeout) {
		clearTimeout(pointer);
		pointer = setTimeout(function() {
			self.classes('hidden');
		}, timeout || 1);
		return self;
	};
});

COMPONENT('pagination', function() {

	var self = this;
	var nav;
	var info;
	var cachePages = 0;
	var cacheCount = 0;

	self.template = Tangular.compile('<a href="#page{{ page }}" class="page{{ if selected }} selected{{ fi }}" data-page="{{ page }}">{{ page }}</a>');
	self.readonly();
	self.make = function() {
		self.classes('ui-pagination hidden');
		self.append('<div></div><nav></nav>');
		nav = self.find('nav');
		info = self.find('div');
		self.event('click', 'a', function(e) {
			e.preventDefault();
			e.stopPropagation();
			var el = $(this);
			if (self.onPage)
				self.onPage(el.attr('data-page').parseInt(), el);
		});
	};

	self.onPage = function(page) {
		self.set(self.attr('data-target-path'), page);
	};

	self.getPagination = function(page, pages, max, fn) {

		var half = Math.ceil(max / 2);
		var pageFrom = page - half;
		var pageTo = page + half;
		var plus = 0;

		if (pageFrom <= 0) {
			plus = Math.abs(pageFrom);
			pageFrom = 1;
			pageTo += plus;
		}

		if (pageTo >= pages) {
			pageTo = pages;
			pageFrom = pages - max;
		}

		if (pageFrom <= 0)
			pageFrom = 1;

		if (page < half + 1) {
			pageTo++;
			if (pageTo > pages)
				pageTo--;
		}

		for (var i = pageFrom; i < pageTo + 1; i++)
			fn(i);
	};

	self.getPages = function(length, max) {
		var pages = (length - 1) / max;
		if (pages % max !== 0)
			pages = Math.floor(pages) + 1;
		if (pages === 0)
			pages = 1;
		return pages;
	};

	self.setter = function(value) {

		// value.page   --> current page index
		// value.pages  --> count of pages
		// value.count  --> count of items in DB

		var is = false;

		if (value.pages !== undefined) {
			if (value.pages !== cachePages || value.count !== cacheCount) {
				cachePages = value.pages;
				cacheCount = value.count;
				is = true;
			}
		}

		var builder = [];

		if (cachePages > 2) {
			var prev = value.page - 1;
			if (prev <= 0)
				prev = cachePages;
			builder.push('<a href="#prev" class="page" data-page="{0}"><span class="fa fa-arrow-left"></span></a>'.format(prev));
		}

		var max = self.attr('data-max');
		if (max)
			max = max.parseInt();
		else
			max = 8;

		self.getPagination(value.page, cachePages, max, function(index) {
			builder.push(self.template({ page: index, selected: value.page === index }));
		});

		if (cachePages > 2) {
			var next = value.page + 1;
			if (next > cachePages)
				next = 1;
			builder.push('<a href="#next" class="page" data-page="{0}"><span class="fa fa-arrow-right"></span></a>'.format(next));
		}

		nav.empty().append(builder.join(''));

		if (!is)
			return;

		if (cachePages > 1) {
			var pluralize_pages = [cachePages];
			var pluralize_items = [cacheCount];
			pluralize_pages.push.apply(pluralize_pages, self.attr('data-pages').split(',').trim());
			pluralize_items.push.apply(pluralize_items, self.attr('data-items').split(',').trim());
			info.empty().append(Tangular.helpers.pluralize.apply(value, pluralize_pages) + ' / ' + Tangular.helpers.pluralize.apply(value, pluralize_items));
		}

		self.classes((cachePages > 1 ? '-' : '') + 'hidden');
	};
});

COMPONENT('nosqlcounter', function() {
	var self = this;
	var chart;
	var count = (self.attr('data-count') || '12').parseInt();

	self.readonly();
	self.make = function() {
		self.toggle('ui-nosqlcounter', true);
	};

	self.setter = function(value) {

		if (!value || !value.length)
			return self.empty();

		var maxbars = count;

		if (WIDTH() === 'xs')
			maxbars = (maxbars / 2) >> 0;

		var max = value.length - maxbars;
		if (max < 0)
			max = 0;

		value = value.slice(max, value.length);
		max = value.scalar('max', 'value');

		var w = self.element.width();

		var bar = 100 / maxbars;
		var builder = [];
		var months = FIND('calendar').months;
		var current = new Date().format('yyyyMM');
		var cls = '';

		value.forEach(function(item, index) {
			var val = item.value;
			if (val > 999)
				val = (val / 1000).format(1, 2) + 'K';
			var h = (item.value / max) * 60;
			h += 40;

			cls = '';

			if (item.id === current)
				cls += (cls ? ' ' : '') + 'current';

			if (index === 11)
				cls += (cls ? ' ' : '') + 'last';

			builder.push('<div style="width:{0}%;height:{1}%" title="{3}" class="{4}"><span>{2}</span></div>'.format(bar.format(0, 3), h.format(0, 3), val, months[item.month - 1] + ' ' + item.year, cls));
		});

		self.html(builder);
	};
});

COMPONENT('binder', function() {

	var self = this;
	var keys;
	var keys_unique;

	self.readonly();
	self.blind();

	self.make = function() {
		self.watch('*', self.autobind);
		self.scan();

		self.on('component', function() {
			setTimeout2(self.id, self.scan, 200);
		});

		self.on('destroy', function() {
			setTimeout2(self.id, self.scan, 200);
		});
	};

	self.autobind = function(path, value) {
		var mapper = keys[path];
		var template = {};
		mapper && mapper.forEach(function(item) {
			var value = self.get(item.path);
			template.value = value;
			item.classes && classes(item.element, item.classes(value));
			item.visible && item.element.toggleClass('hidden', item.visible(value) ? false : true);
			item.html && item.element.html(item.html(value));
			item.template && item.element.html(item.template(template));
		});
	};

	function classes(element, val) {
		var add = '';
		var rem = '';
		val.split(' ').forEach(function(item) {
			switch (item.substring(0, 1)) {
				case '+':
					add += (add ? ' ' : '') + item.substring(1);
					break;
				case '-':
					rem += (rem ? ' ' : '') + item.substring(1);
					break;
				default:
					add += (add ? ' ' : '') + item;
					break;
			}
		});
		rem && element.removeClass(rem);
		add && element.addClass(add);
	}

	function decode(val) {
		return val.replace(/\&\#39;/g, '\'');
	}

	self.scan = function() {
		keys = {};
		keys_unique = {};
		self.find('[data-binder]').each(function() {

			var el = $(this);
			var path = el.attr('data-binder');
			var arr = path.split('.');
			var p = '';

			var classes = el.attr('data-binder-class');
			var html = el.attr('data-binder-html');
			var visible = el.attr('data-binder-visible');
			var obj = el.data('data-binder');

			keys_unique[path] = true;

			if (!obj) {
				obj = {};
				obj.path = path;
				obj.element = el;
				obj.classes = classes ? FN(decode(classes)) : undefined;
				obj.html = html ? FN(decode(html)) : undefined;
				obj.visible = visible ? FN(decode(visible)) : undefined;

				var tmp = el.find('script[type="text/html"]');
				var str = '';
				if (tmp.length)
					str = tmp.html();
				else
					str = el.html();

				if (str.indexOf('{{') !== -1) {
					obj.template = Tangular.compile(str);
					tmp.length && tmp.remove();
				}

				el.data('data-binder', obj);
			}

			for (var i = 0, length = arr.length; i < length; i++) {
				p += (p ? '.' : '') + arr[i];
				if (keys[p])
					keys[p].push(obj);
				else
					keys[p] = [obj];
			}

		});

		Object.keys(keys_unique).forEach(function(key) {
			self.autobind(key, self.get(key));
		});

		return self;
	};

});

// ==========================================================
// @{end}
// ==========================================================

jC.parser(function(path, value, type) {

	if (type === 'date') {
		if (value instanceof Date)
			return value;

		if (!value)
			return null;

		var isEN = value.indexOf('.') === -1;
		var tmp = isEN ? value.split('-') : value.split('.');
		if (tmp.length !== 3)
			return null;
		var dt = isEN ? new Date(parseInt(tmp[0]) || 0, (parseInt(tmp[1], 10) || 0) - 1, parseInt(tmp[2], 10) || 0) : new Date(parseInt(tmp[2]) || 0, (parseInt(tmp[1], 10) || 0) - 1, parseInt(tmp[0], 10) || 0);
		return dt;
	}

	return value;
});

jC.formatter(function(path, value, type) {

	if (type === 'date') {
		if (value instanceof Date)
			return value.format(this.attr('data-jc-format'));
		if (!value)
			return value;
		return new Date(Date.parse(value)).format(this.attr('data-jc-format'));
	}

	if (type !== 'currency')
		return value;

	if (typeof(value) !== 'number') {
		value = parseFloat(value);
		if (isNaN(value))
			value = 0;
	}

	return value.format(2);
});

function highlight(el) {
	$(el).find('pre code').each(function(i, block) {
		hljs.highlightBlock(block);
	});
}

function marked_video(selector) {
	selector.each(function() {
		var el = $(this);
		var html = el.html();
		if (html.indexOf('youtube') !== -1) {
			el.parent().replaceWith('<div class="video"><iframe src="https://www.youtube.com/embed/' + html.split('v=')[1] + '" frameborder="0" allowfullscreen></iframe></div>');
		} else if (html.indexOf('vimeo') !== -1) {
			el.parent().replaceWith('<div class="video"><iframe src="//player.vimeo.com/video/' + html.substring(html.lastIndexOf('/') + 1) + '" frameborder="0" allowfullscreen></iframe></div>');
		}
	});
}

function marked_iframe(selector) {
	selector.each(function() {
		var el = $(this);
		el.parent().replaceWith('<div class="iframe">' + el.html().replace(/\&lt\;/g, '<').replace(/\&gt\;/g, '>') + '</div>');
	});
}