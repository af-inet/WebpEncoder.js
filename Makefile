.PHONY: test clean

default: ./build/WebpEncoder.js

./build/WebpEncoder.js: ./WebpEncoder.cc
	emcc \
		-s ERROR_ON_UNDEFINED_SYMBOLS=0 \
		-s MAIN_MODULE=2 \
		-s WASM=1 \
		-s EXPORTED_FUNCTIONS=@exported_functions.json \
		-s EXPORTED_RUNTIME_METHODS='["ccall", "cwrap"]' \
		-O3 \
		-lembind \
		-I. \
		-I./libwebp \
		WebpEncoder.cc \
		libwebp/src/{dec,dsp,demux,enc,mux,utils}/*.c \
		-o ./build/WebpEncoder.js

test:
	node ./test-advanced.js

clean:
	rm -f build/*.js
	rm -f build/*.wasm
