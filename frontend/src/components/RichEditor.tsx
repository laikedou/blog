'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { deserializeHtml, htmlStringToDOMNode, createSlateEditor, type Descendant } from 'platejs';
import { Plate, usePlateEditor } from 'platejs/react';
import { serializeMd } from '@platejs/markdown';
import { EditorKit } from '@/components/editor/editor-kit';
import { Editor, EditorContainer } from '@/components/ui/editor';
import { cn } from '@/lib/utils';
import { markdownJoinerTransform } from '@/lib/markdown-joiner-transform';

interface RichEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
}

type MarkdownTransformChunk =
  | { id: 'markdown'; text: string; type: 'text-delta' }
  | { id: 'end'; type: 'text-end' };

function deserializeInitialValue(html: string): Descendant[] | undefined {
  if (!html || html === '<p></p>' || html === '<p><br></p>') return undefined;

  try {
    const domNode = htmlStringToDOMNode(html);
    const tempEditor = createSlateEditor({ plugins: EditorKit });
    const value = deserializeHtml(tempEditor, { element: domNode as HTMLElement });
    return value?.length > 0 ? (value as Descendant[]) : undefined;
  } catch {
    return undefined;
  }
}

function RichEditorInner({
  value,
  onChange,
  placeholder = 'Write your content here...',
}: RichEditorProps) {
  const initialValue: Descendant[] = useMemo(() => {
    return value
      ? deserializeInitialValue(value) ?? [{ type: 'paragraph', children: [{ text: '' }] }]
      : [{ type: 'paragraph', children: [{ text: '' }] }];
  }, [value]);

  const editor = usePlateEditor({
    plugins: EditorKit,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    value: initialValue as any,
  });

  const onChangeRef = useRef(onChange);
  const readyRef = useRef(false);

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    const id = requestAnimationFrame(() => { readyRef.current = true; });
    return () => cancelAnimationFrame(id);
  }, []);

  const handleChange = useCallback(() => {
    if (!readyRef.current) return;
    const markdown = serializeMd(editor, { value: editor.children });
    const transformStream = new ReadableStream<MarkdownTransformChunk>({
      start(controller) {
        controller.enqueue({ id: 'markdown', text: markdown, type: 'text-delta' });
        controller.enqueue({ id: 'end', type: 'text-end' });
        controller.close();
      },
    }).pipeThrough(markdownJoinerTransform()() as unknown as ReadableWritablePair<MarkdownTransformChunk, MarkdownTransformChunk>);
    const reader = transformStream.getReader();
    const read = () => {
      reader.read().then(({ done, value }) => {
        if (done) return;
        if (value.type === 'text-delta') {
          onChangeRef.current(value.text);
        }
        read();
      });
    };
    read();
  }, [editor]);

  return (
    <Plate editor={editor} onChange={handleChange}>
      <div className={cn('border border-border rounded-lg overflow-hidden bg-surface-container')}>
        <EditorContainer className="min-h-[420px]">
          <Editor variant="fullWidth" placeholder={placeholder} className="min-h-[420px]" />
        </EditorContainer>
      </div>
    </Plate>
  );
}

export default function RichEditor({ value, onChange, placeholder }: RichEditorProps) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    const id = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(id);
  }, []);

  if (!mounted) {
    return (
      <div className="border border-border rounded-lg">
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full min-h-[420px] p-4 font-mono text-sm outline-none resize-y bg-surface-container text-on-surface"
          rows={16}
        />
      </div>
    );
  }

  return <RichEditorInner value={value} onChange={onChange} placeholder={placeholder} />;
}
