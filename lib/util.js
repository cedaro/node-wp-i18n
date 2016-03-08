/**
 * node-wp-i18n
 * https://github.com/cedaro/node-wp-i18n
 *
 * @copyright Copyright (c) 2015 Cedaro, LLC
 * @license MIT
 */

'use strict';

var execFile = require('child_process').execFile;
var fs = require('fs');
var Promise = require('bluebird');

module.exports = {
  /**
   * Execute a file and return a promise.
   *
   * @param {string}   file Filename of the program to run.
   * @param {string[]} args List of string arguments.
   * @returns {Promise}
   */
  execFile: function(file, args) {
    return new Promise(function(resolve, reject) {
      execFile(file, args, function(error) {
        if (error) {
          reject();
        } else {
          resolve();
        }
      });
    });
  },

  /**
   * Whether a file exists.
   *
   * @param {string} filename Full path to a file.
   * @returns {boolean}
   */
  fileExists: function(filename) {
    try {
      var stat = fs.statSync(filename);
    } catch (ex) {
      return false;
    }

    return stat.isFile();
  }
};
