import * as React from "react"
import {
  Dialog,
  DialogContent,
  DialogClose,
  DialogTrigger,
} from "@/components/ui/dialog"
import { cn } from "@/lib/utils"

interface BizDialogProps {
  /** 非受控模式：传入触发按钮，BizDialog 内部管理开关状态 */
  trigger?: React.ReactNode
  /** 受控模式：外部控制开关 */
  open?: boolean
  /** 受控模式：状态回调 */
  onOpenChange?: (open: boolean) => void
  title: React.ReactNode
  children: React.ReactNode
  footer?: React.ReactNode
  /** 自定义宽度，默认 "sm:max-w-[660px]"（对照原型 match-modal 660px） */
  width?: string
  className?: string
}

export function BizDialog({
  trigger,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
  title,
  children,
  footer,
  width = "sm:max-w-[660px]",
  className,
}: BizDialogProps) {
  const [internalOpen, setInternalOpen] = React.useState(false)

  const isControlled = controlledOpen !== undefined
  const open = isControlled ? controlledOpen : internalOpen
  const onOpenChange = isControlled ? controlledOnOpenChange! : setInternalOpen

  const content = (
    <DialogContent
      showCloseButton={false}
      className={cn(
        "gap-0 p-0 ring-0 shadow-[0_18px_48px_rgba(15,23,42,0.22)]",
        width,
        className
      )}
    >
      <div className="flex items-center justify-between border-b border-border px-5 py-4">
        <h2 className="text-[17px] font-extrabold text-foreground">
          {title}
        </h2>
        <DialogClose className="cursor-pointer border-none bg-transparent p-0 text-[22px] leading-none text-muted-foreground outline-0 hover:text-foreground/70 focus-visible:outline-0 focus-visible:ring-0 [&:focus-visible]:[outline-style:none]">
          ×
        </DialogClose>
      </div>

      <div className="px-5 py-5">{children}</div>

      {footer && (
        <div className="flex justify-end px-5 pb-5">{footer}</div>
      )}
    </DialogContent>
  )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {trigger && (
        <DialogTrigger render={trigger as React.ReactElement} />
      )}
      {content}
    </Dialog>
  )
}