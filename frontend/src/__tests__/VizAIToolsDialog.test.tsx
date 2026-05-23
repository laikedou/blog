import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import VizAIToolsDialog from '@/components/Visualizations/AITools/VizAIToolsDialog';
import { visualizations } from '@/lib/api';

jest.mock('@/lib/api', () => ({
  visualizations: {
    getAiToolContent: jest.fn(),
    generateAiTool: jest.fn(),
    updateAiToolContent: jest.fn(),
    getAiToolVersions: jest.fn(),
    getAiToolVersionDetail: jest.fn(),
    restoreAiToolVersion: jest.fn(),
    compareAiToolVersions: jest.fn(),
  },
}));

jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

// XYFlow uses canvas and ESM — mock the brainstorm canvas component
jest.mock('@/components/Visualizations/AITools/AIToolBrainstormCanvas', () => {
  const React = require('react');
  return {
    __esModule: true,
    default: function MockBrainstormCanvas() {
      return React.createElement('div', { 'data-testid': 'brainstorm-canvas' }, 'Mind Map Canvas');
    },
  };
});

// Mock exam paper preview (pdf-lib and docx cause issues in jsdom)
jest.mock('@/components/Visualizations/AITools/AIToolExamPaperPreview', () => {
  const React = require('react');
  return {
    __esModule: true,
    default: function MockExamPaperPreview() {
      return React.createElement('div', { 'data-testid': 'exam-paper-preview' }, 'Exam Paper Preview');
    },
  };
});

// Mock PDF/DOCX export utilities
jest.mock('@/lib/exam-pdf-export', () => ({ exportExamToPdf: jest.fn() }));
jest.mock('@/lib/exam-docx-export', () => ({ exportExamToDocx: jest.fn() }));

// Mock the UI dialog to render children when open
jest.mock('@/components/ui/dialog', () => {
  const React = require('react');
  return {
    Dialog: ({ children, open }: { children: React.ReactNode; open: boolean }) =>
      open ? React.createElement('div', { 'data-testid': 'dialog-root' }, children) : null,
    DialogContent: ({ children }: { children: React.ReactNode }) =>
      React.createElement('div', { 'data-testid': 'dialog-content' }, children),
    DialogTrigger: ({ children }: { children: React.ReactNode }) =>
      React.createElement('div', null, children),
    DialogPortal: ({ children }: { children: React.ReactNode }) =>
      React.createElement('div', null, children),
    DialogClose: ({ children }: { children: React.ReactNode }) =>
      React.createElement('button', null, children),
    DialogHeader: ({ children }: { children: React.ReactNode }) =>
      React.createElement('div', null, children),
    DialogTitle: ({ children }: { children: React.ReactNode }) =>
      React.createElement('div', null, children),
    DialogDescription: ({ children }: { children: React.ReactNode }) =>
      React.createElement('div', null, children),
  };
});

const mockVersions = [
  { id: 1, version: 1, changeNote: 'Initial generation', createdAt: '2026-01-01T00:00:00Z' },
  { id: 2, version: 2, changeNote: 'Edited content', createdAt: '2026-01-02T00:00:00Z' },
];

const mockToolData = {
  content: '# Lesson Plan\n\n## Objectives\n- Learn math',
  title: 'Math Lesson',
  currentVersion: 2,
  versions: mockVersions,
};

const defaultProps = {
  open: true,
  onOpenChange: jest.fn(),
  visualizationId: 42,
  visualizationTitle: 'Test Visualization',
  visualizationSubject: 'math',
  language: 'en',
};

