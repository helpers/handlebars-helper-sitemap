'use strict';

var fs = require('fs');
var url = require('url');
var path = require('path');
var get = require('get-value');
var isObject = require('isobject');
var assign = require('assign-deep');
var toHtml = require('html-tag');
var moment = require('moment');

/**
 * Expose sitemap helpers and templates
 */

var sitemap = module.exports;
var helpers = sitemap.helpers = {};
var templates = path.join.bind(path, __dirname, 'templates');

/**
 * Helpers
 */

helpers.collection = require('helper-collection');

helpers.tag = function(name, context, options) {
  if (typeof name !== 'string') {
    throw new TypeError('expected name to be a string');
  }

  var text = '';

  if (isObject(context) && context.hash) {
    options = context;
    context = null;
  }

  if (typeof context === 'string') {
    text = context;
  }

  var html = toHtml(name, options.hash, text);
  return safeString(html);
};

helpers.urlset = function(items, options) {
  if (Array.isArray(items)) {
    return items;
  }
  var items = get(options, 'data.root.items')
    || get(options, 'data.root.sitemap.items')
    || get(options, 'data.root.sitemap.urlset');
  if (!Array.isArray(items)) {
    throw new TypeError('expected sitemap.urlset to be an array');
  }
  return items;
};

helpers.loc = function(item, data) {
  if (typeof data.url !== 'string') {
    throw new TypeError('expected url to be a string');
  }
  if (typeof item.relative !== 'string') {
    throw new TypeError('expected item.relative to be a string');
  }

  let rel = item.relative;
  if (item.data.dest && data.dest) {
    var dest = path.relative(data.dest, item.data.dest);
    rel = path.join(dest, rel);
  }

  var res = url.resolve(data.url, rel);
  return safeString(toHtml('loc', res));
};

helpers.lastmod = function(item, data) {
  var date = data.lastModified || data.lastmod || item.stat && item.stat.mtime;
  var res = moment(date || new Date()).format('YYYY-MM-DD');
  return safeString(toHtml('lastmod', res));
};

helpers.changefreq = function(item, data) {
  return safeString(toHtml('changefreq', data.changefreq || 'weekly'));
};

helpers.priority = function(item, data) {
  return safeString(toHtml('priority', data.priority || '0.5'));
};

helpers.url = function(item, options) {
  var data = assign({}, globalData(options), itemData(item));
  var text = '\n';
  text += '    ' + helpers.loc(item, data) + '\n';
  text += '    ' + helpers.lastmod(item, data) + '\n';
  text += '    ' + helpers.changefreq(item, data) + '\n';
  text += '    ' + helpers.priority(item, data) + '\n';
  text += '  ';
  return safeString(toHtml('url', text));
};

helpers.filterItems = function(items) {
  return items.filter(function(item) {
    return item.stem !== 'sitemap' && item.data.sitemap !== false;
  });
};

helpers.greaterThan = function(a, b) {
  return a > b;
};

helpers.throw = function(msg) {
  var err = new Error(msg);
  err.path = __filename;
  throw err;
};

/**
 * Templates
 */

Object.defineProperty(sitemap, 'collections', {
  set: function() {
    throw new Error('sitemap.collections is a getter and cannot be defined');
  },
  get: function() {
    return fs.readFileSync(templates('collections.hbs'));
  }
});

Object.defineProperty(sitemap, 'template', {
  set: function() {
    throw new Error('sitemap.template is a getter and cannot be defined');
  },
  get: function() {
    return fs.readFileSync(templates('template.hbs'));
  }
});

Object.defineProperty(sitemap, 'layout', {
  set: function() {
    throw new Error('sitemap.layout is a getter and cannot be defined');
  },
  get: function() {
    return fs.readFileSync(templates('layout.hbs'));
  }
});

Object.defineProperty(sitemap, 'content', {
  set: function() {
    throw new Error('sitemap.content is a getter and cannot be defined');
  },
  get: function() {
    return fs.readFileSync(templates('content.hbs'));
  }
});

Object.defineProperty(sitemap, 'partial', {
  set: function() {
    throw new Error('sitemap.partial is a getter and cannot be defined');
  },
  get: function() {
    return fs.readFileSync(templates('partial.hbs'));
  }
});

Object.defineProperty(sitemap, 'page', {
  set: function() {
    throw new Error('sitemap.page is a getter and cannot be defined');
  },
  get: function() {
    return fs.readFileSync(templates('page.hbs'));
  }
});

/**
 * Utils
 */

function globalData(options) {
  var sitemap = get(options, 'data.root.sitemap');
  var data = get(options, 'data.root');
  return assign({}, data, sitemap);
}

function itemData(item) {
  var sitemap = get(item, 'data.sitemap');
  return assign({}, item.data, sitemap);
}

function safeString(str) {
  function SafeString(string) {
    this.string = string;
  }
  SafeString.prototype.toString = SafeString.prototype.toHTML = function() {
    return '' + this.string;
  };
  return new SafeString(str);
}
