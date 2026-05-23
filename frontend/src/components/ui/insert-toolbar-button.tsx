'use client';

import * as React from 'react';
import { useTranslations } from 'next-intl';

import type { DropdownMenuProps } from '@radix-ui/react-dropdown-menu';

import {
  CalendarIcon,
  ChevronRightIcon,
  Code2,
  Columns3Icon,
  FileCodeIcon,
  FilmIcon,
  Heading1Icon,
  Heading2Icon,
  Heading3Icon,
  ImageIcon,
  Link2Icon,
  ListIcon,
  ListOrderedIcon,
  MinusIcon,
  PenToolIcon,
  PilcrowIcon,
  PlusIcon,
  QuoteIcon,
  RadicalIcon,
  SquareIcon,
  SuperscriptIcon,
  TableIcon,
  TableOfContentsIcon,
} from 'lucide-react';
import { KEYS } from 'platejs';
import { type PlateEditor, useEditorRef } from 'platejs/react';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  insertBlock,
  insertInlineElement,
} from '@/components/editor/transforms';

import { ToolbarButton, ToolbarMenuGroup } from './toolbar';

type Group = {
  group: string;
  items: Item[];
};

type Item = {
  icon: React.ReactNode;
  value: string;
  onSelect: (editor: PlateEditor, value: string) => void;
  focusEditor?: boolean;
  label?: string;
};

const getGroups = (t: ReturnType<typeof useTranslations>): Group[] => [
  {
    group: t('editor.basicBlocks'),
    items: [
      {
        icon: <PilcrowIcon />,
        label: t('editor.paragraph'),
        value: KEYS.p,
      },
      {
        icon: <Heading1Icon />,
        label: t('editor.heading1'),
        value: 'h1',
      },
      {
        icon: <Heading2Icon />,
        label: t('editor.heading2'),
        value: 'h2',
      },
      {
        icon: <Heading3Icon />,
        label: t('editor.heading3'),
        value: 'h3',
      },
      {
        icon: <TableIcon />,
        label: t('editor.table'),
        value: KEYS.table,
      },
      {
        icon: <FileCodeIcon />,
        label: t('editor.code'),
        value: KEYS.codeBlock,
      },
      {
        icon: <QuoteIcon />,
        label: t('editor.quote'),
        value: KEYS.blockquote,
      },
      {
        icon: <MinusIcon />,
        label: t('editor.divider'),
        value: KEYS.hr,
      },
    ].map((item) => ({
      ...item,
      onSelect: (editor, value) => {
        insertBlock(editor, value);
      },
    })),
  },
  {
    group: t('editor.lists'),
    items: [
      {
        icon: <ListIcon />,
        label: t('editor.bulletedList'),
        value: KEYS.ul,
      },
      {
        icon: <ListOrderedIcon />,
        label: t('editor.numberedList'),
        value: KEYS.ol,
      },
      {
        icon: <SquareIcon />,
        label: t('editor.toDoList'),
        value: KEYS.listTodo,
      },
      {
        icon: <ChevronRightIcon />,
        label: t('editor.toggleList'),
        value: KEYS.toggle,
      },
    ].map((item) => ({
      ...item,
      onSelect: (editor, value) => {
        insertBlock(editor, value);
      },
    })),
  },
  {
    group: t('editor.media'),
    items: [
      {
        icon: <ImageIcon />,
        label: t('editor.image'),
        value: KEYS.img,
      },
      {
        icon: <FilmIcon />,
        label: t('editor.embed'),
        value: KEYS.mediaEmbed,
      },
    ].map((item) => ({
      ...item,
      onSelect: (editor, value) => {
        insertBlock(editor, value);
      },
    })),
  },
  {
    group: t('editor.advancedBlocks'),
    items: [
      {
        icon: <TableOfContentsIcon />,
        label: t('editor.tableOfContents'),
        value: KEYS.toc,
      },
      {
        icon: <Columns3Icon />,
        label: t('editor.columns3'),
        value: 'action_three_columns',
      },
      {
        focusEditor: false,
        icon: <RadicalIcon />,
        label: t('editor.equation'),
        value: KEYS.equation,
      },
      {
        icon: <PenToolIcon />,
        label: t('editor.excalidraw'),
        value: KEYS.excalidraw,
      },
      {
        icon: <Code2 />,
        label: t('editor.codeDrawing'),
        value: KEYS.codeDrawing,
      },
    ].map((item) => ({
      ...item,
      onSelect: (editor, value) => {
        insertBlock(editor, value);
      },
    })),
  },
  {
    group: t('editor.inline'),
    items: [
      {
        icon: <Link2Icon />,
        label: t('editor.link'),
        value: KEYS.link,
      },
      {
        focusEditor: true,
        icon: <CalendarIcon />,
        label: t('editor.date'),
        value: KEYS.date,
      },
      {
        focusEditor: true,
        icon: <SuperscriptIcon />,
        label: t('editor.footnote'),
        value: 'action_footnote',
      },
      {
        focusEditor: false,
        icon: <RadicalIcon />,
        label: t('editor.inlineEquation'),
        value: KEYS.inlineEquation,
      },
    ].map((item) => ({
      ...item,
      onSelect: (editor, value) => {
        insertInlineElement(editor, value);
      },
    })),
  },
];

export function InsertToolbarButton(props: DropdownMenuProps) {
  const t = useTranslations();
  const editor = useEditorRef();
  const [open, setOpen] = React.useState(false);

  return (
    <DropdownMenu open={open} onOpenChange={setOpen} modal={false} {...props}>
      <DropdownMenuTrigger asChild>
        <ToolbarButton pressed={open} tooltip={t("editor.insertTitle")} isDropdown>
          <PlusIcon />
        </ToolbarButton>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        className="flex max-h-[500px] min-w-0 flex-col overflow-y-auto"
        align="start"
      >
        {getGroups(t).map(({ group, items: nestedItems }) => (
          <ToolbarMenuGroup key={group} label={group}>
            {nestedItems.map(({ icon, label, value, onSelect }) => (
              <DropdownMenuItem
                key={value}
                className="min-w-[180px]"
                onSelect={() => {
                  onSelect(editor, value);
                  editor.tf.focus();
                }}
              >
                {icon}
                {label}
              </DropdownMenuItem>
            ))}
          </ToolbarMenuGroup>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
