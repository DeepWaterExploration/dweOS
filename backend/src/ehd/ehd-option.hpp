#ifndef EHD_OPTION_HPP
#define EHD_OPTION_HPP

#include <cassert>

#include "camera/v4l2-camera.hpp"
#include "ehd-controls.hpp"

namespace libehd {
// from http://stackoverflow.com/a/4956493/238609
template <typename T>
static T swap_endian(T u) {
    union {
        T u;
        unsigned char u8[sizeof(T)];
    } source, dest;

    source.u = u;

    for (size_t k = 0; k < sizeof(T); k++)
        dest.u8[k] = source.u8[sizeof(T) - k - 1];

    return dest.u;
}

namespace xu {

/**
 * @brief exploreHD UVC extension unit control abstraction
 *
 */
class Option {
    public:
    /**
     * @brief Construct a new uvc xu option object
     *
     * @param camera Pointer to uvc device handle
     * @param unit exploreHD XU control unit
     * @param ctrl exploreHD XU control selector
     * @param id   exploreHD option id
     * @param size byte size of buffer (11 bytes if not set)
     */
    Option(v4l2::Camera *camera, xu::Unit unit, xu::Selector ctrl,
        xu::Command id, uint8_t size = 11);

    ~Option() {
        /* Free the data buffer */
        free(_data);
    }

    /**
     * @brief Send the data buffer to the command in the hardware
     *
     * This data buffer is to be packed with the pack() method.
     *
     */
    void set();

    /**
     * @brief Run the get request to the internal data buffer on the chip
     *
     * The data can be unpacked with the unpack() method.
     *
     */
    void get();

    /**
     * @brief Pack data into the internal data buffer
     *
     * @tparam T type to pack (EX: uint8_t, uint16_t, uint32_t)
     * @param value value to pack
     * @param byte_order byte order of packed value (EX: LITTLE_ENDIAN,
     * BIG_ENDIAN)
     */
    template <typename T>
    void pack(T value, int byte_order = LITTLE_ENDIAN) {
        assert(byte_order == LITTLE_ENDIAN || byte_order == BIG_ENDIAN);
        assert(_data_ptr - _data <= _size - sizeof(T));

        if (byte_order != BYTE_ORDER) value = swap_endian<T>(value);
        memcpy(_data_ptr, &value, sizeof(T));
        _data_ptr += sizeof(T);
    }

    /**
     * @brief Unpack data from the internal data buffer
     *
     * @tparam T type to unpack (EX: uint8_t, uint16_t, uint32_t)
     * @param byte_order byte order of unpacked value (EX: LITTLE_ENDIAN,
     * BIG_ENDIAN)
     * @return T unpacked value
     */
    template <typename T>
    void unpack(T &value, int byte_order = LITTLE_ENDIAN) {
        assert(byte_order == LITTLE_ENDIAN || byte_order == BIG_ENDIAN);
        assert(_data_ptr - _data <= _size - sizeof(T));

        value = *reinterpret_cast<T *>(_data);
        if (byte_order != BYTE_ORDER) value = swap_endian<T>(value);
        _data_ptr += sizeof(T);
    }

    /**
     * @brief clear the internal buffers
     *
     */
    void clear();

    private:
    /* Internal device handle */
    v4l2::Camera *_camera;
    /* Data buffers */
    uint8_t *_data, *_data_ptr;
    /* XU Control information */
    xu::Command _id;
    xu::Unit _unit;
    xu::Selector _ctrl;
    uint8_t _size;
};

}  // namespace xu

}  // namespace libehd

#endif
