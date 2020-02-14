function waveCallback_default() {
  return true;
}

function removeFromCache_nodejs(moduleName) {
  delete require.cache[moduleName];
}

function assignParents(modules) {
  var result = {};
  Object.keys(modules).forEach(function (moduleName) {
    const parent = modules[moduleName];
    const line = parent.children || [];
    line.forEach(({id: childName}) => {
      result[childName] = result[childName] || {parents: []};
      result[childName].parents.push(moduleName)
    });
  });
  return result;
}

function burn(cache, wipeList, lookup, callback, removeFromCache = removeFromCache_nodejs) {
// Secondary wave
  while (wipeList.length) {
    var removeList = wipeList;
    wipeList = [];

    removeList.forEach(function (moduleName) {
      if (callback(moduleName)) {
        if (lookup[moduleName]) {
          wipeList.push.apply(wipeList, lookup[moduleName].parents);
          delete lookup[moduleName];
        }

        removeFromCache(moduleName);
      }
    });
  }
}

function purge(cache, wipeList, callback, removeFromCache, parents) {
  burn(cache, wipeList, parents || assignParents(cache), callback, removeFromCache);
}

function reverseString(str) {
  var result = "";
  for (var i = str.length - 1; i >= 0; i--) {
    result += str[i];
  }
  return result;
}

function buildIndexForward(cache) {
  return Object.keys(cache);
}

function getCache() {
  return require.cache;
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
function wipeCache(stubs, resolver, waveCallback, removeFromCache = removeFromCache_nodejs) {
  waveCallback = waveCallback || waveCallback_default;
  const cache = require.cache;

  wipeMap(
    cache,
    (cache, callback) => cache.forEach(
      moduleName => resolver(stubs, moduleName) && callback(moduleName)
    ),
    waveCallback,
    removeFromCache
  );
}

function wipeMap(cache, callback, waveCallback, removeFromCache) {
  const wipeList = [];
  const parents = assignParents(cache);
  const simpleIndex = buildIndexForward(cache);
  const compositeIndex = [...new Set([...simpleIndex, ...Object.keys(parents)])];
  callback(compositeIndex, name => {
    removeFromCache(name);
    wipeList.push(name);
  });
  return purge(cache, wipeList, waveCallback, undefined, parents);
}

exports.buildIndexForward = buildIndexForward;
exports.getCache = getCache;
exports.removeFromCache = removeFromCache_nodejs;
exports.purge = purge;
exports.burn = burn;

exports.wipeCache = wipeCache;
exports.wipeMap = wipeMap;

