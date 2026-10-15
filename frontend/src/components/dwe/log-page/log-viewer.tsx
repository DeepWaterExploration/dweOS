"use client";

import {
  useState,
  useEffect,
  useContext,
  useLayoutEffect,
  useRef,
} from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Search, RefreshCw, Download } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { toast } from "sonner";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import WebsocketContext from "@/contexts/WebsocketContext";
import { API_CLIENT } from "@/api";
import { components } from "@/schemas/dwe_os_2";
import { getLevelColor } from "@/lib/utils";
import { TOUR_STEP_IDS } from "@/lib/tour-constants";
import { useTour } from "@/components/tour/tour";
import {
  copyText,
  downloadFile,
  formatLogForCopy,
  getLogExportFileName,
  logsToCsv,
  splitTimestamp,
} from "@/lib/util/logs";

const DEMO_LOG: components["schemas"]["LogSchema"][] = [
  {
    timestamp: "2024-03-10 10:15:23,456",
    level: "INFO",
    name: "system.core",
    message: "System initialized successfully",
    filename: "main.py",
    lineno: 42,
    function: "init",
  },
];

/**
 * Message clamped to two lines; when that cuts it off, hovering shows the
 * whole message in a callout.
 */
const LogMessage = ({ message }: { message: string }) => {
  const ref = useRef<HTMLDivElement>(null);
  const [isTruncated, setIsTruncated] = useState(false);
  const [open, setOpen] = useState(false);

  useLayoutEffect(() => {
    const element = ref.current;
    if (!element) return;

    const check = () =>
      setIsTruncated(element.scrollHeight > element.clientHeight + 1);
    const observer = new ResizeObserver(check);
    observer.observe(element);
    check();
    return () => observer.disconnect();
  }, [message]);

  return (
    // Always rendered so the measured element stays mounted; it just never
    // opens when the message fits
    <Tooltip
      delayDuration={300}
      open={open && isTruncated}
      onOpenChange={setOpen}
    >
      <TooltipTrigger asChild>
        <div
          ref={ref}
          className="font-mono text-xs whitespace-normal break-words line-clamp-2 pr-2"
        >
          {message}
        </div>
      </TooltipTrigger>
      <TooltipContent
        side="bottom"
        align="start"
        className="max-w-xl max-h-[60vh] overflow-auto select-text bg-popover backdrop-blur-none p-3 shadow-lg"
        // React events bubble through the portal to the row, so selecting text
        // in the callout would otherwise copy the whole row
        onClick={(e) => e.stopPropagation()}
      >
        <pre className="font-mono text-xs whitespace-pre-wrap break-words">
          {message}
        </pre>
      </TooltipContent>
    </Tooltip>
  );
};

