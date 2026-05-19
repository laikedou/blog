'use client';

import { ChevronLeft } from 'lucide-react';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Sparkles } from 'lucide-react';
import {
  Code, Download, Maximize2, Minimize2, Users, Play,
  GitFork, Code2, Share2, MoreHorizontal,
} from 'lucide-react';

interface ToolbarAction {
  key: string;
  icon: React.ElementType;
  label: string;
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
  loading?: boolean;
  hidden?: boolean;
}

interface Props {
  fullscreen: boolean;
  showCode: boolean;
  tutorOpen: boolean;
  isAuthenticated: boolean;
  classroomCreating: boolean;
  narrationGenerating: boolean;
  aiGenerated?: boolean;
  version?: number;
  onBack?: () => void;
  onToggleCode: () => void;
  onDownload: () => void;
  onToggleTutor: () => void;
  onCreateClassroom: () => void;
  onGenerateNarration: () => void;
  onToggleFullscreen: () => void;
  onFork: () => void;
  onEmbedOpen: () => void;
  onShare: () => void;
}

export default function VizStickyHeader({
  fullscreen,
  showCode,
  tutorOpen,
  isAuthenticated,
  classroomCreating,
  narrationGenerating,
  aiGenerated,
  version,
  onToggleCode,
  onDownload,
  onToggleTutor,
  onCreateClassroom,
  onGenerateNarration,
  onToggleFullscreen,
  onFork,
  onEmbedOpen,
  onShare,
}: Props) {
  const { t } = useTranslation();

  const actions: ToolbarAction[] = [
    { key: 'code', icon: Code, label: t('viz.viewSource'), onClick: onToggleCode, active: showCode },
    { key: 'download', icon: Download, label: t('viz.downloadHtml'), onClick: onDownload },
    { key: 'tutor', icon: Sparkles, label: t('viz.tutor.toggle'), onClick: onToggleTutor, active: tutorOpen },
    ...(isAuthenticated ? [
      { key: 'classroom', icon: Users, label: t('viz.classroom.create'), onClick: onCreateClassroom, disabled: classroomCreating },
      { key: 'narration', icon: Play, label: t('viz.narration.generate'), onClick: onGenerateNarration, disabled: narrationGenerating, loading: narrationGenerating },
    ] : []),
    { key: 'fullscreen', icon: fullscreen ? Minimize2 : Maximize2, label: t('viz.fullscreen'), onClick: onToggleFullscreen },
    { key: 'fork', icon: GitFork, label: t('viz.fork'), onClick: onFork },
    { key: 'embed', icon: Code2, label: t('viz.embed'), onClick: onEmbedOpen },
    { key: 'share', icon: Share2, label: t('viz.share'), onClick: onShare },
  ];

  const visibleActions = actions.filter(a => !a.hidden);
  const primaryActions = visibleActions.slice(0, 3);
  const overflowActions = visibleActions.slice(3);

  return (
    <div className="sticky top-0 z-30 bg-surface/80 backdrop-blur-xl border-b border-outline-variant">
      <div className="max-w-grid mx-auto px-3 sm:px-6 py-2 flex items-center justify-between">
        <Link
          href="/visualizations"
          className="inline-flex items-center gap-1.5 text-body-sm text-on-surface-variant hover:text-on-surface transition-colors shrink-0"
        >
          <ChevronLeft className="h-4 w-4" />
          <span className="hidden sm:inline">{t('viz.browseAll')}</span>
        </Link>

        {/* Badge row — centered */}
        <div className="hidden sm:flex items-center gap-2 text-label-sm text-on-surface-variant">
          {version && <span>{t('viz.versionLabel', { version })}</span>}
          {aiGenerated && (
            <span className="inline-flex items-center gap-1">
              <Sparkles className="h-3 w-3 text-tertiary" />
              {t('viz.aiGenerated')}
            </span>
          )}
        </div>

        {/* Desktop toolbar */}
        <div className="hidden lg:flex items-center gap-1">
          {visibleActions.map(action => (
            <Button
              key={action.key}
              variant={action.active ? 'default' : 'ghost'}
              size="sm"
              onClick={action.onClick}
              disabled={action.disabled}
              title={action.label}
              className={action.active ? 'bg-tertiary hover:bg-tertiary/90 text-surface' : ''}
            >
              <action.icon className="h-4 w-4" />
              {action.key === 'share' && <span className="ml-1 hidden xl:inline">{action.label}</span>}
            </Button>
          ))}
        </div>

        {/* Mobile overflow menu */}
        <div className="lg:hidden">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                <MoreHorizontal className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              {overflowActions.map(action => (
                <DropdownMenuItem key={action.key} onClick={action.onClick} disabled={action.disabled}>
                  <action.icon className="h-4 w-4 mr-2" />
                  {action.label}
                </DropdownMenuItem>
              ))}
              {/* Show primary actions in mobile menu too for completeness */}
              {primaryActions.map(action => (
                <DropdownMenuItem key={`m-${action.key}`} onClick={action.onClick} disabled={action.disabled}>
                  <action.icon className="h-4 w-4 mr-2" />
                  {action.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
}
