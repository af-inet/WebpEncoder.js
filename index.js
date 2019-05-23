var _WebpEncoder = require('./build/WebpEncoder.js');

function Malloc(data) {
    var ptr = _WebpEncoder._malloc(data.length);
    if (!ptr) {
        throw new Error("_malloc failed");
    }
    _WebpEncoder.HEAP8.set(data, ptr);
    return ptr
}

function WebpEncoder(width, height) {
    if ((typeof width) !== 'number' || (typeof height) !== 'number') {
        throw new Error("width or height arguments are not number")
    }
    this.width = width;
    this.height = height;
    this.done = false;
    this._encoder = _WebpEncoder._WebpEncoder_alloc(width, height);
    if (!this._encoder) {
        throw new Error('_WebpEncoder_allocx failed');
    }
}

WebpEncoder.prototype.addFrame = function (data, duration) {
    if ((typeof duration) !== 'number') {
        throw new Error("duration argument is not a number")
    }
    if (this.done) {
        throw new Error("addFrame() may not be called after export()")
    }
    var expected = this.width * this.height * 4;
    if (data.length != expected) {
        throw new Error('unexpected frame size ' + data.length.toString() + ' != ' + expected.toString());
    }
    var ptr = Malloc(data)
    var ok = _WebpEncoder._WebpEncoder_add(this._encoder, ptr, duration);
    if (ok != 0) {
        throw new Error('_WebpEncoder_add failed');
    }
}

WebpEncoder.prototype.export = function () {
    if (this.done) {
        throw new Error("export() may only be called once")
    }
    var output = _WebpEncoder._WebpEncoder_encode(this._encoder);
    if (!output) {
        throw new Error('_WebpEncoder_encode failed');
    }
    var outputSize = _WebpEncoder._WebpEncoder_size(this._encoder);
    var data = _WebpEncoder.HEAP8.subarray(output, output + outputSize);
    _WebpEncoder._WebpEncoder_free(this._encoder);
    this.done = true;
    return data;
}

module.exports = WebpEncoder;
