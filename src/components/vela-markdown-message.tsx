import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"

type VelaMarkdownMessageProps = {
  content: string
}

export function VelaMarkdownMessage({ content }: VelaMarkdownMessageProps) {
  return (
    <div className="text-xs leading-relaxed text-foreground [&_a]:text-primary [&_a]:underline [&_blockquote]:my-2 [&_blockquote]:border-l-2 [&_blockquote]:border-primary/30 [&_blockquote]:pl-3 [&_code]:rounded [&_code]:bg-muted [&_code]:px-1 [&_code]:py-0.5 [&_code]:font-mono [&_h1]:mb-2 [&_h1]:text-base [&_h1]:font-bold [&_h2]:mb-2 [&_h2]:text-sm [&_h2]:font-bold [&_h3]:mb-1 [&_h3]:font-bold [&_li]:ml-4 [&_li]:list-disc [&_ol]:my-2 [&_p]:my-1.5 [&_pre]:my-2 [&_pre]:overflow-x-auto [&_pre]:rounded-md [&_pre]:bg-muted [&_pre]:p-2 [&_pre_code]:bg-transparent [&_pre_code]:p-0 [&_table]:my-2 [&_table]:w-full [&_td]:border [&_td]:border-border [&_td]:p-1 [&_th]:border [&_th]:border-border [&_th]:bg-muted [&_th]:p-1 [&_ul]:my-2">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
    </div>
  )
}
