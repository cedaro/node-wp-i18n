var fs = require('fs');
var gettext = require('gettext-parser');
var makepot = require('../lib/makepot');
var path = require('path');
var test = require('tap').test;

test('makepot default', function(t) {
  t.plan(3);

  makepot({
    cwd: path.resolve('tmp/makepot/basic-plugin')
  }).then(function() {
		var potFilename = path.resolve('tmp/makepot/basic-plugin/basic-plugin.pot');
		t.ok(fs.statSync(potFilename));

    var pot = gettext.po.parse(fs.readFileSync(potFilename, 'utf8'));
    var pluginName = 'Example Plugin';
    t.equal(pot.headers['project-id-version'], pluginName, 'the plugin name should be the project id in the pot file');
		t.equal(pot.translations[''][ pluginName ]['msgid'], pluginName, 'the plugin name should be included as a string in the pot file');
  });
});

test('makepot custom pot file', function(t) {
  t.plan(1);

  makepot({
    cwd: path.resolve('tmp/makepot/basic-plugin'),
    potFile: 'custom.pot'
  }).then(function() {
		var potFilename = path.resolve('tmp/makepot/basic-plugin/custom.pot');
		t.ok(fs.statSync(potFilename));
  });
});
