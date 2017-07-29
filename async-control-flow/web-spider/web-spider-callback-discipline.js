'use strict';

const request = require('request');
const fs = require('fs');
const mkdirp = require('mkdirp');
const path = require('path');
const utilities = require('./utils');

/**
 * @desc saves file
 * @param {String} filename
 * @param {String} contents
 * @param {Function} callback
 */
function saveFile(filename, contents, callback) {
    mkdirp(path.dirname(filename), err => {
        if (err) {
            return callback(err);
        }

        fs.writeFile(filename, contents, err => {
            if (err) {
                return callback(err);
            }

            callback(null, filename, true);
        });
    });
}

/**
 * @desc downloads file
 * @param {String} url
 * @param {String} filename
 * @param {Function} callback
 */
function downloadFile(url, filename, callback) {
    console.log(`Downloading ${url}`);

    request(url, (err, response, body) => {
        if (err) {
            return callback(err);
        }

        saveFile(filename, body, callback);
    });
}

/**
 * @desc downloads file if wasn't already downloaded
 * @param {String} url
 * @param {Function} callback
 */
function spider(url, callback) {
    const filename = utilities.urlToFilename(url);

    fs.exists(filename, exists => {
        if (exists) {
            return callback(null, filename, false);
        }

        downloadFile(url, filename, callback);
    });
}

spider(process.argv[2], (err, filename, downloaded) => {
    if (err) {
        return console.log(err);
    }

    downloaded ?
        console.log(`Completed the download of "${filename}"`) :
        console.log(`"${filename}" was already downloaded`);
});
