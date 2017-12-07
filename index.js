var Module = require('module');

function waveCallback_default() {
  return true;
}

function removeFromCache(moduleName) {
  delete require.cache[moduleName];
}
/**
 * Wipes node.js module cache.
 * First it look for modules to wipe, and wipe them.
 * Second it looks for users of that modules and wipe them to. Repeat.
 * Use waveCallback to control secondary wave.
 * @param {Object} stubs Any objects, which will just be passed as first parameter to resolver.
 * @param {Function} resolver function(stubs, moduleName) which shall return true, if module must be wiped out.
 * @param {Function} [waveCallback] function(moduleName) which shall return false, if parent module must not be wiped.
 */
function wipeCache(stubs, resolver, waveCallback) {
  waveCallback = waveCallback || waveCallback_default;
  var wipeList = [];
  var removedList = []; // debug only

  var cache = require.cache;

  // First wave
  Object.keys(cache).forEach(function (moduleName) {
    var test = resolver(stubs, moduleName);
    if (test) {
      wipeList.push(moduleName);
      removedList.push(moduleName);
      removeFromCache(moduleName);
    }
  });

  // Secondary wave
  while (wipeList.length) {
    var removeList = wipeList;
    wipeList = [];

    Object.keys(cache).forEach(function (moduleName) {
      if (waveCallback(moduleName)) {
        var subCache = cache[moduleName].children;
        subCache.forEach(function (subModule) {
          if (removeList.indexOf(subModule.filename) >= 0) {
            wipeList.push(moduleName);
            removedList.push(moduleName);
            removeFromCache(moduleName);
          }
        });
      }
    });
  }
}

module.exports = wipeCache;