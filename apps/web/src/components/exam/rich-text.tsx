'use client';

import * as React from 'react';
import katex from 'katex';
import 'katex/dist/katex.min.css';
import { cn } from '@/lib/utils';

// Renders plain text that may contain inline maths written between dollar
// signs, e.g. "Find $\frac{1}{2} + x$". Line breaks are kept. Only the maths
// goes through KaTeX; everything else stays as plain React text, so teacher
// input can never inject HTML.
const MATH_PATTERN = /\$\$([^$]+)\$\$|\$([^$\n]+)\$/g;

const renderMath = (latex: string, displayMode: boolean) => {
  try {
    return katex.renderToString(latex, { throwOnError: false, displayMode });
  } catch {
    return null;
  }
};

export const RichText = ({ text, className }: { text: string; className?: string }) => {
  const parts = React.useMemo(() => {
    const out: React.ReactNode[] = [];
    let last = 0;
    let key = 0;
    for (const m of text.matchAll(MATH_PATTERN)) {
      const index = m.index ?? 0;
      if (index > last) out.push(text.slice(last, index));
      const display = m[1] !== undefined;
      const html = renderMath(m[1] ?? m[2], display);
      out.push(
        html ? (
          <span key={key++} className={display ? 'block my-1' : undefined} dangerouslySetInnerHTML={{ __html: html }} />
        ) : (
          m[0]
        )
      );
      last = index + m[0].length;
    }
    if (last < text.length) out.push(text.slice(last));
    return out;
  }, [text]);

  return <span className={cn('whitespace-pre-line', className)}>{parts}</span>;
};
