import SensorCard from "./SensorCard";

interface WiredProps {
  devices: {
    info: {
      name: string;
      type: string;
    };
    value: string;
    unit: string;
  }[];
}

const Wired: React.FC<WiredProps> = (props) => {
  return (
    <div>
      {props.devices.map((device, index) => (
        <SensorCard key={index} device={device} />
      ))}
    </div>
  );
};

const wiredDevices = [
  {
    info: {
      name: "53.6%",
      type: "sensor",
    },
    value: "20",
    unit: "°C",
  },
];

export default function WiredLayout() {
  return <Wired devices={wiredDevices} />;
}
