COMPONENT('aselected', function(self, config) {

	self.readonly();

	self.make = function() {
		self.refresh();
		ON('location', self.refresh);
	};

	self.refresh = function() {
		var arr = self.find('a');
		var url = location.pathname;
		for (var i = 0; i < arr.length; i++) {
			var el = $(arr[i]);
			var href = el.attr('href');
			var selected = config.strict ? url === href : url.indexOf(href) !== -1;
			el.tclass('selected', selected);
		}
	};
});

COMPONENT('lazyimages', function(self) {

	var is = null;
	var regtest = /[?./]/;

	self.readonly();
	self.singleton();

	self.make = function() {
		is = true;
		$(W).on('scroll', self.refresh);
		setTimeout(self.refresh, 1000);
	};

	self.refresh = function() {
		setTimeout2(self.id, self.prepare, 200);
	};

	self.released = self.refresh;
	self.setter = self.refresh;

	self.prepare = function() {
		var scroll = $(W).scrollTop();
		var beg = scroll;
		var end = beg + WH;
		var off = 50;
		var arr = document.querySelectorAll('img[data-src]');
		for (var i = 0; i < arr.length; i++) {
			var t = arr[i];
			if (!t.$lazyload) {
				var src = t.getAttribute('data-src');
				if (src && regtest.test(src)) {
					var el = $(t);
					var top = (is ? 0 : scroll) + el.offset().top;
					if ((top + off) >= beg && (top - off) <= end) {
						t.setAttribute('src', src);
						t.$lazyload = true;
						t.removeAttribute('data-src');
					}
				}
			}
		}
	};
});

COMPONENT('imageviewer', 'selector:.img-viewer;container:body;loading:1', function(self, config) {

	var cls = 'ui-imageviewer';
	var cls2 = '.' + cls;
	var isclosed = false;
	var isrendering = false;
	var events = {};
	var current;

	events.keydown = function(e) {
		switch (e.which) {
			case 38:
			case 37: // prev
				self.find('button[name="prev"]').trigger('click');
				break;
			case 32: // next
			case 39:
			case 40:
				self.find('button[name="next"]').trigger('click');
				break;
			case 27: // close
				self.close();
				break;
		}
	};

	events.bind = function() {
		if (!events.is) {
			events.is = true;
			$(W).on('keydown', events.keydown);
		}
	};

	events.unbind = function() {
		if (events.is) {
			events.is = false;
			$(W).off('keydown', events.keydown);
		}
	};

	self.readonly();
	self.blind();
	self.singleton();
	self.nocompile && self.nocompile();

	self.make = function() {
		self.aclass(cls + ' hidden');
		self.append('<div class="{0}-header"><button name="close"><i class="fa fa-times"></i></button><div><b>Name</b><div class="help">Dimension</div></div></div><div class="{0}-loading hidden"><div></div></div><div class="{0}-buttons"><button name="prev"><i class="fa fa-arrow-left"></i></button><button name="next"><i class="fa fa-arrow-right"></i></button></div><div class="{0}-viewer"><div class="{0}-cell"><img /></div></div>'.format(cls));
		self.resize();

		$(W).on('resize', self.resize);

		$(document.body).on('click', config.selector, function() {
			var el = $(this);
			isclosed = false;
			self.show(el);
		});

		self.event('click', 'button[name]', function() {
			var t = this;
			if (!t.disabled) {
				if (t.name === 'close')
					self.close();
				else
					self.show($(this.$el));
			}
		});

		self.find('img').on('load', function() {
			isrendering = false;
			self.loading(false);
		});
	};

	self.close = function() {
		isclosed = true;
		isrendering = false;
		$('html,body').rclass(cls + '-noscroll');
		self.aclass('hidden');
		events.unbind();
		current = null;
	};

	self.loading = function(is) {

		if (!config.loading)
			return;

		var el = self.find(cls2 + '-loading');
		if (is) {
			el.rclass('hidden', is);
			return;
		}

		setTimeout(function() {
			el.aclass('hidden');
		}, 500);
	};

	self.show = function(el) {

		if (isrendering || el == null || isclosed)
			return;

		var parent = el.closest(config.container);
		var arr = parent.find(config.selector).toArray();
		var index = arr.indexOf(el[0]);
		var buttons = self.find(cls2 + '-buttons').find('button');
		current = el;

		buttons[0].disabled = index === 0; // prev
		buttons[1].disabled = index >= arr.length - 1; // next

		if (!buttons[0].disabled)
			buttons[0].$el = arr[index - 1];

		if (!buttons[1].disabled)
			buttons[1].$el = arr[index + 1];

		self.loading(true);
		isrendering = true;

		var image = new Image();
		//image.crossOrigin = 'anonymous';
		image.src = el[0].src;
		image.onload = function() {

			var img = this;
			var ratio;

			var mw = WW - 10;
			var mh = WH - 85;

			if (img.width > img.height)
				ratio = mw / (img.width / 100);
			else
				ratio = mh / (img.height / 100);

			if (ratio > 100)
				ratio = 100;

			if (isclosed)
				return;

			events.bind();
			self.find('img').attr('src', img.src).attr('width', img.width / 100 * ratio).attr('height', img.height / 100 * ratio);
			self.find('.help').html(img.width + 'x' + img.height + 'px');
			self.find('b').html(el.attr('alt') || el.attr('title') || 'Unknown image');
			self.rclass('hidden');
			$('html,body').aclass(cls + '-noscroll');
		};
	};

	self.resize = function() {
		var viewer = self.find(cls2 + '-viewer');
		var loading = self.find(cls2 + '-loading');
		var css = {};
		css.height = WH - 45;
		css.width = WW;
		viewer.css(css);
		loading.css(css);
		current && setTimeout2(self.ID, function() {
			self.show(current);
		}, 500);
	};

});

