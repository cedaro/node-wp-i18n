/**
 * node-wp-i18n
 * https://github.com/cedaro/node-wp-i18n
 *
 * @copyright Copyright (c) 2015 Cedaro, LLC
 * @license MIT
 */

'use strict';

var _ = require('underscore');
var crypto = require('crypto');
var fs = require('fs');
var gettext = require('gettext-parser');
var merge = require('mout/object/merge');
var util = require('./util');

module.exports = Pot;

/**
 * Fix POT file headers.
 *
 * Updates case-sensitive Poedit headers.
 *
 * @param {string} pot POT file contents.
 * @returns {string}
 */
function fixHeaders(contents) {
  contents = contents.replace(/x-poedit-keywordslist:/i, 'X-Poedit-KeywordsList:');
  contents = contents.replace(/x-poedit-searchpath-/ig, 'X-Poedit-SearchPath-');
  contents = contents.replace(/x-poedit-searchpathexcluded-/ig, 'X-Poedit-SearchPathExcluded-');
  contents = contents.replace(/x-poedit-sourcecharset:/i, 'X-Poedit-SourceCharset:');
  return contents;
}

function generateHash(content) {
  return crypto.createHash('md5').update(JSON.stringify(content)).digest('hex');
}

/**
 * Normalize Pot contents created by gettext-parser.
 *
 * This normalizes dynamic strings in a POT file in order to compare them and
 * determine if anything has changed.
 *
 * Headers are stored in two locations.
 *
 * @param {Object} pot Pot contents created by gettext-parser.
 * @returns {Object}
 */
function normalizeForComparison(pot) {
  var clone = merge({}, pot);

  // Normalize the content type case.
  clone.headers['content-type'] = clone.headers['content-type'].toLowerCase();
  clone.translations['']['']['msgstr'][0] = clone.translations['']['']['msgstr'][0].replace(/UTF-8/, 'utf-8');

  // Blank out the date.
  clone.headers['pot-creation-date'] = '';
  clone.translations['']['']['msgstr'][0] = clone.translations['']['']['msgstr'][0].replace(/POT-Creation-Date: (.+)/, 'POT-Creation-Date: ');

  return clone;
}

/**
 * Create a new Pot object.
 *
 * @class Pot
 */
function Pot(filename) {
  if (! (this instanceof Pot)) {
    return new Pot(filename);
  }

  this.isOpen = false;
  this.filename = filename;
  this.contents = '';
  this.initialDate = '';
  this.fingerprint = '';
}

/**
 * Whether the POT file exists.
 *
 * @returns {boolean}
 */
Pot.prototype.fileExists = function() {
  return util.fileExists(this.filename);
};

/**
 * Parse the POT file using gettext-parser.
 *
 * Initializes default properties to determine if the file has changed.
 *
 * Parsing the file removes duplicates, replacing the need for the msguniq binary.
 *
 * @param {string} Full path to the package root directory.
 * @returns {this}
 */
Pot.prototype.parse = function() {
  if (this.isOpen) {
    return this;
  }

  this.contents = fs.readFileSync(this.filename, 'utf8');
  this.contents = gettext.po.parse(this.contents);
  this.initialDate = this.contents.headers['pot-creation-date'];
  this.fingerprint = generateHash(normalizeForComparison(this.contents));
  this.isOpen = true;

  return this;
};

/**
 * Save the POT file.
 *
 * Writes the POT contents to a file.
 *
 * @returns {this}
 */
Pot.prototype.save = function() {
  var contents;

  if (! this.isOpen) {
    return this;
  }

  contents = gettext.po.compile(this.contents).toString();
  contents = fixHeaders(contents);

  fs.writeFileSync(this.filename, contents);
  this.isOpen = false;
  return this;
};

/**
 * Whether the contents have changed.
 *
 * @returns {boolean}
 */
Pot.prototype.hasChanged = function() {
  return generateHash(normalizeForComparison(this.contents)) !== this.fingerprint;
};

/**
 * Reset the creation date header.
 *
 * Useful when strings haven't changed in the package and don't want to commit
 * an unnecessary change to a repository.
 *
 * @returns {this}
 */
Pot.prototype.resetCreationDate = function() {
  this.contents.headers['pot-creation-date'] = this.initialDate;
  return this;
};

/**
 * Set the comment that shows at the beginning of the POT file.
 *
 * @param {string} Comment text.
 * @returns {this}
 */
Pot.prototype.setFileComment = function(comment) {
  if ('' === comment) {
    return this;
  }

  comment = comment.replace('{year}', new Date().getFullYear());
  this.contents.translations[''][''].comments.translator = comment;

  return this;
};

/**
 * Set a header value.
 *
 * @param {string} name  Name of the header.
 * @param {string} value Value of the header.
 * @returns {this}
 */
Pot.prototype.setHeader = function(name, value) {
  this.contents.headers[ name ] = value;
  return this;
};

/**
 * Set multiple headers at once.
 *
 * Magically expands certain values to add Poedit headers.
 *
 * @param {string} Full path to the package root directory.
 * @returns {this}
 */
Pot.prototype.setHeaders = function(headers) {
  if (_.isEmpty(headers)) {
    return this;
  }

  var poedit = {
    'language': 'en',
    'plural-forms': 'nplurals=2; plural=(n != 1);',
    'x-poedit-country': 'United States',
    'x-poedit-sourcecharset': 'UTF-8',
    'x-poedit-keywordslist': true,
    'x-poedit-basepath': '../',
    'x-poedit-searchpath-0': '.',
    'x-poedit-bookmarks': '',
    'x-textdomain-support': 'yes'
  };

  // Make sure header keys are lowercase.
  _.each(headers, function(value, name) {
    var keyLower = name.toLowerCase();
    if (name !== keyLower) {
      headers[ keyLower ] = headers[ name ];
      delete headers[ name ];
    }
  });

  // Add default Poedit headers.
  if ('poedit' in headers && true === headers['poedit']) {
    headers = _.extend(poedit, headers);
    delete headers['poedit'];
  }

  // Add the the Poedit keywordslist header.
  if ('x-poedit-keywordslist' in headers && true === headers['x-poedit-keywordslist']) {
    headers['x-poedit-keywordslist'] = '__;_e;_x:1,2c;_ex:1,2c;_n:1,2;_nx:1,2,4c;_n_noop:1,2;_nx_noop:1,2,3c;esc_attr__;esc_html__;esc_attr_e;esc_html_e;esc_attr_x:1,2c;esc_html_x:1,2c;';
  }

  var self = this;
  _.each(headers, function(value, name) {
    self.setHeader(name, value);
  });

  return this;
};
