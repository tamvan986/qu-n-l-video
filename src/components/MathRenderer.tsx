import React, { useMemo } from 'react';
import katex from 'katex';

interface MathRendererProps {
  text?: string | null;
  className?: string;
  inline?: boolean;
}

export const MathRenderer: React.FC<MathRendererProps> = ({ text, className = '', inline = false }) => {
  if (!text) return null;

  // Render tokens: text and math blocks
  const parts = useMemo(() => {
    // Regex splits by $$...$$ (display math) or $...$ (inline math)
    // Avoid splitting escaped dollars or currency like 50$
    const mathRegex = /(\$\$[\s\S]+?\$\$|\$[^\$\n]+?\$)/g;
    const tokens: Array<{ type: 'text' | 'inline-math' | 'display-math'; content: string }> = [];

    let lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = mathRegex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        tokens.push({
          type: 'text',
          content: text.slice(lastIndex, match.index),
        });
      }

      const raw = match[0];
      if (raw.startsWith('$$') && raw.endsWith('$$')) {
        tokens.push({
          type: 'display-math',
          content: raw.slice(2, -2).trim(),
        });
      } else if (raw.startsWith('$') && raw.endsWith('$')) {
        tokens.push({
          type: 'inline-math',
          content: raw.slice(1, -1).trim(),
        });
      }

      lastIndex = match.index + raw.length;
    }

    if (lastIndex < text.length) {
      tokens.push({
        type: 'text',
        content: text.slice(lastIndex),
      });
    }

    return tokens;
  }, [text]);

  const renderKatex = (latex: string, isDisplay: boolean) => {
    try {
      const html = katex.renderToString(latex, {
        displayMode: isDisplay,
        throwOnError: false,
        output: 'htmlAndMathml',
      });
      return <span dangerouslySetInnerHTML={{ __html: html }} />;
    } catch {
      return <span className="font-mono text-amber-700 bg-amber-50 px-1 rounded">{latex}</span>;
    }
  };

  const Component = inline ? 'span' : 'div';

  return (
    <Component className={`leading-relaxed ${className}`}>
      {parts.map((part, idx) => {
        if (part.type === 'text') {
          return <span key={idx}>{part.content}</span>;
        }
        if (part.type === 'display-math') {
          return (
            <div key={idx} className="my-2 py-1 overflow-x-auto text-center">
              {renderKatex(part.content, true)}
            </div>
          );
        }
        return <span key={idx} className="mx-0.5 inline-block">{renderKatex(part.content, false)}</span>;
      })}
    </Component>
  );
};
