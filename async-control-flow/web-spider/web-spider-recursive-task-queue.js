'use strict';

const request = require('request');
const fs = require('fs');
const mkdirp = require('mkdirp');
const path = require('path');
const utilities = require('./utils');
const TaskQueue = require('../callback-patterns/TaskQueue');

const downloadQueue = new TaskQueue(2);

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

    if (links.length === 0) {
        return process.nextTick(callback);
    }

    let completed = 0, hasErrors = false;

    links.forEach(link => {
        downloadQueue.pushTask(done => {
            spider(link, nesting - 1, err => {
                if (err) {
                    hasErrors = true;
                    return callback(err);
                }

                if (++completed === links.length && !hasErrors) {
                    callback();
                }

                done();
            });
        });
    });
}

/**
 * @desc downloads file if wasn't already downloaded
 * @param {String} url
 * @param {Number} nesting
 * @param {Function} callback
 */
function spider(url, nesting, callback) {
    // avoid race conditions - multiple downloads of the same file in parallel
    if (spidering.has(url)) {
        return process.nextTick(callback);
    }

    spidering.set(url, true);

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

const spidering = new Map();

spider(process.argv[2], 1, err => {
    if(err) {
        console.log(err);
        process.exit();
    } else {
        console.log('Download complete');
    }
});
