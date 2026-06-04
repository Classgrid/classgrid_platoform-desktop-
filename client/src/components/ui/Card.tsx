import type { PropsWithChildren } from "react";

type CardProps = PropsWithChildren<{
  title: string;
}>;

export function Card({ title, children }: CardProps) {
  return (
    <article className="ui-card">
      <h3 className="ui-card__title">{title}</h3>
      <div>{children}</div>
    </article>
  );
}
