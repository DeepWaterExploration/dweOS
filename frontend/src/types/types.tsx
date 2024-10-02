/**
 * Message from websocket server
 */
export interface Message {
    event_name: string;
    data: object;
}

/**
 * Represents a route in a navigation system.
 */
export interface RouteItem {
    /* The path for the route */
    route: string;
    /* The component rendered when the route is matched */
    component: React.ReactNode;
    /* (Optional) Whether matches to the route should be exact */
    exact?: boolean;
    /* The icon associated with this route */
    icon: React.ReactElement;
    /* The category the route belongs to */
    category: string;
    /* The type of route */
    type: routeType;
    /* A descriptive name for the route, used for display purposes */
    name: string;
    /* A unique key to identify the route, used when rendering dynamic routes */
    key: string;
    /* Whether the route is the default route */
    default: boolean;
}

/**
 * Represents the types of routes used in the navigation system
 */
export enum routeType {
    /* Collapsible group of routes */
    COLLAPSE = "collapse",
    /* A single route item */
    ITEM = "item",
}
