const fs = require('fs')
const WebpEncoder = require('./index.js')

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
    const width = 64
    const height = 64
    const encoder = new WebpEncoder(width, height)
    // show red, green, blue each for 500ms
    encoder.addFrame(fill(width, height, 255, 0, 0, 255), 500)
    encoder.addFrame(fill(width, height, 0, 255, 0, 255), 500)
    encoder.addFrame(fill(width, height, 0, 0, 255, 255), 500)
    const data = encoder.export()
    fs.writeFileSync("test.webp", Buffer.from(data))
}