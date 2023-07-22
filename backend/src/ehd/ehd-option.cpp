#include "ehd-option.hpp"

#include <cstring>

#include "ehd-controls.hpp"

using namespace libehd::xu;

/* libehd::xu::Option definitions */

Option::Option(
    v4l2::Camera *camera, Unit unit, Selector ctrl, Command id, uint8_t size)
    : _camera(camera), _id(id), _unit(unit), _ctrl(ctrl), _size(size) {
    /* Initialize the internal buffer */
    _data = (uint8_t *)malloc(_size);
    memset(_data, 0, _size);
    _data_ptr = _data;
}

void Option::set() {
    /* Upon setting, the data buffer is reintialized to the start of the buffer
     */
    _data_ptr = _data;

    uint8_t *data = (uint8_t *)malloc(_size);
    memset(data, 0, _size);
    /* Set the exploreHD tag and command ID */
    data[0] = xu::EHD_DEVICE_TAG;
    data[1] = _id;
    /* Switch the command to ID */
    _camera->uvc_set_ctrl(_unit, _ctrl, data, _size);

    memcpy(data, _data, _size);
    _camera->uvc_set_ctrl(_unit, _ctrl, data, _size);
    memset(_data, 0, _size);

    free(data);
}

void Option::get() {
    _data_ptr = _data;

    uint8_t *data = (uint8_t *)malloc(_size);
    memset(data, 0, _size);
    /* Set the exploreHD tag and command ID */
    data[0] = xu::EHD_DEVICE_TAG;
    data[1] = _id;
    /* Switch the command to ID */
    _camera->uvc_set_ctrl(_unit, _ctrl, data, _size);

    memset(data, 0, _size);
    _camera->uvc_get_ctrl(_unit, _ctrl, data, _size);

    memcpy(_data, data, _size);

    free(data);
}

void Option::clear() {
    _data = (uint8_t *)malloc(_size);
    memset(_data, 0, _size);
    _data_ptr = _data;
}
