'use strict';

/**
 * @desc process collection in async sequence
 * @param {Array} collection
 * @param {Function} iterator
 * @param {Function} callback
 */

module.exports = function processCollectionInAsyncSequence(collection, iterator, callback) {
    function iterate(index) {
        if (index === collection.length)  {
            return callback();
        }

        iterator(tasks[index], () => iterate(index + 1));
    }

    iterate(0);
};
