import { Button } from "@/components/ui/button";
import { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  CameraIcon,
  Check,
  Edit2Icon,
  PlusIcon,
  Trash2Icon,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { components } from "@/schemas/dwe_os_2";

import { TOUR_STEP_IDS } from "@/lib/tour-constants";
import { useDeviceStore } from "@/store/devices";
import { usePreferencesStore } from "@/store/preferences";

const Endpoint = ({
  endpoint,
  deleteEndpoint,
  onEdit,
}: {
  endpoint: components["schemas"]["StreamEndpointModel"];
  onEdit: (endpoint: components["schemas"]["StreamEndpointModel"]) => void;
  deleteEndpoint: () => void;
}) => {
  const [isEditing, setIsEditing] = useState(false);

  const [tempHost, setTempHost] = useState(endpoint.host);
  const [tempPort, setTempPort] = useState(endpoint.port);

  return (
    <li className="flex items-start space-x-3">
      {/* ListItemIcon */}
      <div className="flex-shrink-0 text-muted-foreground pt-1">
        <CameraIcon className="w-5 h-5" />
      </div>

      {/* Content */}
      {isEditing ? (
        <div className="min-w-0 flex-1 flex items-center justify-between">
          <div className="grid grid-cols-2 gap-2 flex-1 mr-2">
            <Input
              value={tempHost}
              placeholder="IP Address"
              className="h-8"
              onChange={(e) => setTempHost(e.target.value)}
            />
            <Input
              value={tempPort}
              placeholder="Port"
              className="h-8"
              onChange={(e) => setTempPort(parseInt(e.target.value))}
            />
          </div>
          <div className="flex space-x-1 flex-shrink-0">
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={() => {
                setIsEditing(false);
                onEdit({ host: tempHost, port: tempPort });
              }}
            >
              <Check className="h-4 w-4" />
              <span className="sr-only">Save</span>
            </Button>
          </div>
        </div>
      ) : (
        <div className="min-w-0 flex-1 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">Address: {endpoint.host}</p>
            <p className="text-xs text-muted-foreground">
              Port: {endpoint.port}
            </p>
          </div>
          <div className="flex flex-shrink-0">
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={() => setIsEditing(true)}
            >
              <Edit2Icon className="h-4 w-4" />
              <span className="sr-only">Edit</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={() => deleteEndpoint()}
            >
              <Trash2Icon className="h-4 w-4" />
              <span className="sr-only">Delete</span>
            </Button>
          </div>
        </div>
      )}
    </li>
  );
};

export const EndpointList = ({ bus_id }: { bus_id: string }) => {
  const preferences = usePreferencesStore((state) => state.preferences);
  const configureStream = useDeviceStore((state) => state.configureStream);
  const stream = useDeviceStore((state) => state.devices[bus_id].stream);
  const isStreamLoading = useDeviceStore(
    (state) => state.isStreamLoading[bus_id] ?? false,
  );

  const handleDeleteEndpoint = (index: number) => {
    const endpoints = stream.endpoints.filter((_, i) => i !== index);
    configureStream(bus_id, { endpoints });
  };

  const handleUpdateEndpoint = (
    updatedEndpoint: components["schemas"]["StreamEndpointModel"],
    index: number,
  ) => {
    const endpoints = stream.endpoints.map((endpoint, i) =>
      i === index ? updatedEndpoint : endpoint,
    );
    configureStream(bus_id, { endpoints });
  };

  const handleAddEndpoint = (
    endpoint: components["schemas"]["StreamEndpointModel"],
  ) => {
    const endpoints = [...stream.endpoints, endpoint];
    configureStream(bus_id, { endpoints });
  };

  return (
    <>
      <div
        className={`relative ${isStreamLoading ? "opacity-50 pointer-events-none" : ""}`}
        id={TOUR_STEP_IDS.DEVICE_ENDPOINTS}
      >
        <Card className="overflow-hidden">
          <CardHeader className="bg-background mb-2">
            <span className="text-base -mt-2 font-xs leading-none mx-auto">
              Endpoints
            </span>
          </CardHeader>
          <CardContent>
            {/* List */}
            {stream.endpoints.length === 0 ? (
              <div className="min-w-0 flex-1 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">No endpoints added</p>
                  <p className="text-xs text-muted-foreground">
                    Press the plus icon to add an endpoint
                  </p>
                </div>
              </div>
            ) : (
              <ul className="space-y-4">
                {/* If there are endpoints.... */}
                {stream.endpoints.map((_, index) => (
                  <Endpoint
                    key={index}
                    endpoint={stream.endpoints[index]}
                    onEdit={(endpoint) => {
                      // Update
                      handleUpdateEndpoint(endpoint, index);
                    }}
                    deleteEndpoint={() => {
                      handleDeleteEndpoint(index);
                    }}
                  />
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
        <div className="absolute -bottom-3 left-1/2 transform -translate-x-1/2">
          {/* Add Button */}
          <Button
            variant="outline"
            id={TOUR_STEP_IDS.ADD_ENDPOINTS}
            className="h-8 w-8 p-0 rounded-full shadow-md bg-card flex items-center justify-center hover:bg-accent hover:text-background"
            onClick={() => {
              handleAddEndpoint({
                host: preferences?.default_stream?.host ?? "192.168.2.1",
                port: preferences?.default_stream?.port ?? 5600,
              });
            }}
          >
            <PlusIcon />
          </Button>
        </div>
      </div>
      <div className="h-0.5"></div>
    </>
  );
};
