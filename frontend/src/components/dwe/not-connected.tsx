import { Markdown } from "./markdown";

const markdown = `
# Connection Lost
## Please make sure DWE OS is accesible by this device.

### Potential Issues:
- **Network Setup:** Your network setup may have lost connection.
- **DWE OS Status:** Ensure that DWE OS is running and accessible.

For more information, please refer to the [DWE OS documentation](https://docs.dwe.ai/software/dwe-os/dwe-os-2).
`;

const NotConnected = () => {
  return (
    <Markdown>{markdown}</Markdown>
  );
};

export default NotConnected;
