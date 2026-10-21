import * as React from 'react';

export const StaticPage = ({
  title,
  intro,
  children,
}: {
  title: string;
  intro?: string;
  children: React.ReactNode;
}) => (
  <div className="container max-w-3xl py-14">
    <h1 className="font-display text-3xl font-bold md:text-4xl">{title}</h1>
    {intro && <p className="mt-4 text-lg text-muted-foreground">{intro}</p>}
    <div className="mt-8 space-y-4 leading-relaxed text-foreground/90 [&_h2]:mt-8 [&_h2]:font-display [&_h2]:text-xl [&_h2]:font-semibold [&_a]:text-brand-500 [&_a]:underline [&_ul]:ml-5 [&_ul]:list-disc [&_ul]:space-y-1">
      {children}
    </div>
  </div>
);
