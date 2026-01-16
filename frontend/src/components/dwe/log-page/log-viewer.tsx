"use client";

import { useState, useEffect, useContext, useMemo } from "react";
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
import { Search, RefreshCw } from "lucide-react";
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
import { LogDetailView } from "./log-detail-view";
import { getLevelColor } from "@/lib/utils";
import { TOUR_STEP_IDS } from "@/lib/tour-constants";
import { useTour } from "@/components/tour/tour";

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
  const [selectedLog, setSelectedLog] = useState<
    components["schemas"]["LogSchema"] | undefined
  >(undefined);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  // Available log levels
  const logLevels = ["ALL", "DEBUG", "INFO", "WARNING", "ERROR", "CRITICAL"];

  const updateLogs = async () => {
    setLogs((await API_CLIENT.GET("/logs")).data!);
  };

  useEffect(() => {
    if (connected) {
      updateLogs();

      socket?.on("log", () => updateLogs());

      return () => {
        socket?.off("log");
      };
    } else {
      setLogs([]);
    }
  }, [connected]);

  // Format timestamp for better readability
  const formatTimestamp = (timestamp: string) => {
    try {
      const date = new Date(timestamp.replace(",", "."));
      return date.toLocaleString();
    } catch (e) {
      return timestamp; // Return original if parsing fails
    }
  };

  // Filter logs based on level and search query
  useEffect(() => {
    let filtered = [...logs];

    // Sort newest first
    filtered = filtered.sort((a, b) => {
      const dateA = new Date(a.timestamp.replace(",", ".")).getTime();
      const dateB = new Date(b.timestamp.replace(",", ".")).getTime();
      return dateB - dateA; // newest first
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
          log.filename.toLowerCase().includes(query)
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
        </div>
      </div>

      <div className="grid grid-cols-1 flex-1 min-h-0">
        <div className="rounded-md border overflow-auto h-full">
          <Table className="table-fixed min-w-[900px]" noWrapper>
            <TableHeader className="bg-background sticky top-0 z-10">
              <TableRow>
                <TableHead className="w-[100px]">Timestamp</TableHead>
                <TableHead className="w-[90px]">Level</TableHead>
                <TableHead className="w-[120px]">Logger</TableHead>
                <TableHead className="w-[120px]">Source</TableHead>
                <TableHead className="w-[250px]">Message</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {displayedLogs.length > 0 ? (
                displayedLogs.map((log, index) => (
                  <TableRow
                    key={index}
                    id={TOUR_STEP_IDS.DEMO_LOGS}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => {
                      setSelectedLog(log);
                      setIsDetailOpen(true);
                    }}
                  >
                    <TableCell className="font-mono text-xs">
                      {formatTimestamp(log.timestamp)}
                    </TableCell>
                    <TableCell>
                      <Badge className={getLevelColor(log.level)}>
                        {log.level}
                      </Badge>
                    </TableCell>
                    <TableCell
                      className="whitespace-normal break-words max-w-[150px]"
                      title={log.name}
                    >
                      {log.name}
                    </TableCell>
                    <TableCell>
                      <div className="text-xs">
                        <div
                          className="break-words max-w-[150px]"
                          title={log.filename}
                        >
                          {log.filename}:{log.lineno}
                        </div>
                        <div
                          className="text-gray-500 break-words max-w-[150px]"
                          title={log.function}
                        >
                          {log.function}()
                        </div>
                      </div>
                    </TableCell>
                    <TableCell title={log.message}>
                      <div className="font-mono text-xs whitespace-normal break-words line-clamp-2 pr-2">
                        {log.message}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center">
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

      {/* Log Detail Dialog */}
      <LogDetailView
        log={selectedLog}
        open={isDetailOpen}
        onOpenChange={setIsDetailOpen}
      />
    </div>
  );
}
