'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { BookOpen, FileText, Lightbulb, PenLine, Edit3, History, Eye, Sparkles } from 'lucide-react';
import { visualizations } from '@/lib/api';
import { toast } from 'sonner';
import AIToolDialogPortal from './AIToolDialogPortal';
import AIToolHeader from './AIToolHeader';
import AIToolTabGenerate from './AIToolTabGenerate';
import AIToolTabEdit from './AIToolTabEdit';
import AIToolTabVersions from './AIToolTabVersions';
import AIToolTabPreview from './AIToolTabPreview';
import AIToolBrainstormCanvas from './AIToolBrainstormCanvas';
import AIToolExamPaperPreview from './AIToolExamPaperPreview';
import AIToolExamConfig from './AIToolExamConfig';
import AIToolQuestionEditor from './AIToolQuestionEditor';
import AIToolGradingUpload from './AIToolGradingUpload';
import AIToolGradingPreview from './AIToolGradingPreview';
import AIToolFooter from './AIToolFooter';
import AIToolVersionDiff from './AIToolVersionDiff';
import type { ExamConfig } from '@/lib/exam-schema';

type ToolKey = 'lessonPlan' | 'examGen' | 'brainstorm' | 'grading';
type ViewMode = 'generate' | 'preview' | 'edit' | 'versions';

interface VersionInfo {
  id: number;
  version: number;
  changeNote: string;
  createdAt: string;
}

interface ToolData {
  content: string;
  title: string;
  currentVersion: number;
  versions: VersionInfo[];
}

const TOOL_DEFS: { key: ToolKey; icon: React.ElementType; color: string; titleKey: string; descKey: string; needsInput?: boolean }[] = [
  { key: 'lessonPlan', icon: BookOpen, color: '#38bdf8', titleKey: 'viz.tools.lessonPlan.title', descKey: 'viz.tools.lessonPlan.description' },
  { key: 'examGen', icon: FileText, color: '#f59e0b', titleKey: 'viz.tools.examGen.title', descKey: 'viz.tools.examGen.description' },
  { key: 'brainstorm', icon: Lightbulb, color: '#a78bfa', titleKey: 'viz.tools.brainstorm.title', descKey: 'viz.tools.brainstorm.description' },
  { key: 'grading', icon: PenLine, color: '#34d399', titleKey: 'viz.tools.grading.title', descKey: 'viz.tools.grading.description', needsInput: true },
];

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  visualizationId: number;
  visualizationTitle: string;
  visualizationSubject: string;
  knowledgeSummary?: string;
  detailedExplanation?: string;
  language?: string;
  defaultTool?: 'lessonPlan' | 'examGen' | 'brainstorm' | 'grading';
}

