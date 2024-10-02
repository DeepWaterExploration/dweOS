export interface Log {
    timestamp: string;
    level: string;
    name: string;
    filename: string;
    lineno: number;
    function: string;
    message: string;
}
