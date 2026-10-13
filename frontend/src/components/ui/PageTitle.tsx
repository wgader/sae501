interface PageTitleProps {
  title: string;
}

export default function PageTitle({ title }: PageTitleProps) {
  return (
    <div className="flex items-center gap-[10px]">
      <span className="h-[3px] w-[30px] rounded-full bg-[#146E67]" aria-hidden="true" />
      <p className="text-[13px] font-bold uppercase tracking-[2px] text-black">
        {title}
      </p>
    </div>
  );
}
