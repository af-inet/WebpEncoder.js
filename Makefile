.PHONY: default

default: WebpEncoder.js

WebpEncoder.js WebpEncoder.js.mem: WebpEncoder.cc libwebp
	emcc \
		-O3 -s WASM=1 -s LINKABLE=1 \
		-I. -I./libwebp \
		-s EXPORTED_FUNCTIONS='["_WebpEncoder_encode", "_WebpEncoder_alloc", "_WebpEncoder_size", "_WebpEncoder_add", "_WebpEncoder_free", "_WebpEncoder_config"]' \
		WebpEncoder.cc \
		libwebp/src/{dec,dsp,demux,enc,mux,utils}/*.c \
		--bind \
		--memory-init-file 0 \
		-o build/WebpEncoder.js

clean:
	rm build/WebpEncoder.js
	rm build/WebpEncoder.js.mem