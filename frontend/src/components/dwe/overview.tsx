// pages/index.tsx
import changelog from "../../../../CHANGELOG.md?raw";
import { Markdown } from "./markdown";

// Drop the changelog's own title and nest its headings under "## Changelog"
const changelogBody = changelog
  .replace(/^# Changelog\s*/, "")
  .replace(/^(#{1,5}) /gm, "#$1 ");

const markdown = `
# dweOS Overview

dweOS is an optional software designed to run on underwater systems, extending the functionality of DeepWater Exploration cameras.

For more detailed documentation, refer to the official project docs at [docs.dwe.ai](https://docs.dwe.ai/dwe-os/overview).

## Changelog

${changelogBody}
`;

export default function OverviewMarkdown() {
  return <Markdown>{markdown}</Markdown>;
}
