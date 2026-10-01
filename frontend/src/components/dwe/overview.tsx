// pages/index.tsx
import changelog from "../../../../CHANGELOG.md?raw";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Markdown } from "./markdown";

// Drop the changelog's own title and split it into one entry per release
const releases = changelog
  .replace(/^# Changelog\s*/, "")
  .split(/^(?=## )/m)
  .filter((release) => release.trim());

// Nest a release's headings under "## Changelog"
const nestHeadings = (markdown: string) =>
  markdown.replace(/^(#{1,5}) /gm, "#$1 ");

const currentRelease = nestHeadings(releases[0] ?? "");
const previousReleases = nestHeadings(releases.slice(1).join("\n"));

const markdown = `
# dweOS Overview

dweOS is an optional software designed to run on underwater systems, extending the functionality of DeepWater Exploration cameras.

For more detailed documentation, refer to the official project docs at [docs.dwe.ai](https://docs.dwe.ai/dwe-os/overview).

---

## Changelog

${currentRelease}
`;

export default function OverviewMarkdown() {
  return (
    <div className="space-y-6">
      <Markdown>{markdown}</Markdown>
      {previousReleases && (
        <Accordion type="single" collapsible>
          <AccordionItem value="previous-releases">
            <AccordionTrigger className="font-semibold">
              Previous releases
            </AccordionTrigger>
            <AccordionContent>
              <Markdown>{previousReleases}</Markdown>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      )}
    </div>
  );
}
