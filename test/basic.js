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

describe('basic sitemap', function() {
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
});