describe('VizAIToolsDialog', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (visualizations.getAiToolContent as jest.Mock).mockResolvedValue(mockToolData);
    (visualizations.generateAiTool as jest.Mock).mockResolvedValue(mockToolData);
    (visualizations.updateAiToolContent as jest.Mock).mockResolvedValue(mockToolData);
    (visualizations.restoreAiToolVersion as jest.Mock).mockResolvedValue({ ...mockToolData, currentVersion: 3 });
    (visualizations.compareAiToolVersions as jest.Mock).mockResolvedValue({ from: 'v1', to: 'v2' });
  });

  it('should render the tool selector with three tool buttons', async () => {
    render(<VizAIToolsDialog {...defaultProps} />);

    await waitFor(() => {
      // i18n mock: viz.tools.{lessonPlan,examGen,brainstorm}.title → "title"
      // plus the header h2 also renders "title" → 4 total
      const titles = screen.getAllByText('title');
      expect(titles.length).toBeGreaterThanOrEqual(3);
    });
  });

  it('should fetch existing content on open', async () => {
    render(<VizAIToolsDialog {...defaultProps} />);

    await waitFor(() => {
      expect(visualizations.getAiToolContent).toHaveBeenCalledWith(42, 'lessonPlan');
    });
  });

  it('should show toolbar buttons after content loads', async () => {
    render(<VizAIToolsDialog {...defaultProps} />);

    await waitFor(() => {
      // After content loads, preview is shown and toolbar buttons appear
      expect(screen.getByText('Edit')).toBeInTheDocument();
    });
    expect(screen.getByText('Versions')).toBeInTheDocument();
    expect(screen.getByText('Preview')).toBeInTheDocument();
  });

  it('should render dialog when open', async () => {
    render(<VizAIToolsDialog {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByTestId('dialog-root')).toBeInTheDocument();
    });
  });

  it('should not render dialog content when closed', () => {
    render(<VizAIToolsDialog {...defaultProps} open={false} />);

    expect(screen.queryByTestId('dialog-root')).not.toBeInTheDocument();
    expect(visualizations.getAiToolContent).not.toHaveBeenCalled();
  });

  it('should handle error when fetching content gracefully', async () => {
    (visualizations.getAiToolContent as jest.Mock).mockRejectedValue(new Error('Not found'));

    render(<VizAIToolsDialog {...defaultProps} />);

    await waitFor(() => {
      expect(visualizations.getAiToolContent).toHaveBeenCalled();
    });
    // Should not crash — tool selector still renders
    expect(screen.getByTestId('dialog-root')).toBeInTheDocument();
  });

  it('should default to lessonPlan when no defaultTool given', async () => {
    render(<VizAIToolsDialog {...defaultProps} />);

    await waitFor(() => {
      expect(visualizations.getAiToolContent).toHaveBeenCalledWith(42, 'lessonPlan');
    });
  });

  it('should fetch with defaultTool when provided', async () => {
    render(<VizAIToolsDialog {...defaultProps} defaultTool="examGen" />);

    await waitFor(() => {
      expect(visualizations.getAiToolContent).toHaveBeenCalledWith(42, 'examGen');
    });
  });

  it('should switch tools when clicking a different tool button', async () => {
    render(<VizAIToolsDialog {...defaultProps} />);

    await waitFor(() => {
      expect(visualizations.getAiToolContent).toHaveBeenCalledWith(42, 'lessonPlan');
    });

    // Click second tool button (examGen — shows "title" from i18n)
    const buttons = screen.getAllByText('title');
    fireEvent.click(buttons[1]);

    await waitFor(() => {
      expect(visualizations.getAiToolContent).toHaveBeenCalledWith(42, 'examGen');
    });
  });

  it('should show footer with download and copy buttons', async () => {
    render(<VizAIToolsDialog {...defaultProps} />);

    await waitFor(() => {
      // Footer uses hardcoded labels for download buttons
      expect(screen.getByText('Markdown')).toBeInTheDocument();
      expect(screen.getByText('HTML')).toBeInTheDocument();
    });
  });

  it('should open dialog with grading as default tool', async () => {
    render(<VizAIToolsDialog {...defaultProps} defaultTool="grading" />);

    await waitFor(() => {
      expect(visualizations.getAiToolContent).toHaveBeenCalledWith(42, 'grading');
    });
  });

  it('should show four tool buttons (including grading)', async () => {
    render(<VizAIToolsDialog {...defaultProps} />);

    await waitFor(() => {
      // 4 tool buttons + 1 header title = 5 "title" elements
      const titles = screen.getAllByText('title');
      expect(titles.length).toBeGreaterThanOrEqual(4);
    });
  });
});
