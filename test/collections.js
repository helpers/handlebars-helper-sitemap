'use strict';

require('mocha');
var fs = require('fs');
var path = require('path');
var assert = require('assert');
var del = require('delete');
var through = require('through2');
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

describe('collections template', function() {
  beforeEach(function() {
    app = assemble();
    app.helpers(sitemap.helpers);

    app.data('sitemap', {url: 'https://breakdance.io'});

    app.onLoad(/\.hbs$/, function(file, next) {
      file.extname = '.html';
      next();
    });

    app.pages('pages/*.hbs', {cwd: fixtures()});
  });

  afterEach(function(cb) {
    del(actual(), cb);
  });

  it('should generate a sitemap for a collection', function(cb) {
    app.create('files');
    app.files('sitemap.xml', {contents: sitemap.template, engine: 'hbs'});

    app.toStream('pages')
      .pipe(app.toStream('files'))
      .pipe(app.renderFile({collection: 'pages'}))
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

  it('should detect the collection if not defined', function(cb) {
    app.create('files');
    app.files('sitemap.xml', {contents: sitemap.template, engine: 'hbs'});

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

  it('should work when a sitemap view is pushed onto the stream', function(cb) {
    var view = app.view('sitemap.xml', {
      contents: sitemap.template,
      engine: 'hbs'
    });

    app.toStream('pages')
      .pipe(view.toStream())
      .pipe(app.renderFile())
      .pipe(app.dest(actual()))
      .on('end', function() {
        assert(exists(actual('sitemap.xml')));
        assert(matches(/aaa\.html/, actual('sitemap.xml')));
        assert(matches(/bbb\.html/, actual('sitemap.xml')));
        assert(matches(/ccc\.html/, actual('sitemap.xml')));
        cb();
      });
  });

  it('should work when view is rendered separately', function(cb) {
    var view = app.view('sitemap.xml', {
      contents: sitemap.template,
      engine: 'hbs'
    });

    app.toStream('pages')
      .pipe(app.renderFile())
      .pipe(app.dest(actual()))
      .on('end', function() {
        view.toStream()
          .pipe(app.renderFile('hbs'))
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
});
