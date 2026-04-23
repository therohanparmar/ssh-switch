import { PropsWithChildren } from "react";
import clsx from "clsx";

type SectionCardProps = PropsWithChildren<{
  title: string;
  eyebrow?: string;
  className?: string;
}>;

export const SectionCard = ({
  title,
  eyebrow,
  className,
  children
}: SectionCardProps) => (
  <section
    className={clsx(
      "panel p-6 md:p-7",
      className
    )}
  >
    <div className="mb-5">
      {eyebrow ? (
        <p className="section-eyebrow mb-2">{eyebrow}</p>
      ) : null}
      <h2 className="section-title">{title}</h2>
    </div>
    {children}
  </section>
);