COMPONENT('markdownpreview', 'showsecret:Show secret data;hidesecret:Hide secret data', function(self, config) {

	var cls = 'ui-markdownpreview';
	var cls2  = '.' + cls;
	var elcache;
	var elbody;

	self.bindvisible();
	self.readonly();
	self.nocompile && self.nocompile();

	self.make = function() {

		if (!config.html) {
			self.append('<div class="{0}-body"></div><div class="{0}-cache hidden"></div>'.format(cls));
			elcache = self.find(cls2 + '-cache');
			elbody = self.find(cls2 + '-body');
		}

		self.event('click', '.showsecret', function() {
			var el = $(this);
			var next = el.next();
			next.tclass('hidden');

			var is = next.hclass('hidden');
			var icons = el.find('i');
			icons.eq(0).tclass('fa-unlock', !is).tclass('fa-lock', is);
			icons.eq(1).tclass('fa-angle-up', !is).tclass('fa-angle-down', is);
			el.find('b').html(config[(is ? 'show' : 'hide') + 'secret']);
		});
	};

	var markdown_id = function(value) {
		var end = '';
		var beg = '';
		if (value.charAt(0) === '<')
			beg = '-';
		if (value.charAt(value.length - 1) === '>')
			end = '-';
		return (beg + value.slug() + end).replace(/-{2,}/g, '-');
	};

	self.redraw = function(el) {

		el.find('.lang-secret').each(function() {
			var el = $(this);
			el.parent().replaceWith('<div class="secret"><span class="showsecret"><i class="fa fa-lock"></i><i class="fa pull-right fa-angle-down"></i><b>' + config.showsecret + '</b></span><div class="hidden">' + el.html().trim().markdown() +'</div></div>');
		});

		el.find('.lang-video').each(function() {
			var t = this;
			if (t.$mdloaded)
				return;
			t.$mdloaded = 1;
			var el = $(t);
			var html = el.html();
			if (html.indexOf('youtube') !== -1)
				el.parent().replaceWith('<div class="video"><iframe src="https://www.youtube.com/embed/' + html.split('v=')[1] + '" frameborder="0" allowfullscreen></iframe></div>');
			else if (html.indexOf('vimeo') !== -1)
				el.parent().replaceWith('<div class="video"><iframe src="//player.vimeo.com/video/' + html.substring(html.lastIndexOf('/') + 1) + '" frameborder="0" allowfullscreen></iframe></div>');
		});

		el.find('.lang-barchart').each(function() {

			var t = this;
			if (t.$mdloaded)
				return;

			t.$mdloaded = 1;
			var el = $(t);
			var arr = el.html().split('\n').trim();
			var series = [];
			var categories = [];
			var y = '';

			for (var i = 0; i < arr.length; i++) {
				var line = arr[i].split('|').trim();
				for (var j = 1; j < line.length; j++) {
					if (i === 0)
						series.push({ name: line[j], data: [] });
					else
						series[j - 1].data.push(+line[j]);
				}
				if (i)
					categories.push(line[0]);
				else
					y = line[0];
			}

			var options = {
				chart: {
					height: 300,
					type: 'bar',
				},
				yaxis: { title: { text: y }},
				series: series,
				xaxis: { categories: categories, },
				fill: { opacity: 1 },
			};

			var chart = new ApexCharts($(this).parent().empty()[0], options);
			chart.render();
		});

		el.find('.lang-linerchar').each(function() {

			var t = this;
			if (t.$mdloaded)
				return;
			t.$mdloaded = 1;

			var el = $(t);
			var arr = el.html().split('\n').trim();
			var series = [];
			var categories = [];
			var y = '';

			for (var i = 0; i < arr.length; i++) {
				var line = arr[i].split('|').trim();
				for (var j = 1; j < line.length; j++) {
					if (i === 0)
						series.push({ name: line[j], data: [] });
					else
						series[j - 1].data.push(+line[j]);
				}
				if (i)
					categories.push(line[0]);
				else
					y = line[0];
			}

			var options = {
				chart: {
					height: 300,
					type: 'line',
				},
				yaxis: { title: { text: y }},
				series: series,
				xaxis: { categories: categories, },
				fill: { opacity: 1 },
			};

			var chart = new ApexCharts($(this).parent().empty()[0], options);
			chart.render();
		});

		el.find('.lang-iframe').each(function() {

			var t = this;
			if (t.$mdloaded)
				return;
			t.$mdloaded = 1;

			var el = $(t);
			el.parent().replaceWith('<div class="iframe">' + el.html().replace(/&lt;/g, '<').replace(/&gt;/g, '>') + '</div>');
		});

		el.find('pre code').each(function(i, block) {
			var t = this;
			if (t.$mdloaded)
				return;
			t.$mdloaded = 1;
			hljs.highlightBlock(block);
		});

		el.find('a').each(function() {
			var t = this;
			if (t.$mdloaded)
				return;
			t.$mdloaded = 1;
			var el = $(t);
			var href = el.attr('href');
			href.substring(0, 1) !== '/' && el.attr('target', '_blank');
			if (href === '#') {
				var beg = '';
				var end = '';
				var text = el.html();
				if (text.substring(0, 1) === '<')
					beg = '-';
				if (text.substring(text.length - 1) === '>')
					end = '-';
				el.attr('href', '#' + (beg + markdown_id(el.text()) + end));
			}
		});

		el.find('.code').rclass('hidden');

		if (config.headlines) {
			var arr = [];
			el.find('h1,h2,h3,h4').each(function() {
				var el = $(this);
				arr.push({ name: el.text(), id: el.attr('id'), tag: this.tagName.toLowerCase(), offset: el.offset().top });
			});
			SEEX(config.headlines, arr);
		}

	};

	self.setter = function(value) {

		if (config.html) {
			self.redraw(self.element);
			return;
		}

		// Waits for markdown component
		if (!String.prototype.markdown) {
			setTimeout(self.setter, 500, value);
			return;
		}

		var cache = {};
		var html = (value || '').markdown();
		var vdom = $(html);

		elcache.empty();

		elbody.find('.code').each(function() {
			var t = this;
			cache[t.getAttribute('data-checksum')] = t;
			elcache[0].appendChild(t);
		});

		elbody.find('img').each(function() {
			var t = this;
			cache[t.getAttribute('data-checksum')] = t;
			elcache[0].appendChild(t);
		});

		vdom.find('.code').each(function() {
			var t = this;
			var h = 'code' + HASH(t.outerHTML, true) + '';
			if (cache[h])
				$(t).replaceWith(cache[h]);
			else
				t.setAttribute('data-checksum', h);
		}).rclass('hidden');

		vdom.find('img').each(function() {
			var t = this;
			var h = 'img' + HASH(t.outerHTML, true) + '';
			if (cache[h])
				$(t).replaceWith(cache[h]);
			else
				t.setAttribute('data-checksum', h);
		});

		elbody.html(vdom);
		self.redraw(elbody);
		config.render && EXEC(self.makepath(config.render), elbody);
	};

	self.readingtime = function() {
		var arr = self.find('h1,h2,h3,h4,h5,p,li');
		var sum = 0;
		for (var i = 0; i < arr.length; i++) {
			var text = $(arr[i]).text();
			var words = text.split(' ');
			for (var j = 0; j < words.length; j++) {
				var word = words[j];
				sum += (word.length * 0.650) / 10; // Reading time for 10 characters word is 450 ms
			}
		}
		return (sum / 60) >> 0;
	};

}, ['https://cdnjs.cloudflare.com/ajax/libs/highlight.js/9.12.0/styles/github.min.css', 'https://cdnjs.cloudflare.com/ajax/libs/highlight.js/9.12.0/highlight.min.js', 'https://cdnjs.cloudflare.com/ajax/libs/apexcharts/3.8.5/apexcharts.min.js']);

