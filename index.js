var M = require('./build/WebpEncoder.js')

/**
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

class WebpEncoder {
	constructor(width, height) {
		if (typeof width !== 'number' || typeof height !== 'number') {
			throw new Error('width or height arguments are not number')
		}
		this.M = M
		this.width = width
		this.height = height
		this.done = false
		this._encoder = this.M._WebpEncoder_alloc(width, height)
		if (!this._encoder) {
			throw new Error('WebpEncoder_allocx failed')
		}
	}

	Malloc(data) {
		var ptr = this.M._malloc(data.length)
		if (!ptr) {
			throw new Error('_malloc failed')
		}
		this.M.HEAP8.set(data, ptr)
		return ptr
	}

	/**
	 * @returns {WebPConfig}
	 */
	createConfig() {
		return this.M.CreateWebPConfig()
	}

	/**
	 * @param {WebPConfig} config
	 */
	setConfig(config) {
		var ok = this.M.WebpEncoder_config(this._encoder, config)
		if (!ok) {
			throw new Error('_WebpEncoder_add failed')
		}
	}

	addFrame(data, duration) {
		if (typeof duration !== 'number') {
			throw new Error('duration argument is not a number')
		}
		if (this.done) {
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
		var ptr = this.Malloc(data)
		var ok = this.M._WebpEncoder_add(this._encoder, ptr, duration)
		this.M._free(ptr)
		if (ok != 0) {
			throw new Error('_WebpEncoder_add failed')
		}
	}

	export() {
		if (this.done) {
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
		this.done = true
		return data
	}
}

WebpEncoder.M = M

module.exports = WebpEncoder
