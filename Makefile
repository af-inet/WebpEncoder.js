.PHONY: default

default: WebpEncoder.js

WebpEncoder.js WebpEncoder.js.mem: WebpEncoder.c libwebp
	emcc -O3 -s WASM=0 -s LINKABLE=1 -s EXPORTED_FUNCTIONS='["_WebpEncoder_encode", "_WebpEncoder_alloc", "_WebpEncoder_size", "_WebpEncoder_add", "_WebpEncoder_free"]' \
		-I. -I./libwebp \
		WebpEncoder.c \
		libwebp/src/{dec,dsp,demux,enc,mux,utils}/*.c \
		-o build/WebpEncoder.js

clean:
	rm build/WebpEncoder.js
	rm build/WebpEncoder.js.mem