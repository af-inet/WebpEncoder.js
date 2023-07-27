var M = require('./build/WebpEncoder.js')

/**
 * Webp encoder options.
 * see: https://github.com/webmproject/libwebp/blob/982c177c8a0d475c7386da9b424b57da7eeabf3a/src/webp/encode.h#L95
 *
 * @typedef {Object} WebPConfig
 * @property {number} lossless
 * @property {number} quality
 * @property {number} method
 * @property {'WEBP_HINT_DEFAULT'|'WEBP_HINT_PICTURE'|'WEBP_HINT_PHOTO'|'WEBP_HINT_GRAPH'|'WEBP_HINT_LAST'} image_hint
 * @property {number} target_size
 * @property {number} target_PSNR
 * @property {number} segments
 * @property {number} sns_strength
 * @property {number} filter_strength
 * @property {number} filter_sharpness
 * @property {number} filter_type
 * @property {number} autofilter
 * @property {number} alpha_compression
 * @property {number} alpha_filtering
 * @property {number} alpha_quality
 * @property {number} pass
 * @property {number} show_compressed
 * @property {number} preprocessing
 * @property {number} partitions
 * @property {number} partition_limit
 * @property {number} emulate_jpeg_size
 * @property {number} thread_level
 * @property {number} low_memory
 * @property {number} near_lossless
 * @property {number} exact
 * @property {number} use_delta_palette
 * @property {number} use_sharp_yuv
 */

/**
 * Underlying WASM module.
 * 
 * @typedef {Object} Module
 * @property {function} onRuntimeInitialized called when the wasm module is ready, see https://emscripten.org/docs/api_reference/module.html#Module.onRuntimeInitialized
 */

class WebpEncoder {
	/**
	 * @param {number} width
	 * @param {number} height
	 */
	constructor(width, height) {
		if (typeof width !== 'number' || typeof height !== 'number') {
			throw new Error('width or height arguments are not number')
		}
		/** @type {Module} */
		this.M = M
		/**
		 * Width of the webp in pixels.
		 * @type {number}
		 */
		this.width = width
		/**
		 * Height of the webp in pixels.
		 * @type {number}
		 */
		this.height = height
		// used to track if export has been called
		this._done = false
		this._encoder = this.M._WebpEncoder_alloc(width, height)
		if (!this._encoder) {
			throw new Error('WebpEncoder_allocx failed')
		}
		var reusuableBufferPtr = this.M._malloc(width * height * 4)
		if (!reusuableBufferPtr) {
			throw new Error('_malloc failed')
		}
		/**
		 * @type {number}
		 */
		this._reusuableBufferPtr = reusuableBufferPtr
		/**
		 * @type {Uint8Array}
		 */
		this._reusuableBuffer = new Uint8Array(this.M.HEAPU8.buffer, this._reusuableBufferPtr, width * height * 4)
	}

	// Convenience function to allocate memory and copy data into it.
	_alloc(data) {
		var ptr = this.M._malloc(data.length)
		if (!ptr) {
			throw new Error('_malloc failed')
		}
		this.M.HEAP8.set(data, ptr)
		return ptr
	}

	/**
	 * Returns a buffer that can be used to pass frame data. The buffer is reused on each call to addFrameFromReusableBuffer.
	 * @returns {Uint8Array}
	 */
	getReusableBuffer() {
		return this._reusuableBuffer
	}

	/**
	 * Create a WebPConfig object, which can be passed to setConfig.
	 * Use this to set encoder options.
	 *
	 * @returns {WebPConfig}
	 */
	createConfig() {
		return this.M.CreateWebPConfig()
	}

	/**
	 * @param {cvhch} config
	 */
	setConfig(config) {
		var ok = this.M.WebpEncoder_config(this._encoder, config)
		if (!ok) {
			throw new Error('_WebpEncoder_add failed')
		}
	}

	/**
	 * add 1 frame to the webp animation, using the buffer returned by getReusableBuffer
	 *
	 * @param {number} duration
	 */
	addFrameFromReusableBuffer(duration) {
		if (typeof duration !== 'number') {
			throw new Error('duration argument is not a number')
		}
		if (this._done) {
			throw new Error('addFrame() may not be called after export()')
		}
		var ok = this.M._WebpEncoder_add(this._encoder, this._reusuableBufferPtr, duration)
		if (ok != 0) {
			throw new Error('_WebpEncoder_add failed')
		}
	}

	/**
	 * add 1 frame to the webp animation
	 *
	 * NOTE: addFrame allocates memory for the frame, so it is reccomended to use
	 * getReusableBuffer and addFrameFromReusableBuffer where possible.
	 *
	 * @param {Array<number>} array pixel data, RGBA format. array.length must be width * height * 4
	 * @param {number} duration how long to show this frame in milliseconds
	 */
	addFrame(data, duration) {
		if (typeof duration !== 'number') {
			throw new Error('duration argument is not a number')
		}
		if (this._done) {
			throw new Error('addFrame() may not be called after export()')
		}
		var expected = this.width * this.height * 4
		if (data.length != expected) {
			throw new Error(
				'unexpected frame size ' +
					data.length.toString() +
					' != ' +
					expected.toString()
			)
		}
		var ptr = this._alloc(data)
		var ok = this.M._WebpEncoder_add(this._encoder, ptr, duration)
		this.M._free(ptr)
		if (ok != 0) {
			throw new Error('_WebpEncoder_add failed')
		}
	}

	/**
	 * Encode all frames and return the raw webp data. This also frees the encoder from WASM memory.
	 * NOTE: export() may only be called once! If you need to export multiple times, create a new WebpEncoder.
	 *
	 * @returns {Uint8Array} raw webp data
	 */
	export() {
		if (this._done) {
			throw new Error('export() may only be called once')
		}
		var output = this.M._WebpEncoder_encode(this._encoder)
		if (!output) {
			throw new Error('_WebpEncoder_encode failed')
		}
		var outputSize = this.M._WebpEncoder_size(this._encoder)
		var data = new Uint8Array(
			this.M.HEAP8.subarray(output, output + outputSize)
		)
		this.M._WebpEncoder_free(this._encoder)
		this.M._free(this._reusuableBufferPtr)
		this._done = true
		return data
	}
}

/** @type {Module} */
WebpEncoder.M = M // do we need this

module.exports = WebpEncoder