COMPONENT('markdown', function (self) {

	self.readonly();
	self.singleton();
	self.blind();
	self.nocompile();

	self.make = function() {
		// Remove from DOM because Markdown is used as a String prototype and Tangular helper
		setTimeout(function() {
			self.remove();
		}, 500);
	};

	/*! Markdown | (c) 2019 Peter Sirka | www.petersirka.com */
	(function Markdown() {

		var keywords = /\{.*?\}\(.*?\)/g;
		var linksexternal = /(https|http):\/\//;
		var format = /__.*?__|_.*?_|\*\*.*?\*\*|\*.*?\*|~~.*?~~|~.*?~/g;
		var ordered = /^[a-z|0-9]{1}\.\s|^-\s/i;
		var orderedsize = /^(\s|\t)+/;
		var code = /`.*?`/g;
		var encodetags = /<|>/g;
		var regdash = /-{2,}/g;
		var regicons = /(^|[^\w]):[a-z-]+:([^\w]|$)/g;
		var regemptychar = /\s|\W/;

		var encode = function(val) {
			return '&' + (val === '<' ? 'lt' : 'gt') + ';';
		};

		function markdown_code(value) {
			return '<code>' + value.substring(1, value.length - 1) + '</code>';
		}

		function markdown_imagelinks(value) {
			var end = value.lastIndexOf(')') + 1;
			var img = value.substring(0, end);
			var url = value.substring(end + 2, value.length - 1);
			var label = markdown_links(img);
			var footnote = label.substring(0, 13);

			if (footnote === '<sup data-id=' || footnote === '<span data-id' || label.substring(0, 9) === '<a href="')
				return label;

			return '<a href="' + url + '"' + (linksexternal.test(url) ? ' target="_blank"' : '') + '>' + label + '</a>';
		}

		function markdown_table(value, align, ishead) {

			var columns = value.substring(1, value.length - 1).split('|');
			var builder = '';

			for (var i = 0; i < columns.length; i++) {
				var column = columns[i].trim();
				if (column.charAt(0) == '-')
					continue;
				var a = align[i];
				builder += '<' + (ishead ? 'th' : 'td') + (a && a !== 'left' ? (' class="' + a + '"') : '') + '>' + column + '</' + (ishead ? 'th' : 'td') + '>';
			}

			return '<tr>' + builder + '</tr>';
		}

		function markdown_links(value) {
			var end = value.lastIndexOf(']');
			var img = value.charAt(0) === '!';
			var text = value.substring(img ? 2 : 1, end);
			var link = value.substring(end + 2, value.length - 1);

			if ((/^#\d+$/).test(link)) {
				// footnotes
				return (/^\d+$/).test(text) ? '<sup data-id="{0}" class="footnote">{1}</sup>'.format(link.substring(1), text) : '<span data-id="{0}" class="footnote">{1}</span>'.format(link.substring(1), text);
			}

			var nofollow = link.charAt(0) === '@' ? ' rel="nofollow"' : linksexternal.test(link) ? ' target="_blank"' : '';
			return '<a href="' + link + '"' + nofollow + '>' + text + '</a>';
		}

		function markdown_image(value) {

			var end = value.lastIndexOf(']');
			var text = value.substring(2, end);
			var link = value.substring(end + 2, value.length - 1);
			var responsive = 1;
			var f = text.charAt(0);

			if (f === '+') {
				responsive = 2;
				text = text.substring(1);
			} else if (f === '-') {
				// gallery
				responsive = 3;
				text = text.substring(1);
			}

			return '<img src="' + link + '" alt="' + text + '"' + (responsive === 1 ? ' class="img-responsive"' : responsive === 3 ? ' class="gallery"' : '') + ' border="0" loading="lazy" />';
		}

		function markdown_keywords(value) {
			var keyword = value.substring(1, value.indexOf('}'));
			var type = value.substring(value.lastIndexOf('(') + 1, value.lastIndexOf(')'));
			return '<span class="keyword" data-type="{0}">{1}</span>'.format(type, keyword);
		}

		function markdown_links2(value) {
			value = value.substring(4, value.length - 4);
			return '<a href="' + (value.indexOf('@') !== -1 ? 'mailto:' : linksexternal.test(value) ? '' : 'http://') + value + '" target="_blank">' + value + '</a>';
		}

		function markdown_format(value, index, text) {

			var p = text.charAt(index - 1);
			var n = text.charAt(index + value.length);

			if ((!p || regemptychar.test(p)) && (!n || regemptychar.test(n))) {

				var beg = '';
				var end = '';
				var tag;

				if (value.indexOf('*') !== -1) {
					tag = value.indexOf('**') === -1 ? 'em' : 'strong';
					beg += '<' + tag + '>';
					end = '</' + tag + '>' + end;
				}

				if (value.indexOf('_') !== -1) {
					tag = value.indexOf('__') === -1 ? 'u' : 'b';
					beg += '<' + tag + '>';
					end = '</' + tag + '>' + end;
				}

				if (value.indexOf('~') !== -1) {
					beg += '<strike>';
					end = '</strike>' + end;
				}

				var count = value.charAt(1) === value.charAt(0) ? 2 : 1;
				return beg + value.substring(count, value.length - count) + end;
			}

			return value;
		}

		function markdown_id(value) {

			var end = '';
			var beg = '';

			if (value.charAt(0) === '<')
				beg = '-';

			if (value.charAt(value.length - 1) === '>')
				end = '-';

			// return (beg + value.replace(regtags, '').toLowerCase().replace(regid, '-') + end).replace(regdash, '-');
			return (beg + value.slug() + end).replace(regdash, '-');
		}

		function markdown_icon(value) {

			var beg = -1;
			var end = -1;

			for (var i = 0; i < value.length; i++) {
				var code = value.charCodeAt(i);
				if (code === 58) {
					if (beg === -1)
						beg = i + 1;
					else
						end = i;
				}
			}

			return value.substring(0, beg - 1) + '<i class="fa fa-' + value.substring(beg, end) + '"></i>' + value.substring(end + 1);
		}

		function markdown_urlify(str) {
			return str.replace(/(^|\s)+(((https?:\/\/)|(www\.))[^\s]+)/g, function(url, b, c) {
				var len = url.length;
				var l = url.charAt(len - 1);
				var f = url.charAt(0);
				if (l === '.' || l === ',')
					url = url.substring(0, len - 1);
				else
					l = '';
				url = (c === 'www.' ? 'http://' + url : url).trim();
				return (f.charCodeAt(0) < 40 ? f : '') + '[' + url + '](' + url + ')' + l;
			});
		}

		String.prototype.markdown = function(opt) {

			// opt.wrap = true;
			// opt.linetag = 'p';
			// opt.ul = true;
			// opt.code = true;
			// opt.images = true;
			// opt.links = true;
			// opt.formatting = true;
			// opt.icons = true;
			// opt.tables = true;
			// opt.br = true;
			// opt.headlines = true;
			// opt.hr = true;
			// opt.blockquotes = true;
			// opt.sections = true;
			// opt.custom
			// opt.footnotes = true;
			// opt.urlify = true;
			// opt.keywords = true;

			var str = this;

			if (!opt)
				opt = {};

			var lines = str.split('\n');
			var builder = [];
			var ul = [];
			var table = false;
			var iscode = false;
			var ishead = false;
			var prev;
			var prevsize = 0;
			var tmp;

			if (opt.wrap == null)
				opt.wrap = true;

			if (opt.linetag == null)
				opt.linetag = 'p';

			var closeul = function() {
				while (ul.length) {
					var text = ul.pop();
					builder.push('</' + text + '>');
				}
			};

			var formatlinks = function(val) {
				return markdown_links(val, opt.images);
			};

			var linkscope = function(val, index, callback) {

				var beg = -1;
				var beg2 = -1;
				var can = false;
				var n;

				for (var i = index; i < val.length; i++) {
					var c = val.charAt(i);

					if (c === '[') {
						beg = i;
						can = false;
						continue;
					}

					var il = val.substring(i, i + 4);

					if (il === '&lt;') {
						beg2 = i;
						continue;
					} else if (beg2 > -1 && il === '&gt;') {
						callback(val.substring(beg2, i + 4), true);
						beg2 = -1;
						continue;
					}

					if (c === ']') {

						can = false;

						if (beg === -1)
							continue;

						n = val.charAt(i + 1);

						// maybe a link mistake
						if (n === ' ')
							n = val.charAt(i + 2);

						// maybe a link
						can = n === '(';
					}

					if (beg > -1 && can && c === ')') {
						n = val.charAt(beg - 1);
						callback(val.substring(beg - (n === '!' ? 1 : 0), i + 1));
						can = false;
						beg = -1;
					}
				}

			};

			var imagescope = function(val) {

				var beg = -1;
				var can = false;
				var n;

				for (var i = 0; i < val.length; i++) {
					var c = val.charAt(i);

					if (c === '[') {
						beg = i;
						can = false;
						continue;
					}

					if (c === ']') {

						can = false;

						if (beg === -1)
							continue;

						n = val.charAt(i + 1);

						// maybe a link mistake
						if (n === ' ')
							n = val.charAt(i + 2);

						// maybe a link
						can = n === '(';
					}

					if (beg > -1 && can && c === ')') {
						n = val.charAt(beg - 1);
						var tmp = val.substring(beg - (n === '!' ? 1 : 0), i + 1);
						if (tmp.charAt(0) === '!')
							val = val.replace(tmp, markdown_image(tmp));
						can = false;
						beg = -1;
					}
				}


				return val;
			};

			for (var i = 0, length = lines.length; i < length; i++) {

				lines[i] = lines[i].replace(encodetags, encode);

				if (lines[i].substring(0, 3) === '```') {

					if (iscode) {
						if (opt.code !== false)
							builder.push('</code></pre></div>');
						iscode = false;
						continue;
					}

					closeul();
					iscode = true;
					if (opt.code !== false)
						tmp = '<div class="code hidden"><pre><code class="lang-' + lines[i].substring(3) + '">';
					prev = 'code';
					continue;
				}

				if (iscode) {
					if (opt.code !== false)
						builder.push(tmp + lines[i]);
					if (tmp)
						tmp = '';
					continue;
				}

				var line = lines[i];

				if (opt.urlify !== false && opt.links !== false)
					line = markdown_urlify(line);

				if (opt.custom)
					line = opt.custom(line);

				if (opt.formatting !== false)
					line = line.replace(format, markdown_format).replace(code, markdown_code);

				if (opt.images !== false)
					line = imagescope(line);

				if (opt.links !== false) {
					linkscope(line, 0, function(text, inline) {
						if (inline)
							line = line.replace(text, markdown_links2);
						else if (opt.images !== false)
							line = line.replace(text, markdown_imagelinks);
						else
							line = line.replace(text, formatlinks);
					});
				}

				if (opt.keywords !== false)
					line = line.replace(keywords, markdown_keywords);

				if (opt.icons !== false)
					line = line.replace(regicons, markdown_icon);

				if (!line) {
					if (table) {
						table = null;
						if (opt.tables !== false)
							builder.push('</tbody></table>');
					}
				}

				if (line === '' && lines[i - 1] === '') {
					closeul();
					if (opt.br !== false)
						builder.push('<br />');
					prev = 'br';
					continue;
				}

				if (line[0] === '|') {
					closeul();
					if (!table) {
						var next = lines[i + 1];
						if (next[0] === '|') {
							table = [];
							var columns = next.substring(1, next.length - 1).split('|');
							for (var j = 0; j < columns.length; j++) {
								var column = columns[j].trim();
								var align = 'left';
								if (column.charAt(column.length - 1) === ':')
									align = column[0] === ':' ? 'center' : 'right';
								table.push(align);
							}
							if (opt.tables !== false)
								builder.push('<table class="table table-bordered"><thead>');
							prev = 'table';
							ishead = true;
							i++;
						} else
							continue;
					}

					if (opt.tables !== false) {
						if (ishead)
							builder.push(markdown_table(line, table, true) + '</thead><tbody>');
						else
							builder.push(markdown_table(line, table));
					}
					ishead = false;
					continue;
				}

				if (line.charAt(0) === '#') {

					closeul();

					if (line.substring(0, 2) === '# ') {
						tmp = line.substring(2).trim();
						if (opt.headlines !== false)
							builder.push('<h1 id="' + markdown_id(tmp) + '">' + tmp + '</h1>');
						prev = '#';
						continue;
					}

					if (line.substring(0, 3) === '## ') {
						tmp = line.substring(3).trim();
						if (opt.headlines !== false)
							builder.push('<h2 id="' + markdown_id(tmp) + '">' + tmp + '</h2>');
						prev = '##';
						continue;
					}

					if (line.substring(0, 4) === '### ') {
						tmp = line.substring(4).trim();
						if (opt.headlines !== false)
							builder.push('<h3 id="' + markdown_id(tmp) + '">' + tmp + '</h3>');
						prev = '###';
						continue;
					}

					if (line.substring(0, 5) === '#### ') {
						tmp = line.substring(5).trim();
						if (opt.headlines !== false)
							builder.push('<h4 id="' + markdown_id(tmp) + '">' + tmp + '</h4>');
						prev = '####';
						continue;
					}

					if (line.substring(0, 6) === '##### ') {
						tmp = line.substring(6).trim();
						if (opt.headlines !== false)
							builder.push('<h5 id="' + markdown_id(tmp) + '">' + tmp + '</h5>');
						prev = '#####';
						continue;
					}
				}

				tmp = line.substring(0, 3);

				if (tmp === '---' || tmp === '***') {
					prev = 'hr';
					if (opt.hr !== false)
						builder.push('<hr class="line' + (tmp.charAt(0) === '-' ? '1' : '2') + '" />');
					continue;
				}

				// footnotes
				if ((/^#\d+:(\s)+/).test(line)) {
					if (opt.footnotes !== false) {
						tmp = line.indexOf(':');
						builder.push('<div class="footnotebody" data-id="{0}"><span>{0}:</span> {1}</div>'.format(line.substring(1, tmp).trim(), line.substring(tmp + 1).trim()));
					}
					continue;
				}

				if (line.substring(0, 5) === '&gt; ') {
					if (opt.blockquotes !== false)
						builder.push('<blockquote>' + line.substring(5).trim() + '</blockquote>');
					prev = '>';
					continue;
				}

				if (line.substring(0, 5) === '&lt; ') {
					if (opt.sections !== false)
						builder.push('<section>' + line.substring(5).trim() + '</section>');
					prev = '<';
					continue;
				}

				var tmpline = line.trim();

				if (opt.ul !== false && ordered.test(tmpline)) {

					var size = line.match(orderedsize);
					if (size)
						size = size[0].length;
					else
						size = 0;

					var append = false;

					if (prevsize !== size) {
						// NESTED
						if (size > prevsize) {
							prevsize = size;
							append = true;
							var index = builder.length - 1;
							builder[index] = builder[index].substring(0, builder[index].length - 5);
							prev = '';
						} else {
							// back to normal
							prevsize = size;
							builder.push('</' + ul.pop() + '>');
						}
					}

					var type = tmpline.charAt(0) === '-' ? 'ul' : 'ol';
					if (prev !== type) {
						var subtype;
						if (type === 'ol')
							subtype = tmpline.charAt(0);
						builder.push('<' + type + (subtype ? (' type="' + subtype + '"') : '') + '>');
						ul.push(type + (append ? '></li' : ''));
						prev = type;
						prevsize = size;
					}

					builder.push('<li>' + (type === 'ol' ? tmpline.substring(tmpline.indexOf('.') + 1) : tmpline.substring(2)).trim().replace(/\[x\]/g, '<i class="fa fa-check-square green"></i>').replace(/\[\s\]/g, '<i class="far fa-square"></i>') + '</li>');

				} else {
					closeul();
					line && builder.push((opt.linetag ? ('<' + opt.linetag + '>') : '') + line.trim() + (opt.linetag ? ('</' + opt.linetag + '>') : ''));
					prev = 'p';
				}
			}

			closeul();
			table && opt.tables !== false && builder.push('</tbody></table>');
			iscode && opt.code !== false && builder.push('</code></pre>');
			return (opt.wrap ? '<div class="markdown">' : '') + builder.join('\n').replace(/\t/g, '    ') + (opt.wrap ? '</div>' : '');
		};

	})();
});

COMPONENT('tiledetail', function(self, config, cls) {

	self.singleton();

	var cls2 = '.' + cls;
	var visible = false;
	var next, prev, nextread;

	self.make = function() {

		self.template = Tangular.compile(self.find('script').html());

		self.aclass(cls + ' hidden');
		self.append('<div class="{0}-container"><div class="{0}-controls"><button name="prev"><i class="fa fa-chevron-left"></i></button><button name="next"><i class="fa fa-chevron-right"></i></button></div><div class="{0}-image"><img class="img-responsive" width="600" height="600" /></div><div class="{0}-body"></div></div>'.format(cls));
		self.on('resize', self.resize);
		$(W).on('resize', self.resize);

		next = self.find('button[name="next"]');
		prev = self.find('button[name="prev"]');

		self.event('click', function(e) {
			if (e.target === self.dom || e.target.tagName === 'IMG')
				self.hide();
		});

		self.event('click', 'button', function() {
			nextread && nextread($(this).attrd('id'));
		});
	};

	self.resize = function() {
		setTimeout2(self.ID, self.resize2, 300);
	};

	self.resize2 = function() {
	};

	self.keydown = function(e) {
		if (e.which === 27)
			self.hide();

		if (e.which === 39) {
			if (next.hclass('hidden'))
				self.hide();
			else
				next.trigger('click');
		}

		if (e.which === 37) {
			if (prev.hclass('hidden'))
				self.hide();
			else
				prev.trigger('click');
		}
	};

	self.show = function(obj, nexttile) {
		self.resize2();
		self.find(cls2 + '-image img').attr('src', obj.picture);
		self.find(cls2 + '-body').html(self.template(obj));
		self.rclass('hidden');

		if (!visible) {
			$('html,body').aclass(cls + '-noscroll');
			$(W).on('keydown', self.keydown);
		}

		var tiles = $('.tilecard');
		var tp;
		var tn;

		for (var i = 0; i < tiles.length; i++) {
			var item = tiles[i];
			if (item.getAttribute('data-id') === obj.id) {
				tp = tiles[i - 1];
				tn = tiles[i + 1];
				break;
			}
		}

		prev.tclass('hidden', tp == null).attrd('id', tp ? tp.getAttribute('data-id') : '');
		next.tclass('hidden', tn == null).attrd('id', tn ? tn.getAttribute('data-id') : '');

		nextread = nexttile;
		visible = true;
	};

	self.hide = function() {
		self.aclass('hidden');
		$(W).off('keydown', self.keydown);
		$('html,body').rclass(cls + '-noscroll');
		visible = false;
		location.hash = '';
	};

});