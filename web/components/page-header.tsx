import { Eyebrow } from "@/components/ui";

export function PageHeader({
  eyebrow,
  title,
  subtitle,
  action,
}: {
  eyebrow: string;
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="reveal mb-7 flex flex-wrap items-end justify-between gap-4">
      <div className="space-y-2">
        <Eyebrow>{eyebrow}</Eyebrow>
        <h1 className="text-[28px] leading-none text-ink">{title}</h1>
        {subtitle && <p className="max-w-xl text-[14px] text-muted">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}
