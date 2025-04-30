import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Clock, File, User, Code } from "lucide-react";
import { components } from "@/schemas/dwe_os_2";
import { getLevelColor } from "@/lib/utils";

export function LogDetailView({
  log,
  open,
  onOpenChange,
}: {
  log: components["schemas"]["LogSchema"] | undefined;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  if (!log) return null;

  // Format timestamp for better readability
  const formatTimestamp = (timestamp: string) => {
    try {
      const date = new Date(timestamp.replace(",", "."));
      return date.toLocaleString();
    } catch (e) {
      return timestamp;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 leading-relaxed">
            <Badge className={getLevelColor(log.level)}>{log.level}</Badge>
            <span className="truncate">{log.name}</span>
          </DialogTitle>
          <DialogDescription className="flex items-center gap-1">
            <Clock className="h-3 w-3" /> {formatTimestamp(log.timestamp)}
          </DialogDescription>
        </DialogHeader>

        <Tabs
          defaultValue="message"
          className="flex-1 overflow-hidden flex flex-col"
        >
          <div className="border-b border-transparent">
            <TabsList className="grid w-full grid-cols-2 ">
              <TabsTrigger value="message">Message</TabsTrigger>
              <TabsTrigger value="details">Details</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent
            value="message"
            className="flex-1 overflow-hidden flex flex-col mt-0 pt-4"
          >
            <ScrollArea className="flex-1 rounded-md border">
              <pre className="p-4 font-mono text-sm whitespace-pre-wrap break-words">
                {log.message}
              </pre>
            </ScrollArea>
          </TabsContent>

          <TabsContent
            value="details"
            className="flex-1 overflow-auto mt-0 pt-4"
          >
            <Card>
              <CardContent className="p-4 space-y-4">
                <div className="grid grid-cols-[100px_1fr] gap-2">
                  <div className="font-medium text-muted-foreground">
                    Level:
                  </div>
                  <div>
                    <Badge className={getLevelColor(log.level)}>
                      {log.level}
                    </Badge>
                  </div>
                </div>

                <div className="grid grid-cols-[100px_1fr] gap-2">
                  <div className="font-medium text-muted-foreground">
                    Logger:
                  </div>
                  <div className="font-mono flex items-center gap-1">
                    <User className="h-4 w-4 text-muted-foreground" />
                    {log.name}
                  </div>
                </div>

                <div className="grid grid-cols-[100px_1fr] gap-2">
                  <div className="font-medium text-muted-foreground">File:</div>
                  <div className="font-mono flex items-center gap-1">
                    <File className="h-4 w-4 text-muted-foreground" />
                    {log.filename}:{log.lineno}
                  </div>
                </div>

                <div className="grid grid-cols-[100px_1fr] gap-2">
                  <div className="font-medium text-muted-foreground">
                    Function:
                  </div>
                  <div className="font-mono flex items-center gap-1">
                    <Code className="h-4 w-4 text-muted-foreground" />
                    {log.function}()
                  </div>
                </div>

                <div className="grid grid-cols-[100px_1fr] gap-2">
                  <div className="font-medium text-muted-foreground">
                    Timestamp:
                  </div>
                  <div className="font-mono flex items-center gap-1">
                    {log.timestamp}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
