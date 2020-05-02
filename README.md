**Keep your cache clear** – as my mom always says.

wipeNodeCache – cleans, clears and wipes all old dirty modules from node.js internal require.cache. 

Useful for testing purposes when you need to freshly require a module. Or two.
Or just keep all modules fresh, for example for proxyquire.

## Install

```sh
$ npm install --save wipe-node-cache
```

## Usage

```js
// foo.js
var i = 0;
module.exports = function () {
	return ++i;
};
```

```js
var wipe = require('wipe-node-cache');

require('./foo')();
//=> 1

require('./foo')();
//=> 2

wipe(null, function(){return true;}) // this means clean a whole cache

require('./foo')();
//=> 1 . Module is fresh now
```

But this is simply, and stupid way. We can do it better!

## API

### wipe(object1, filterCallback, bubbleCallback)

Foreach module in system wipe will call `filterCallback` with 2 arguments – `object1`(first argument to wipe) and (absolute)`moduleName`)

👉 return true, if you want this module __wiped__.

---

After the first pass, when target modules are clened, wipe will enter a _bubbling stage_, where it will wipe all modules, which _use_ already evicted onces.

On this state `bubbleCallback` will be called with 1 argument - moduleName.

👉 return `true` if you want this module be purged as well, or `false` stop burn propagation.

## Examples

(see examples in source)
```js
function resolver(stubs, fileName, module) {
  return fileName.indexOf('node_modules') === -1
}

// wipe everything, except node_modules
wipe(null, resolver, function (moduleName) {
  return !resolver(null, moduleName);
});

// first wave - resolver returns true for any NON node_module, and that's all get evicted
// second warve - `!resolver` returns true for node_modules, which, well, everything we have got at this stage... 😅
```

```js
function resolver(stubs, fileName, module) {
  var dirname = module ? path.dirname(module) : '';
  var requireName = fileName;
  if (dirname) {
    requireName = fileName.charAt(0) == '.' ? path.normalize(dirname + '/' + fileName) : fileName;
  }

  for (var i in stubs) {
    if (requireName.indexOf(i) > 0) {
      return stubs[i];
    }
  }
}

// wipe anything from helpers, and app.js.
// but keep hands off node_modules and core during bubbling.
wipe({
  'helpers/*': true,
  'App.js': true
}, resolver, function (moduleName) {
  // do not evict modules from node_modules and core
  return !(moduleName.indexOf('node_modules') > 0) && !(moduleName.indexOf('core') > 0)
});
```

## Related

- [wipe-webpack-cache](https://github.com/theKashey/wipeWebpackCache) - the same package to be used with `webpack`
- [rewiremock](https://github.com/theKashey/rewiremock) - dependency mocking tool powered by this library
