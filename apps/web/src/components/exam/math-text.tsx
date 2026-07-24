'use client';

import * as React from 'react';
import katex from 'katex';
import 'katex/dist/katex.min.css';

interface MathTextProps {
  latex?: string;
  className?: string;
  displayMode?: boolean;
}

// Renders a LaTeX string as math notation. If KaTeX throws (malformed
// LaTeX from a teacher's input), we fall back to showing the raw string
// rather than crashing the exam-taking page — a broken equation render
// is far less harmful than losing a student's exam session.
export const MathText = ({ latex, className, displayMode = false }: MathTextProps) => {
  const containerRef = React.useRef<HTMLSpanElement>(null);

  React.useEffect(() => {
    if (!latex || !containerRef.current) return;
    try {
      katex.render(latex, containerRef.current, {
        throwOnError: false,
        displayMode,
      });
    } catch {
      if (containerRef.current) containerRef.current.textContent = latex;
    }
  }, [latex, displayMode]);

  if (!latex) return null;

  return <span ref={containerRef} className={className} aria-label={`Equation: ${latex}`} />;
};
