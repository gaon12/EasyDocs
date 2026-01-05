"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import { useState, useEffect } from "react";
import Link from "next/link";

type DocRendererProps = {
  content: string;
  isDark?: boolean;
};

/**
 * Markdown documentation renderer with syntax highlighting
 */
export function DocRenderer({ content, isDark = false }: DocRendererProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className={`animate-pulse rounded-xl p-8 ${isDark ? "bg-slate-800" : "bg-slate-50"}`}>
        <div className={`h-4 rounded ${isDark ? "bg-slate-700" : "bg-slate-200"}`} />
        <div className={`mt-4 h-4 w-3/4 rounded ${isDark ? "bg-slate-700" : "bg-slate-200"}`} />
      </div>
    );
  }

  return (
    <div className={`doc-content ${isDark ? "dark" : ""}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeHighlight]}
        components={{
          // Headings
          h1: ({ node, children, ...props }) => (
            <h1 className="mb-6 mt-8 text-3xl font-bold text-slate-900 first:mt-0" {...props}>
              {children}
            </h1>
          ),
          h2: ({ node, children, ...props }) => (
            <h2 className="mb-4 mt-8 text-2xl font-bold text-slate-900" {...props}>
              {children}
            </h2>
          ),
          h3: ({ node, children, ...props }) => (
            <h3 className="mb-3 mt-6 text-xl font-semibold text-slate-900" {...props}>
              {children}
            </h3>
          ),
          h4: ({ node, children, ...props }) => (
            <h4 className="mb-2 mt-4 text-lg font-semibold text-slate-900" {...props}>
              {children}
            </h4>
          ),
          // Paragraphs
          p: ({ node, children, ...props }) => (
            <p className="mb-4 text-sm leading-7 text-slate-600" {...props}>
              {children}
            </p>
          ),
          // Links
          a: ({ node, href, children, ...props }) => {
            if (href?.startsWith("/")) {
              return (
                <Link href={href} className="font-semibold text-emerald-600 hover:text-emerald-700 hover:underline" {...props}>
                  {children}
                </Link>
              );
            }
            return (
              <a href={href} target="_blank" rel="noopener noreferrer" className="font-semibold text-emerald-600 hover:text-emerald-700 hover:underline" {...props}>
                {children}
              </a>
            );
          },
          // Lists
          ul: ({ node, children, ...props }) => (
            <ul className="mb-4 ml-6 list-disc space-y-2 text-sm text-slate-600" {...props}>
              {children}
            </ul>
          ),
          ol: ({ node, children, ...props }) => (
            <ol className="mb-4 ml-6 list-decimal space-y-2 text-sm text-slate-600" {...props}>
              {children}
            </ol>
          ),
          li: ({ node, children, ...props }) => (
            <li className="leading-7" {...props}>
              {children}
            </li>
          ),
          // Code
          code: ({ className, children, ...props }: any) => {
            const match = /language-(\w+)/.exec(className || '');
            const isCodeBlock = match;
            if (!isCodeBlock) {
              return (
                <code className="rounded bg-emerald-50 px-1.5 py-0.5 text-xs font-semibold text-emerald-700" {...props}>
                  {children}
                </code>
              );
            }
            return (
              <code className={`${className} block overflow-x-auto rounded-lg bg-slate-900 p-4 text-xs text-slate-100`} {...props}>
                {children}
              </code>
            );
          },
          pre: ({ node, children, ...props }) => (
            <pre className="mb-4 overflow-x-auto rounded-lg bg-slate-900" {...props}>
              {children}
            </pre>
          ),
          // Blockquotes
          blockquote: ({ node, children, ...props }) => (
            <blockquote className="mb-4 border-l-4 border-emerald-500 pl-4 italic text-slate-600" {...props}>
              {children}
            </blockquote>
          ),
          // Tables
          table: ({ node, children, ...props }) => (
            <div className="mb-4 overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200 text-sm" {...props}>
                {children}
              </table>
            </div>
          ),
          thead: ({ node, children, ...props }) => (
            <thead className="bg-slate-50" {...props}>
              {children}
            </thead>
          ),
          tbody: ({ node, children, ...props }) => (
            <tbody className="divide-y divide-slate-200 bg-white" {...props}>
              {children}
            </tbody>
          ),
          tr: ({ node, children, ...props }) => (
            <tr {...props}>
              {children}
            </tr>
          ),
          th: ({ node, children, ...props }) => (
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-700" {...props}>
              {children}
            </th>
          ),
          td: ({ node, children, ...props }) => (
            <td className="px-4 py-3 text-slate-600" {...props}>
              {children}
            </td>
          ),
          // Horizontal rule
          hr: ({ node, ...props }) => (
            <hr className="my-8 border-slate-200" {...props} />
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
