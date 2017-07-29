'use strict';

/**
 * @desc process collection in async parallel
 * @param {Array} collection
 * @param {Function} processor
 * @param {Function} callback
 */

module.exports = function processCollectionInAsyncSequence(collection, processor, callback) {
    let completed = 0;

    collection.forEach(item => {
        processor(item, () => {
            if (++completed === tasks.length) {
                callback();
            }
        });
    });
};
