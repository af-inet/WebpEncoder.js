# WebpEncoder.js

encode webp with native javascript

## clone

```
git clone git@github.com:af-inet/WebpEncoder.js.git
cd WebpEncoder.js
git submodule update --init --recursive
```

## install

```sh
npm install github:af-inet/WebpEncoder.js
```

## usage (node)

```js
const fs = require('fs')
const WebpEncoder = require('webpencoder')

function fill(width, height, r, g, b, a) {
    const data = new Uint8Array(width * height * 4)
    for (let i = 0; i < data.length; i += 4) {
        data[i + 0] = r
        data[i + 1] = g
        data[i + 2] = b
        data[i + 3] = a
    }
    return data
}

WebpEncoder.M.onRuntimeInitialized = () => {
    const width = 100
    const height = 100
    const encoder = new WebpEncoder(width, height)
    // show red, green, blue each for 500ms
    encoder.addFrame(fill(width, height, 255, 0, 0, 255), 500)
    encoder.addFrame(fill(width, height, 0, 255, 0, 255), 500)
    encoder.addFrame(fill(width, height, 0, 0, 255, 255), 500)
    const data = encoder.export()
    fs.writeFileSync("test.webp", Buffer.from(data))
}
```

![test webp: red, green, blue each for 500ms](./test.webp)

## build requirements

must have the emscripten sdk installed to build

https://kripken.github.io/emscripten-site/docs/getting_started/downloads.html

```
git clone https://github.com/emscripten-core/emsdk.git
cd emsdk
./emsdk install latest
./emsdk activate latest
source ./emsdk_env.sh
cd ..
```

## build

```
make
```
