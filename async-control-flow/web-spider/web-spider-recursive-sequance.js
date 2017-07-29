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

        fs.writeFile(filename, contents, callback);
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

        saveFile(filename, body, err => {
            if (err) {
                return callback(err);
            }

            console.log(`Downloaded and saved: ${url}`);

            callback(null, body);
        });
    });
}

/**
 * @desc download all internal links from passed html body in sequence
 * @param {String} currentUrl
 * @param {Buffer} body
 * @param {Number} nesting
 * @param {Function} callback
 */
function spiderLinks(currentUrl, body, nesting, callback) {
    if (nesting === 0) {
        return process.nextTick(callback);
    }

    const links = utilities.getPageLinks(currentUrl, body);

    function iterate(index) {
        if (index === links.length) {
            return callback();
        }

        spider(links[index], nesting - 1, err => {
            if (err) {
                return callback(err);
            }

            iterate(index + 1);
        });
    }

    iterate(0);
}

/**
 * @desc downloads file if wasn't already downloaded
 * @param {String} url
 * @param {Number} nesting
 * @param {Function} callback
 */
function spider(url, nesting, callback) {
    const filename = utilities.urlToFilename(url);

    fs.readFile(filename, 'utf8', (err, body) => {
        if (err) {
            if (err.code !== 'ENOENT') {
                return callback(err);
            }

            return downloadFile(url, filename, (err, body) => {
                if (err) {
                    return callback(err);
                }

                spiderLinks(url, body, nesting, callback);
            });
        }

        spiderLinks(url, body, nesting, callback);
    });
}

spider(process.argv[2], 1, err => {
    if(err) {
        console.log(err);
        process.exit();
    } else {
        console.log('Download complete');
    }
});
