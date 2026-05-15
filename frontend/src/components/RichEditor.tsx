'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import '@wangeditor-next/editor/dist/css/style.css';
import SelectionAIToolbar from './SelectionAIToolbar';
import ImageActionsDialog from './ImageActionsDialog';
import { SlateTransforms, SlateEditor } from '@wangeditor-next/editor';

interface RichEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
}

let EditorComp: any = null;
let ToolbarComp: any = null;

export default function RichEditor({ value, onChange, placeholder = 'Write your content here...' }: RichEditorProps) {
  const [editor, setEditor] = useState<any>(null);
  const [ready, setReady] = useState(!!EditorComp);
  const onChangeRef = useRef(onChange);
  const prevValueRef = useRef(value);
  const containerRef = useRef<HTMLDivElement>(null);
  const [editorContainer, setEditorContainer] = useState<HTMLElement | null>(null);
  const [selectedImageUrl, setSelectedImageUrl] = useState<string | null>(null);
  onChangeRef.current = onChange;

  useEffect(() => {
    if (EditorComp) { setReady(true); return; }
    Promise.all([
      import('@wangeditor-next/editor'),
      import('@wangeditor-next/editor-for-react'),
    ]).then(([core, react]) => {
      EditorComp = react.Editor;
      ToolbarComp = react.Toolbar;
      setReady(true);
    });
  }, []);

  // Sync external value changes into editor
  useEffect(() => {
    if (editor && value !== prevValueRef.current) {
      prevValueRef.current = value;
      try { editor.setHtml(value || ''); } catch {}
    }
  }, [value, editor]);

  // Find the editor's contenteditable container for selection detection
  useEffect(() => {
    if (!containerRef.current) return;
    const el = containerRef.current.querySelector('[contenteditable]');
    setEditorContainer(el as HTMLElement | null);
  }, [ready, editor]);

  const handleChange = useCallback((ed: any) => {
    const html = ed.getHtml();
    prevValueRef.current = html;
    onChangeRef.current(html);
  }, []);

  const toolbarConfig: any = {
    excludeKeys: ['fullScreen', 'group-video', 'insertVideo', 'uploadVideo', 'video'],
  };
  const editorConfig: any = {
    placeholder,
    MENU_CONF: {},
    onChange: handleChange,
  };

  if (!ready) {
    return (
      <div className="border border-gray-200 rounded-lg">
        <textarea
          value={value}
          onChange={e => {
            prevValueRef.current = e.target.value;
            onChange(e.target.value);
          }}
          placeholder={placeholder}
          className="w-full min-h-[420px] p-4 font-mono text-sm outline-none resize-y"
          rows={16}
        />
      </div>
    );
  }

  return (
    <div ref={containerRef} className="border border-gray-200 rounded-lg overflow-hidden bg-white">
      <div style={{ borderBottom: '1px solid #e8e8e8' }}>
        <ToolbarComp editor={editor} defaultConfig={toolbarConfig} mode="default" />
      </div>
      <div style={{ minHeight: '420px' }}>
        <EditorComp
          defaultConfig={editorConfig}
          value={value || ''}
          onCreated={setEditor}
          mode="default"
          style={{ minHeight: '420px', padding: '0 8px' }}
        />
      </div>

      {/* Selection-aware AI toolbar */}
      {editor && (
        <SelectionAIToolbar
          editor={editor}
          editorContainer={editorContainer}
          onImageAction={(src) => setSelectedImageUrl(src)}
        />
      )}

      {/* Image actions dialog */}
      {selectedImageUrl && (
        <ImageActionsDialog
          open={!!selectedImageUrl}
          onOpenChange={(open) => { if (!open) setSelectedImageUrl(null); }}
          imageUrl={selectedImageUrl}
          onReplace={(newUrl) => {
            // Find the image in the Slate model by matching src (handle
            // both relative and absolute URLs)
            const getPath = (u: string) => {
              try { return new URL(u, window.location.origin).pathname; }
              catch { return u; }
            };
            const oldPath = getPath(selectedImageUrl);
            const nodes: Array<[any, any]> = Array.from(
              (SlateEditor as any).nodes(editor, {
                at: [],
                match: (n: any) => n.type === 'image',
              })
            );
            for (let i = 0; i < nodes.length; i++) {
              const [node, path] = nodes[i];
              if (getPath(node.src || '') === oldPath) {
                SlateTransforms.setNodes(editor, { src: newUrl } as any, { at: path });
                break;
              }
            }
            setSelectedImageUrl(null);
          }}
        />
      )}
    </div>
  );
}
