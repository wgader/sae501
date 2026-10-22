interface PageTitleProps {
  title: string;
}

export default function PageTitle({ title }: PageTitleProps) {
  return (
    <div className="flex items-center gap-2.5">
      <span className="h-0.5 w-accent-line rounded-full bg-primary" aria-hidden="true" />
      <p className="text-meta font-bold uppercase tracking-title text-black">
        {title}
      </p>
    </div>
  );
}
