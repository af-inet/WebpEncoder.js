var fs = require('fs')
var WebpEncoder = require('./index.js')

function fill(width, height, r, g, b, a, data) {
	var data = data ? data : new Uint8Array(width * height * 4)
	for (var i = 0; i < data.length; i += 4) {
		data[i + 0] = r
		data[i + 1] = g
		data[i + 2] = b
		data[i + 3] = a
	}
	return data
}

function testWebp(filename, width, height, frameCount) {
	var start = new Date().getTime()
	var encoder = new WebpEncoder(width, height)
	var config = encoder.createConfig()
	config.method = 0
	encoder.setConfig(config)
	for (var i = 0; i < frameCount; i++) {
		switch (i % 3) {
			case 0:
				encoder.addFrame(fill(width, height, 255, 0, 0, 255), 500)
				break
			case 1:
				encoder.addFrame(fill(width, height, 0, 255, 0, 255), 500)
				break
			case 2:
				encoder.addFrame(fill(width, height, 0, 0, 255, 255), 500)
				break
		}
	}
	var data = encoder.export()
	var end = new Date().getTime()
	var time = end - start
	console.log(
		`time: ${time} ms width: ${width} height: ${height} filename: ${filename}`
	)
	fs.writeFileSync(filename, Buffer.from(data))
}

function testWebpReusableBuffer(filename, width, height, frameCount) {
	var start = new Date().getTime()
	var encoder = new WebpEncoder(width, height)
	var config = encoder.createConfig()
	config.method = 0
	encoder.setConfig(config)
	var buffer = encoder.getReusableBuffer()
	for (var i = 0; i < frameCount; i++) {
		switch (i % 3) {
			case 0:
				fill(width, height, 255, 0, 0, 255, buffer)
				encoder.addFrameFromReusableBuffer(500)
				break
			case 1:
				fill(width, height, 0, 255, 0, 255, buffer)
				encoder.addFrameFromReusableBuffer(500)
				break
			case 2:
				fill(width, height, 0, 0, 255, 255, buffer)
				encoder.addFrameFromReusableBuffer(500)
				break
		}
	}
	var data = encoder.export()
	var end = new Date().getTime()
	var time = end - start
	console.log(
		`time: ${time} ms width: ${width} height: ${height} filename: ${filename}`
	)
	fs.writeFileSync(filename, Buffer.from(data))
}

WebpEncoder.M.onRuntimeInitialized = () => {
	testWebp("test.256-256-60.copy.webp", 256, 256, 60)
	testWebpReusableBuffer("test.256-256-60.reusable.webp", 256, 256, 60)
}
