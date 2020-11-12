#include <stdio.h>
#include <emscripten.h>
#include <emscripten/bind.h>
#include "libwebp/src/webp/mux.h"
#include "libwebp/src/webp/encode.h"

using namespace emscripten;
extern "C"
{
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

    EMSCRIPTEN_KEEPALIVE
    WebPConfig CreateWebPConfig()
    {
        WebPConfig config;
        memset(&config, 0, sizeof(WebPConfig));
        WebPConfigInit(&config);
        return config;
    }

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
            WebPDataClear(&encoder->webp_data);
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

        encoder = (struct WebpEncoder *)malloc(sizeof(struct WebpEncoder));
        if (!encoder)
        {
            perror("malloc");
            return NULL;
        }
        WebpEncoderInit(encoder);

        encoder->width = width;
        encoder->height = height;

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
        WebPPictureImportRGBA(&encoder->frame, data, encoder->width * 4);
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

    EMSCRIPTEN_KEEPALIVE
    int WebpEncoder_config(val v, WebPConfig config)
    {
        fprintf(stdout, "[DEBUG] config.method = %d\n", config.method);
        if (!WebPValidateConfig(&config))
        {
            fprintf(stderr, "WebPValidateConfig failed.\n");
            return 0;
        }
        // TODO: there is probably a better way to do this pointer conversion, but this works for now.
        struct WebpEncoder *p = (struct WebpEncoder *)v.as<intptr_t>(allow_raw_pointers());
        p->config = config;
        return 1;
    }

    EMSCRIPTEN_BINDINGS(my_binding)
    {
        value_object<WebPConfig>("WebPConfig")
            .field("lossless", &WebPConfig::lossless)
            .field("quality", &WebPConfig::quality)
            .field("method", &WebPConfig::method)
            .field("image_hint", &WebPConfig::image_hint)
            .field("target_size", &WebPConfig::target_size)
            .field("target_PSNR", &WebPConfig::target_PSNR)
            .field("segments", &WebPConfig::segments)
            .field("sns_strength", &WebPConfig::sns_strength)
            .field("filter_strength", &WebPConfig::filter_strength)
            .field("filter_sharpness", &WebPConfig::filter_sharpness)
            .field("filter_type", &WebPConfig::filter_type)
            .field("autofilter", &WebPConfig::autofilter)
            .field("alpha_compression", &WebPConfig::alpha_compression)
            .field("alpha_filtering", &WebPConfig::alpha_filtering)
            .field("alpha_quality", &WebPConfig::alpha_quality)
            .field("pass", &WebPConfig::pass)
            .field("show_compressed", &WebPConfig::show_compressed)
            .field("preprocessing", &WebPConfig::preprocessing)
            .field("partitions", &WebPConfig::partitions)
            .field("partition_limit", &WebPConfig::partition_limit)
            .field("emulate_jpeg_size", &WebPConfig::emulate_jpeg_size)
            .field("thread_level", &WebPConfig::thread_level)
            .field("low_memory", &WebPConfig::low_memory)
            .field("near_lossless", &WebPConfig::near_lossless)
            .field("exact", &WebPConfig::exact)
            .field("use_delta_palette", &WebPConfig::use_delta_palette)
            .field("use_sharp_yuv", &WebPConfig::use_sharp_yuv)
            // .field("pad", &WebPConfig::pad);
            ;

        enum_<WebPImageHint>("WebPImageHint")
            .value("WEBP_HINT_DEFAULT", WEBP_HINT_DEFAULT)
            .value("WEBP_HINT_PICTURE", WEBP_HINT_PICTURE)
            .value("WEBP_HINT_PHOTO", WEBP_HINT_PHOTO)
            .value("WEBP_HINT_GRAPH", WEBP_HINT_GRAPH)
            .value("WEBP_HINT_LAST", WEBP_HINT_LAST);

        class_<WebpEncoder>("WebpEncoder");

        function("CreateWebPConfig", &CreateWebPConfig);
        function("WebpEncoder_config", &WebpEncoder_config);
    }
} // extern "C"
