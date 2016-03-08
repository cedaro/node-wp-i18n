/**
 * node-wp-i18n
 * https://github.com/cedaro/node-wp-i18n
 *
 * @copyright Copyright (c) 2015 Cedaro, LLC
 * @license MIT
 */

'use strict';

var _ = require('lodash');
var path = require('path');
var Promise = require('bluebird');
var util = require('./util');
var WPPackage = require('./package');

var toolsPath = path.resolve(__dirname, '../bin/php/');

/**
 * Add a text domain to gettext functions in PHP files.
 *
 * @param {Array} files   List of files.
 * @param {Array} options
 * @returns {Promise}
 */
module.exports = function(files, options) {
  options = _.merge({
    cwd: process.cwd(),
    dryRun: false,
    textDomain: '',
    updateDomains: []
  }, options);

  options.cwd = path.resolve(process.cwd(), options.cwd);
  var wpPackage = new WPPackage(options.cwd);

  if ('' === options.textdomain) {
    options.textdomain = wpPackage.getHeader('Text Domain');
  }

  if (true === options.updateDomains) {
    options.updateDomains = ['all'];
  }

  var cmdArgs = [
    path.resolve(toolsPath, 'grunt-add-textdomain.php'),
    options.dryRun ? '' : '-i',
    options.textdomain,
    '',
    options.updateDomains.join(',')
  ];

  var status = [];
  files.forEach(function(file) {
    cmdArgs[3] = path.resolve(options.cwd, file);
    status.push(util.execFile('php', cmdArgs));
  });

  return Promise.all(status);
};
