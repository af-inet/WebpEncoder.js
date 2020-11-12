# WebpEncoder.js

encode webp with native javascript

## clone

```
git clone git@github.com:af-inet/WebpEncoder.js.git
cd WebpEncoder.js
git submodule update --init --recursive
```

## build requirements

must have the emscripten sdk installed to build

https://kripken.github.io/emscripten-site/docs/getting_started/downloads.html

```
git clone https://github.com/emscripten-core/emsdk.git
cd emsdk
./emsdk install latest
./emsdk activate latest
source ./emsdk_env.sh
```

## build

```
make
```