export default function VizAIToolsDialog({
  open,
  onOpenChange,
  visualizationId,
  visualizationTitle,
  visualizationSubject,
  knowledgeSummary,
  detailedExplanation,
  language,
  defaultTool,
}: Props) {
  const t = useTranslations();

  const [activeTool, setActiveTool] = useState<ToolKey>(defaultTool || 'lessonPlan');
  const [viewMode, setViewMode] = useState<ViewMode>('generate');
  const [generating, setGenerating] = useState(false);
  const [studentAnswer, setStudentAnswer] = useState('');
  const [data, setData] = useState<Record<string, ToolData>>({});
  const [versionsLoading, setVersionsLoading] = useState(false);

  // Diff state
  const [diffMode, setDiffMode] = useState(false);
  const [diffFirst, setDiffFirst] = useState<number | null>(null);
  const [diffSecond, setDiffSecond] = useState<number | null>(null);
  const [showDiff, setShowDiff] = useState(false);

  const toolDef = TOOL_DEFS.find(d => d.key === activeTool)!;
  const toolData = data[activeTool];
  const hasContent = !!toolData?.content;

  // When tool changes, fetch existing content
  useEffect(() => {
    if (!open) return;
    setViewMode('generate');
    setDiffMode(false);
    setShowDiff(false);

    visualizations.getAiToolContent(visualizationId, activeTool)
      .then(d => {
        setData(prev => ({ ...prev, [activeTool]: { content: d.content, title: d.title, currentVersion: d.currentVersion, versions: d.versions || [] } }));
        if (d.content) setViewMode('preview');
      })
      .catch(() => {
        setData(prev => ({ ...prev, [activeTool]: { content: '', title: '', currentVersion: 1, versions: [] } }));
      });
  }, [open, activeTool, visualizationId]);

  // Reset on dialog open
  useEffect(() => {
    if (open && defaultTool) setActiveTool(defaultTool);
  }, [open, defaultTool]);

  const handleGenerate = async (examConfigOrImageBase64?: ExamConfig | string, mimeType?: string) => {
    setGenerating(true);
    try {
      const apiData: any = {
        toolType: activeTool,
        language: language || 'en',
      };

      if (activeTool === 'grading' && typeof examConfigOrImageBase64 === 'string') {
        // Image-based grading path
        apiData.imageBase64 = examConfigOrImageBase64;
        apiData.mimeType = mimeType || 'image/jpeg';
      } else {
        // Text-based tools
        apiData.studentAnswer = activeTool === 'grading' ? studentAnswer : undefined;

        if (activeTool === 'examGen' && examConfigOrImageBase64 && typeof examConfigOrImageBase64 === 'object') {
          Object.assign(apiData, examConfigOrImageBase64);
        }
      }

      const result = await visualizations.generateAiTool(visualizationId, apiData);
      setData(prev => ({
        ...prev,
        [activeTool]: {
          content: result.content,
          title: result.title,
          currentVersion: result.currentVersion,
          versions: result.versions || [],
        },
      }));
      setViewMode('preview');
      toast.success(t('viz.tools.generateSuccess') || 'Generated successfully');
    } catch {
      toast.error(t('viz.tools.generateFailed'));
    } finally {
      setGenerating(false);
    }
  };

  const handleSave = async (content: string): Promise<void> => {
    await visualizations.updateAiToolContent(visualizationId, activeTool, { content });
    const result = await visualizations.getAiToolContent(visualizationId, activeTool);
    setData(prev => ({
      ...prev,
      [activeTool]: {
        content: result.content,
        title: result.title,
        currentVersion: result.currentVersion,
        versions: result.versions || [],
      },
    }));
    setViewMode('preview');
    toast.success(t('viz.tools.saveSuccess') || 'Version saved');
  };

  const handleRestore = async (versionId: number) => {
    try {
      const result = await visualizations.restoreAiToolVersion(
        visualizationId, activeTool, versionId,
        `Restored from version`
      );
      setData(prev => ({
        ...prev,
        [activeTool]: {
          content: result.content,
          title: result.title,
          currentVersion: result.currentVersion,
          versions: result.versions || [],
        },
      }));
      setViewMode('preview');
      toast.success(t('viz.tools.restoreSuccess') || 'Version restored');
    } catch {
      toast.error(t('viz.tools.generateFailed'));
    }
  };

  const handleStartDiff = (versionId: number) => {
    if (!diffFirst) {
      setDiffFirst(versionId);
    } else {
      setDiffSecond(versionId);
      setShowDiff(true);
    }
  };

  const handleCancelDiff = () => {
    setDiffMode(false);
    setDiffFirst(null);
    setDiffSecond(null);
    setShowDiff(false);
  };

  const handleLoadCompare = useCallback(async (vizId: number, toolType: string, fromId: number, toId: number) => {
    return visualizations.compareAiToolVersions(vizId, toolType, fromId, toId);
  }, []);

  return (
    <AIToolDialogPortal open={open} onOpenChange={onOpenChange}>

     

      {/* Content area */}
      <div className="flex-1 flex flex-col overflow-hidden">
         {/* Tool header + toolbar */}
      <div className="flex items-center">
        <div className="flex-1">
          <AIToolHeader
            icon={toolDef.icon}
            iconColor={toolDef.color}
            title={t(toolDef.titleKey)}
            subtitle={t(toolDef.descKey)}
            onClose={() => onOpenChange(false)}
          />
        </div>

        {/* Toolbar buttons (only when content exists) */}
        {hasContent && (
          <div className="flex items-center gap-1 pr-4">
            <button
              onClick={() => setViewMode('generate')}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-white/35 hover:text-white/60 hover:bg-white/[0.04] transition-colors"
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Generate</span>
            </button>
            <button
              onClick={() => setViewMode('edit')}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                viewMode === 'edit'
                  ? 'text-white'
                  : 'text-white/35 hover:text-white/60 hover:bg-white/[0.04]'
              }`}
              style={viewMode === 'edit' ? { background: `${toolDef.color}15` } : undefined}
            >
              <Edit3 className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Edit</span>
            </button>
            <button
              onClick={() => setViewMode('versions')}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                viewMode === 'versions'
                  ? 'text-white'
                  : 'text-white/35 hover:text-white/60 hover:bg-white/[0.04]'
              }`}
              style={viewMode === 'versions' ? { background: `${toolDef.color}15` } : undefined}
            >
              <History className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Versions</span>
            </button>
            <button
              onClick={() => setViewMode('preview')}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                viewMode === 'preview'
                  ? 'text-white'
                  : 'text-white/35 hover:text-white/60 hover:bg-white/[0.04]'
              }`}
              style={viewMode === 'preview' ? { background: `${toolDef.color}15` } : undefined}
            >
              <Eye className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Preview</span>
            </button>
          </div>
        )}
      </div>
        {viewMode === 'generate' && activeTool === 'examGen' && (
          <AIToolExamConfig
            loading={generating}
            accentColor={toolDef.color}
            onGenerate={(config) => handleGenerate(config)}
          />
        )}

        {viewMode === 'generate' && activeTool === 'grading' && (
          <AIToolGradingUpload
            loading={generating}
            accentColor={toolDef.color}
            onGenerate={(imageBase64, mime) => handleGenerate(imageBase64, mime)}
          />
        )}

        {viewMode === 'generate' && activeTool !== 'examGen' && activeTool !== 'grading' && (
          <AIToolTabGenerate
            toolType={activeTool}
            loading={generating}
            accentColor={toolDef.color}
            onGenerate={() => handleGenerate()}
            studentAnswer={studentAnswer}
            onStudentAnswerChange={setStudentAnswer}
          />
        )}

        {viewMode === 'edit' && activeTool === 'examGen' && (
          <AIToolQuestionEditor
            content={toolData?.content || ''}
            accentColor={toolDef.color}
            onSave={handleSave}
          />
        )}

        {viewMode === 'edit' && activeTool !== 'examGen' && (
          <AIToolTabEdit
            content={toolData?.content || ''}
            accentColor={toolDef.color}
            onSave={handleSave}
          />
        )}

        {viewMode === 'versions' && (
          <AIToolTabVersions
            versions={toolData?.versions || []}
            currentVersion={toolData?.currentVersion || 1}
            accentColor={toolDef.color}
            loading={versionsLoading}
            diffMode={diffMode}
            selectedForDiff={diffFirst}
            onRestore={handleRestore}
            onStartDiff={handleStartDiff}
            onCancelDiff={handleCancelDiff}
          />
        )}

        {viewMode === 'preview' && (
          <>
            {activeTool === 'brainstorm' ? (
              <AIToolBrainstormCanvas content={toolData?.content || ''} />
            ) : activeTool === 'examGen' ? (
              <AIToolExamPaperPreview
                content={toolData?.content || ''}
                title={toolData?.title || visualizationTitle}
                accentColor={toolDef.color}
              />
            ) : activeTool === 'grading' ? (
              <AIToolGradingPreview content={toolData?.content || ''} />
            ) : (
              <AIToolTabPreview content={toolData?.content || ''} />
            )}
            {/* Diff overlay in preview */}
            {showDiff && diffFirst && diffSecond && (
              <div className="border-t border-white/[0.06] p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-white/40 font-medium">Version Diff</span>
                  <button onClick={handleCancelDiff} className="text-xs text-white/30 hover:text-white/60">Close</button>
                </div>
                <AIToolVersionDiff
                  vizId={visualizationId}
                  toolType={activeTool}
                  fromVersionId={diffFirst}
                  toVersionId={diffSecond}
                  accentColor={toolDef.color}
                  onLoadCompare={handleLoadCompare}
                />
              </div>
            )}
          </>
        )}
      </div>

      {/* Footer with download/copy */}
      <AIToolFooter content={toolData?.content || ''} title={toolData?.title || visualizationTitle} accentColor={toolDef.color} toolType={activeTool} />
    </AIToolDialogPortal>
  );
}
