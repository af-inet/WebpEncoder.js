#include <stdio.h>
#include "emscripten.h"
#include "libwebp/src/webp/mux.h"
#include "libwebp/src/webp/encode.h"

struct WebpEncoder
{
    int width;
    int height;
    int frame_counter;
    int frame_timestamp;
    WebPPicture frame;
    WebPData webp_data;
    WebPConfig config;
    WebPAnimEncoder *enc;
    WebPAnimEncoderOptions encoder_options;
};

void WebpEncoderInit(struct WebpEncoder *encoder)
{
    if (encoder)
    {
        memset(encoder, 0, sizeof(*encoder));
    }
}

EMSCRIPTEN_KEEPALIVE
struct WebpEncoder *WebpEncoder_free(struct WebpEncoder *encoder)
{
    if (encoder)
    {
        WebPAnimEncoderDelete(encoder->enc);
        WebPPictureFree(&encoder->frame);
        free(encoder);
    }
    else
    {
        fprintf(stderr, "called WebpEncoder_free on a NULL pointer\n");
    }
    return NULL;
}

EMSCRIPTEN_KEEPALIVE
struct WebpEncoder *WebpEncoder_alloc(int width, int height)
{
    struct WebpEncoder *encoder = NULL;

    if (width < 0 || height < 0)
    {
        fprintf(stderr, "invalid width or height\n");
        return NULL;
    }

    encoder = malloc(sizeof(struct WebpEncoder));
    WebpEncoderInit(encoder);

    encoder->width = width;
    encoder->height = height;

    if (encoder == NULL)
    {
        perror("malloc");
        return NULL;
    }

    WebPDataInit(&encoder->webp_data);

    if (!WebPConfigInit(&encoder->config) || !WebPAnimEncoderOptionsInit(&encoder->encoder_options) ||
        !WebPPictureInit(&encoder->frame))
    {
        fprintf(stderr, "Error! Version mismatch!\n");
        return WebpEncoder_free(encoder);
    }

    encoder->frame.width = width;
    encoder->frame.height = height;

    if (!WebPPictureAlloc(&encoder->frame))
    {
        fprintf(stderr, "WebPPictureAlloc failed.\n");
        return WebpEncoder_free(encoder);
    }

    encoder->enc = WebPAnimEncoderNew(encoder->width, encoder->height, &encoder->encoder_options);

    if (encoder->enc == NULL)
    {
        fprintf(stderr, "WebPAnimEncoderNew failed\n");
        return WebpEncoder_free(encoder);
    }

    return encoder;
}

EMSCRIPTEN_KEEPALIVE
int WebpEncoder_add(struct WebpEncoder *encoder, uint8_t *data, int duration)
{
    WebPPictureImportRGBA(&encoder->frame, data, encoder->width);
    if (!WebPAnimEncoderAdd(encoder->enc, &encoder->frame, encoder->frame_timestamp, &encoder->config))
    {
        fprintf(stderr, "Error while adding frame #%d: %s\n", encoder->frame_counter,
                WebPAnimEncoderGetError(encoder->enc));
        return 1;
    }
    encoder->frame_timestamp += duration;
    encoder->frame_counter += 1;
    return 0;
}

EMSCRIPTEN_KEEPALIVE
uint8_t *WebpEncoder_encode(struct WebpEncoder *encoder)
{
    if (!WebPAnimEncoderAssemble(encoder->enc, &encoder->webp_data))
    {
        fprintf(stderr, "%s\n", WebPAnimEncoderGetError(encoder->enc));
        return NULL;
    }
    return (uint8_t *)encoder->webp_data.bytes;
}

EMSCRIPTEN_KEEPALIVE
size_t WebpEncoder_size(struct WebpEncoder *encoder)
{
    return encoder->webp_data.size;
}
