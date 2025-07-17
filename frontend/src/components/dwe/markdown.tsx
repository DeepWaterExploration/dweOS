// components/Markdown.tsx
import ReactMarkdown, { Components } from "react-markdown";

const components: Components = {
  h1: ({ ...props }) => (
    <h2 className="text-2xl font-semibold tracking-tight" {...props} />
  ),
  h2: ({ ...props }) => (
    <h3 className="text-lg font-semibold mt-4" {...props} />
  ),
  p: ({ ...props }) => <p className="text-muted-foreground" {...props} />,
  li: ({ ...props }) => <li className="mb-1 pl-1" {...props} />,
  a: ({ ...props }) => (
    <a
      className="text-blue-500 hover:underline"
      target="_blank"
      rel="noopener noreferrer"
      {...props}
    />
  ),
  ul: ({ ...props }) => <ul className="list-disc pl-6 space-y-2" {...props} />,
  hr: () => <hr className="my-4 border-muted" />,
};

type MarkdownProps = { children: string };

export function Markdown({ children }: MarkdownProps) {
  return (
    <div className="p-6 bg-background shadow-sm space-y-6 text-sm leading-6 text-foreground">
      <ReactMarkdown components={components}>{children}</ReactMarkdown>
    </div>
  );
}
