# super-tiny-redpack

#### feature

-  bundle commonjs module
-  dynamic require/require.ensure

#### config

```javascript
//redpack.config.js
module.exports = {
    entry:'./src/test1/index.js'
}

//or

module.exports = {
    entry:[
        './src/test1/index.js',
        './src/test2/index.js',
        './src/test3/index.js'
    ],
    filename:'index.bundle.js'
}
```

#### usage

node ./bin/pack.js