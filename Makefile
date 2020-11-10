.PHONY: default

default: WebpEncoder.js

WebpEncoder.js WebpEncoder.js.mem: WebpEncoder.cc libwebp
	emcc \
		-s WASM=0 -s LINKABLE=1 -s ASSERTIONS=1 \
		-I. -I./libwebp \
		-s MODULARIZE \
		WebpEncoder.cc \
		libwebp/src/{dec,dsp,demux,enc,mux,utils}/*.c \
		--bind \
		-o build/WebpEncoder.js

clean:
	rm build/WebpEncoder.js
	rm build/WebpEncoder.js.mem