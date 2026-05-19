import React from 'react';

export const markdownComponents: Record<string, React.FC<any>> = {
  h1: () => null, // disallow
  h2: () => null, // disallow
  h3: (props) => <h3 className="text-body font-semibold text-on-surface mt-3 mb-1" {...props} />,
  h4: (props) => <h4 className="text-body-sm font-semibold text-on-surface mt-2 mb-1" {...props} />,
  p: (props) => <p className="text-body text-on-surface/90 mb-2 last:mb-0" {...props} />,
  a: (props) => <a className="text-primary underline hover:opacity-80" target="_blank" rel="noopener noreferrer" {...props} />,
  ul: (props) => <ul className="list-disc list-inside mb-2 space-y-1" {...props} />,
  ol: (props) => <ol className="list-decimal list-inside mb-2 space-y-1" {...props} />,
  li: (props) => <li className="text-body text-on-surface/90" {...props} />,
  blockquote: (props) => <blockquote className="border-l-2 border-primary/30 pl-3 my-2 text-on-surface-variant italic" {...props} />,
  code: ({ className, children, ...props }: any) => {
    const isInline = !className;
    if (isInline) {
      return <code className="bg-surface-container-high/80 text-primary px-1.5 py-0.5 rounded text-[13px] font-mono" {...props}>{children}</code>;
    }
    return <code className="block bg-surface-container-high/80 text-on-surface p-3 rounded-lg text-[13px] font-mono overflow-x-auto my-2" {...props}>{children}</code>;
  },
  pre: (props) => <pre className="bg-surface-container-high/80 rounded-lg overflow-x-auto my-2 p-0" {...props} />,
  strong: (props) => <strong className="font-semibold text-on-surface" {...props} />,
  em: (props) => <em className="italic text-on-surface/90" {...props} />,
  del: (props) => <del className="line-through text-on-surface-variant/70" {...props} />,
  hr: () => <hr className="my-3 border-border" />,
  table: (props) => <div className="overflow-x-auto my-2"><table className="min-w-full text-body-sm border-collapse" {...props} /></div>,
  thead: (props) => <thead className="border-b border-border" {...props} />,
  tbody: (props) => <tbody {...props} />,
  tr: (props) => <tr className="border-b border-border/50" {...props} />,
  th: (props) => <th className="px-3 py-2 text-left font-semibold text-on-surface" {...props} />,
  td: (props) => <td className="px-3 py-2 text-on-surface/90" {...props} />,
  img: () => null, // disallow images in comments
};
