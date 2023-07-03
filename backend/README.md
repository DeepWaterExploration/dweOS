# Backend

## Dependencies

- glib-2.0
- gstreamer-check-1.0
- libudev

## API

#### Getting the list of connected devices

<details>
<summary><code>GET</code> <code><b>/devices</b></code> <code>Retrieves a list of devices connected to the system</code></summary>

##### Parameters

> N/A

##### Responses

> | http code | content-type | response |
> |-----------|--------------|----------|
> | 200 | application/json | Device List |

</details>

#### Getting information on a specific device

<details>
<summary><code>GET</code> <code><b>/device</b></code> <code>Retrieves information on a specific device connected to the system</code></summary>

##### Parameters

> | name | type | data type | description |
> |------|------|-----------|-------------|
> | `index` | required | integer | The index of the connected camera |

##### Responses

> | http code | content-type | response |
> |-----------|--------------|----------|
> | 200 | application/json | Device |
> | 400 | N/A | Error, invalid index |

</details>

#### Configuring a camera stream

<details>
<summary><code>POST</code> <code><b>/device</b></code> <code>Configures a camera stream</code></summary>

##### Parameters

> | name | type | data type | description |
> |------|------|-----------|-------------|
> | `index` | required | integer | The index of the connected camera |
> | `format` | required | object | The format of the stream |
> | `format.format` | required | string | The pixel format of the stream ("MJPG", "H264") |
> | `format.width` | required | integer | The stream width |
> | `format.height` | required | integer | The stream height |
> | `format.interval` | required | object | The stream interval |
> | `format.interval.numerator` | required | integer | The stream interval numerator |
> | `format.interval.denominator` | required | integer | The stream interval denominator |

##### Responses

> | http code | content-type | response |
> |-----------|--------------|----------|
> | 200 | N/A | N/A |
> | 403 | N/A | Error, invalid index |

</details>

#### Add a stream endpoint

<details>
<summary><code>POST</code> <code><b>/add_stream_endpoint</b></code> <code>Adds a stream endpoint</code></summary>

##### Parameters

> | name | type | data type | description |
> |------|------|-----------|-------------|
> | `index` | required | integer | The index of the connected camera |
> | `endpoint` | required | object | The stream endpoint object |
> | `endpoint.host` | required | string | The host of the stream endpoint |
> | `endpoint.port` | required | integer | The port of the stream endpoint |

##### Responses

> | http code | content-type | response |
> |-----------|--------------|----------|
> | 200 | N/A | N/A |
> | 403 | N/A | Error, invalid index |

</details>

#### Start a stream

<details>
<summary><code>POST</code> <code><b>/start_stream</b></code> <code>Starts a stream</code></summary>

##### Parameters

> | name | type | data type | description |
> |------|------|-----------|-------------|
> | `index` | required | integer | The index of the connected camera |

##### Responses

> | http code | content-type | response |
> |-----------|--------------|----------|
> | 200 | N/A | N/A |
> | 403 | N/A | Error, invalid index |

</details>

#### Stop a stream

<details>
<summary><code>POST</code> <code><b>/stop_stream</b></code> <code>Stops a stream</code></summary>

##### Parameters

> | name | type | data type | description |
> |------|------|-----------|-------------|
> | `index` | required | integer | The index of the connected camera |

##### Responses

> | http code | content-type | response |
> |-----------|--------------|----------|
> | 200 | N/A | N/A |
> | 403 | N/A | Error, invalid index |

</details>

#### Set a UVC Control

<details>
<summary><code>POST</code> <code><b>/devices/set_uvc_control</b></code> <code>Sets a UVC Control</code></summary>

##### Parameters

> | name | type | data type | description |
> |------|------|-----------|-------------|
> | `index` | required | integer | The index of the connected camera |
> | `control` | required | object | The control object |
> | `control.id` | required | integer | The control ID |
> | `control.value` | required | integer | The control value |

##### Responses

> | http code | content-type | response |
> |-----------|--------------|----------|
> | 200 | N/A | N/A |
> | 403 | N/A | Error, invalid index |

</details>

#### Set an exploreHD option

<details>
<summary><code>POST</code> <code><b>/devices/set_option</b></code> <code>Sets an exploreHD option</code></summary>

##### Parameters

> | name | type | data type | description |
> |------|------|-----------|-------------|
> | `index` | required | integer | The index of the connected camera |
> | `option` | required | string | The option ("bitrate", "gop", "mode") |
> | `value` | required | integer / string | The option value |

##### Responses

> | http code | content-type | response |
> |-----------|--------------|----------|
> | 200 | N/A | N/A |
> | 403 | N/A | Error, invalid index / Error, invalid value |