export function LogViewer() {
  const { connected, socket } = useContext(WebsocketContext)!;
  const { isActive } = useTour();

  const [logs, setLogs] = useState<components["schemas"]["LogSchema"][]>([]);
  const [filteredLogs, setFilteredLogs] = useState<
    components["schemas"]["LogSchema"][]
  >([]);
  const [levelFilter, setLevelFilter] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(10);
  // Row that was just copied, briefly highlighted as click feedback
  const [copiedRow, setCopiedRow] = useState<number | null>(null);

  // Available log levels
  const logLevels = ["ALL", "DEBUG", "INFO", "WARNING", "ERROR", "CRITICAL"];

  const updateLogs = async () => {
    setLogs((await API_CLIENT.GET("/api/logs")).data!);
  };

  useEffect(() => {
    if (connected) {
      updateLogs();

      const onLog = () => {
        updateLogs();
      };

      socket?.on("log", onLog);

      return () => {
        socket?.off("log", onLog);
      };
    } else {
      setLogs([]);
    }
  }, [connected, socket]);

  // Filter logs based on level and search query
  useEffect(() => {
    let filtered = [...logs];

    // Sort newest first
    filtered = filtered.sort((a, b) => {
      return b.timestamp.localeCompare(a.timestamp);
    });

    // Filter by level
    if (levelFilter !== "ALL") {
      filtered = filtered.filter((log) => log.level === levelFilter);
    }

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (log) =>
          log.message.toLowerCase().includes(query) ||
          log.name.toLowerCase().includes(query) ||
          log.function.toLowerCase().includes(query) ||
          log.filename.toLowerCase().includes(query),
      );
    }

    setFilteredLogs(filtered);
    setCurrentPage(1); // Reset to first page when filters change
  }, [logs, levelFilter, searchQuery]);

  // Pagination logic
  const totalPages = Math.ceil(filteredLogs.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredLogs.slice(indexOfFirstItem, indexOfLastItem);

  // Generate page numbers
  const pageNumbers = [];
  for (let i = 1; i <= totalPages; i++) {
    pageNumbers.push(i);
  }

  // Handle page changes
  const handlePageChange = (pageNumber: number) => {
    setCurrentPage(pageNumber);
    // Scroll to top of table
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Previous page
  const goToPreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  // Next page
  const goToNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const refreshLogs = () => {
    setIsLoading(true);
    updateLogs().then(() => setTimeout(() => setIsLoading(false), 500));
  };

  const displayedLogs = isActive ? DEMO_LOG : currentItems;

  const exportLogs = () => {
    if (logs.length === 0) {
      toast.info("No logs to export");
      return;
    }
    downloadFile(getLogExportFileName(), logsToCsv(logs), "text/csv");
  };

  const copyLog = async (
    log: components["schemas"]["LogSchema"],
    row: number,
  ) => {
    setCopiedRow(row);
    setTimeout(
      () => setCopiedRow((current) => (current === row ? null : current)),
      600,
    );
    if (await copyText(formatLogForCopy(log))) toast.success("Log copied");
    else toast.error("Couldn't copy the log");
  };

  return (
    <div
      className="flex flex-col h-[calc(100vh-5.5rem)] gap-4"
      id={TOUR_STEP_IDS.LOGS_PAGE}
    >
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div className="flex flex-1 items-center space-x-2">
          <Search className="h-5 w-5 text-gray-400" />
          <Input
            placeholder="Search logs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="max-w-sm"
          />
        </div>

        <div className="flex items-center space-x-2">
          <Select value={levelFilter} onValueChange={setLevelFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by level" />
            </SelectTrigger>
            <SelectContent>
              {logLevels.map((level) => (
                <SelectItem key={level} value={level}>
                  {level}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button
            variant="outline"
            size="icon"
            onClick={refreshLogs}
            disabled={isLoading}
          >
            <RefreshCw
              className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`}
            />
          </Button>

          <Button variant="outline" onClick={exportLogs}>
            <Download className="h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 flex-1 min-h-0">
        <div className="rounded-md border overflow-auto h-full">
          <Table className="table-fixed min-w-[900px]" noWrapper>
            <TableHeader className="bg-background sticky top-0 z-10">
              <TableRow>
                {/* Sized to their fixed-width contents so the gaps between them match */}
                <TableHead className="w-[96px]">Date</TableHead>
                <TableHead className="w-[112px]">Time</TableHead>
                <TableHead className="w-[104px]">Level</TableHead>
                <TableHead className="w-[220px]">Logger</TableHead>
                <TableHead className="w-[100px]">Source</TableHead>
                {/* No fixed width, so the message takes the remaining space */}
                <TableHead>Message</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {displayedLogs.length > 0 ? (
                displayedLogs.map((log, index) => {
                  const [date, time] = splitTimestamp(log.timestamp);
                  return (
                    <TableRow
                      key={index}
                      id={TOUR_STEP_IDS.DEMO_LOGS}
                      title="Click to copy"
                      className={`cursor-pointer select-none transition-colors duration-300 hover:bg-muted/50 active:bg-muted ${
                        copiedRow === index ? "bg-primary/15" : ""
                      }`}
                      onClick={() => copyLog(log, index)}
                    >
                      <TableCell className="font-mono text-xs">
                        {date}
                      </TableCell>
                      <TableCell className="font-mono text-xs">
                        {time}
                      </TableCell>
                      <TableCell>
                        <Badge
                          // Same width for every level so the column lines up
                          className={`w-20 justify-center ${getLevelColor(log.level)}`}
                        >
                          {log.level}
                        </Badge>
                      </TableCell>
                      <TableCell className="whitespace-normal break-words">
                        {log.name}
                      </TableCell>
                      <TableCell>
                        <div className="text-xs">
                          <div className="break-words max-w-[150px]">
                            {log.filename}:{log.lineno}
                          </div>
                          <div className="text-gray-500 break-words max-w-[150px]">
                            {log.function}()
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <LogMessage message={log.message} />
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center">
                    No logs found matching your filters.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
      <div className="flex items-center justify-between border-t pt-4">
        <div className="flex items-center space-x-2 text-sm text-muted-foreground">
          <span>Rows per page:</span>
          <Select
            value={itemsPerPage.toString()}
            onValueChange={(value) => {
              setItemsPerPage(Number.parseInt(value));
              setCurrentPage(1); // Reset to first page when changing items per page
            }}
          >
            <SelectTrigger className="h-8 w-[70px]">
              <SelectValue placeholder={itemsPerPage.toString()} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="5">5</SelectItem>
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="20">20</SelectItem>
              <SelectItem value="50">50</SelectItem>
            </SelectContent>
          </Select>
          <span>
            {indexOfFirstItem + 1}-
            {Math.min(indexOfLastItem, filteredLogs.length)} of{" "}
            {filteredLogs.length}
          </span>
        </div>
      </div>
      {filteredLogs.length > itemsPerPage && (
        <div className="flex items-center justify-center py-4">
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  onClick={goToPreviousPage}
                  className={
                    currentPage === 1
                      ? "pointer-events-none opacity-50"
                      : "cursor-pointer"
                  }
                />
              </PaginationItem>

              {pageNumbers.map((number) => {
                if (
                  number === 1 ||
                  number === totalPages ||
                  (number >= currentPage - 1 && number <= currentPage + 1)
                ) {
                  return (
                    <PaginationItem key={number}>
                      <PaginationLink
                        isActive={number === currentPage}
                        onClick={() => handlePageChange(number)}
                      >
                        {number}
                      </PaginationLink>
                    </PaginationItem>
                  );
                } else if (
                  number === currentPage - 2 ||
                  number === currentPage + 2
                ) {
                  return (
                    <PaginationItem key={number}>
                      <PaginationEllipsis />
                    </PaginationItem>
                  );
                }
                return null;
              })}

              <PaginationItem>
                <PaginationNext
                  onClick={goToNextPage}
                  className={
                    currentPage === totalPages
                      ? "pointer-events-none opacity-50"
                      : "cursor-pointer"
                  }
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}
    </div>
  );
}
