var fs = require("fs")
var WebpEncoder = require("./index.js")

var width = 100
var height = 100

var start = new Date().getTime();

var encoder = new WebpEncoder(width, height)
encoder.addFrame(fill(255, 0, 0, 255), 500)
encoder.addFrame(fill(0, 255, 0, 255), 500)
encoder.addFrame(fill(0, 0, 255, 255), 500)
var data = encoder.export()

var end = new Date().getTime();
var time = end - start;
console.log('Execution time: ' + time + ' ms');

fs.writeFileSync("test.webp", new Buffer(data))

console.log('wrote: test.webp');

function fill(r, g, b, a) {
    var data = new Uint8Array(width * height * 4)
    for (var i = 0; i < data.length; i += 4) {
        data[i + 0] = r
        data[i + 1] = g
        data[i + 2] = b
        data[i + 3] = a
    }
    return data
}