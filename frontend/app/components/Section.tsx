interface SectionProps {
  title: string;
  children: React.ReactNode;
  className?: string;
  titleClassName?: string;
}

export function Section({ title, children, className = "", titleClassName = "" }: SectionProps) {
  return (
    <section className={className}>
      <h2 className={`text-2xl font-semibold mb-4 text-gray-800 dark:text-gray-200 ${titleClassName}`}>
        {title}
      </h2>
      {children}
    </section>
  );
}
