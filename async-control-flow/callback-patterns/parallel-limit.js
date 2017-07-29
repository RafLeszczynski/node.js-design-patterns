'use strict';

/**
 * @desc process collection in async parallel
 * @param {Array} collection
 * @param {Number} limit
 * @param {Function} processor
 * @param {Function} callback
 */

module.exports = function processCollectionInAsyncSequence(collection, limit, processor, callback) {
    let running = 0, completed = 0, index = 0;

    function processorCb() {
        if (completed === collection.length) {
            return callback();
        }

        completed++;
        running--;

        next();
    }

    function next() {
        while(running < concurrency && index < collection.length) {
            processor(collection[index++], processorCb);
            running++;
        }
    }

    next();
};
