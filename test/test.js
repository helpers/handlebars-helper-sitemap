'use strict';

require('mocha');
var fs = require('fs');
var path = require('path');
var assert = require('assert');
var del = require('delete');
var assemble = require('assemble');
var exists = require('fs-exists-sync');
var sitemap = require('..');

// build variables
var actual = path.join.bind(path, __dirname, 'actual');
var fixtures = path.join.bind(path, __dirname, 'fixtures');
var app;

// util for matching fixtures
function matches(re, filepath) {
  var str = fs.readFileSync(filepath, 'utf8');
  return re.test(str);
}

describe('sitemap', function() {
  beforeEach(function() {
    app = assemble();
    app.helpers(sitemap.helpers);

    // custom collection
    app.create('posts');
    app.data('sitemap', {
      url: 'https://breakdance.io',
      changefreq: 'daily',
      priority: '0.8'
    });

    app.onLoad(/\.hbs$/, function(file, next) {
      file.extname = '.html';
      next();
    });

    app.preWrite(/\/sitemap\.(hbs|html)/, function(file, next) {
      file.basename = 'sitemap.xml';
      next();
    });

    app.pages('pages/*.hbs', {cwd: fixtures()});
    app.posts('posts/*.hbs', {cwd: fixtures()});
  });

  afterEach(function(cb) {
    del(actual(), cb);
  });

  it('should generate a sitemap from list.items on `sitemap.items`', function(cb) {
    var list = new app.List();
    list.addItems(app.views.posts);
    app.data('sitemap.items', list.items);

    app.partial('urlset.hbs', {contents: sitemap.template});
    app.create('files');
    app.files('sitemap.xml', {
      content: '{{> urlset }}',
      engine: 'hbs',
    });

    app.toStream('pages')
      .pipe(app.toStream('files'))
      .pipe(app.renderFile())
      .on('error', cb)
      .pipe(app.dest(actual()))
      .on('end', function() {
        assert(exists(actual('sitemap.xml')));
        assert(matches(/xxx\.html/, actual('sitemap.xml')));
        assert(matches(/yyy\.html/, actual('sitemap.xml')));
        assert(matches(/zzz\.html/, actual('sitemap.xml')));
        cb();
      });
  });

  it('should generate a sitemap from list.items on `items`', function(cb) {
    var list = new app.List();
    list.addItems(app.views.posts);
    app.data('items', list.items);

    app.partial('urlset.hbs', {contents: sitemap.template});
    app.create('files');
    app.files('sitemap.xml', {
      content: '{{> urlset }}',
      engine: 'hbs',
    });

    app.toStream('pages')
      .pipe(app.toStream('files'))
      .pipe(app.renderFile())
      .on('error', cb)
      .pipe(app.dest(actual()))
      .on('end', function() {
        assert(exists(actual('sitemap.xml')));
        assert(matches(/xxx\.html/, actual('sitemap.xml')));
        cb();
      });
  });

  it('should generate a sitemap for a collection', function(cb) {
    app.partial('urlset.hbs', {contents: sitemap.template});
    app.create('files');
    app.files('sitemap.xml', {
      content: '{{#pages}}{{> urlset }}{{/pages}}',
      engine: 'hbs',
    });

    app.toStream('pages')
      .pipe(app.toStream('files'))
      .pipe(app.renderFile())
      .on('error', cb)
      .pipe(app.dest(actual()))
      .on('end', function() {
        assert(exists(actual('sitemap.xml')));
        assert(matches(/aaa\.html/, actual('sitemap.xml')));
        assert(matches(/bbb\.html/, actual('sitemap.xml')));
        assert(matches(/ccc\.html/, actual('sitemap.xml')));
        cb();
      });
  });

  it('should generate a sitemap for multiple collections', function(cb) {
    app.partial('url.hbs', { contents: sitemap.partial });
    app.layout('urlset.hbs', { contents: sitemap.layout });
    app.create('files');
    app.files('sitemap.xml', {
      layout: 'urlset',
      engine: 'hbs',
      content: [
        '{{#each collections}}',
        '{{#_collection .}}',
        '{{> url }}',
        '{{/_collection}}',
        '{{/each}}'
      ].join('\n'),
    });

    app.toStream('pages')
      .pipe(app.toStream('files'))
      .pipe(app.renderFile({collections: ['pages', 'posts']}))
      .on('error', cb)
      .pipe(app.dest(actual()))
      .on('end', function() {
        assert(exists(actual('sitemap.xml')));
        assert(matches(/aaa\.html/, actual('sitemap.xml')));
        assert(matches(/bbb\.html/, actual('sitemap.xml')));
        assert(matches(/ccc\.html/, actual('sitemap.xml')));

        assert(matches(/xxx\.html/, actual('sitemap.xml')));
        assert(matches(/yyy\.html/, actual('sitemap.xml')));
        assert(matches(/zzz\.html/, actual('sitemap.xml')));
        cb();
      });
  });

  it('should work with the "page" template', function(cb) {
    app.create('files');
    app.file('sitemap.xml', { contents: sitemap.page, engine: 'hbs' });

    app.partial('urlset.hbs', { contents: sitemap.partial });
    app.partial('url.hbs', {
      content: [
        '{{#posts}}',
        '{{> urlset }}',
        '{{/posts}}'
      ].join('\n'),
    });

    app.toStream('pages')
      .pipe(app.toStream('files'))
      .pipe(app.renderFile())
      .on('error', cb)
      .pipe(app.dest(actual()))
      .on('end', function() {
        assert(exists(actual('sitemap.xml')));
        assert(matches(/xxx\.html/, actual('sitemap.xml')));
        assert(matches(/yyy\.html/, actual('sitemap.xml')));
        assert(matches(/zzz\.html/, actual('sitemap.xml')));
        cb();
      });
  });

  it('should handle multiple collections with "page" template', function(cb) {
    app.create('files');
    app.file('sitemap.xml', { contents: sitemap.page, engine: 'hbs' });

    app.partial('urlset.hbs', { contents: sitemap.partial });
    app.partial('url.hbs', {
      content: [
        '{{#each collections}}',
        '{{#_collection .}}',
        '{{> urlset }}',
        '{{/_collection}}',
        '{{/each}}'
      ].join('\n'),
    });

    app.toStream('pages')
      .pipe(app.toStream('files'))
      .pipe(app.renderFile({collections: ['pages', 'posts']}))
      .on('error', cb)
      .pipe(app.dest(actual()))
      .on('end', function() {
        assert(exists(actual('sitemap.xml')));
        assert(matches(/aaa\.html/, actual('sitemap.xml')));
        assert(matches(/bbb\.html/, actual('sitemap.xml')));
        assert(matches(/ccc\.html/, actual('sitemap.xml')));

        assert(matches(/xxx\.html/, actual('sitemap.xml')));
        assert(matches(/yyy\.html/, actual('sitemap.xml')));
        assert(matches(/zzz\.html/, actual('sitemap.xml')));
        cb();
      });
  });
});
