/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import { HtmlVisualizationRenderer } from '@/components/Visualizations/VisualizationRenderer';

// Mock the api module
jest.mock('@/lib/api', () => ({
  visualizations: {
    recordStat: jest.fn().mockResolvedValue({}),
  },
}));

describe('HtmlVisualizationRenderer', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    delete (window as any).__vizError;
  });

  it('should show skeleton loading state when htmlContent is empty', () => {
    const { container } = render(<HtmlVisualizationRenderer htmlContent="" />);
    expect(container.querySelector('.animate-pulse')).toBeInTheDocument();
  });

  it('should render HTML content directly', async () => {
    const html = '<div class="viz-root" data-testid="viz-root"><p>Hello from HTML</p></div>';
    render(<HtmlVisualizationRenderer htmlContent={html} />);

    await waitFor(() => {
      expect(screen.getByTestId('viz-root')).toBeInTheDocument();
    });
    expect(screen.getByText('Hello from HTML')).toBeInTheDocument();
  });

  it('should record view stat when visualizationId is provided', async () => {
    const html = '<div class="viz-root" data-testid="viz-root">Stat test</div>';
    const { visualizations } = require('@/lib/api');

    render(<HtmlVisualizationRenderer htmlContent={html} visualizationId={42} />);

    await waitFor(() => {
      expect(screen.getByTestId('viz-root')).toBeInTheDocument();
    });

    expect(visualizations.recordStat).toHaveBeenCalledWith(42, 'view');
  });

  it('should show error state when window.__vizError is called', async () => {
    const html = `<div class="viz-root">
      <script>window.__vizError('Something broke');</script>
    </div>`;

    render(<HtmlVisualizationRenderer htmlContent={html} />);

    await waitFor(() => {
      expect(screen.getByText(/Render Error/)).toBeInTheDocument();
    });
    expect(screen.getByText(/Something broke/)).toBeInTheDocument();
  });

  it('should call onError when __vizError is triggered', async () => {
    const onError = jest.fn();
    const html = `<div class="viz-root">
      <script>window.__vizError('runtime failure');</script>
    </div>`;

    render(<HtmlVisualizationRenderer htmlContent={html} onError={onError} />);

    await waitFor(() => {
      expect(onError).toHaveBeenCalledWith('runtime failure');
    });
  });

  it('should support clickable HTML elements', async () => {
    const html = `<div class="viz-root">
      <button data-testid="test-btn" onclick="window.clicked=true">Click Me</button>
    </div>`;

    render(<HtmlVisualizationRenderer htmlContent={html} />);

    await waitFor(() => {
      expect(screen.getByTestId('test-btn')).toBeInTheDocument();
    });

    act(() => {
      screen.getByTestId('test-btn').click();
    });
    expect((window as any).clicked).toBe(true);
    delete (window as any).clicked;
  });

  it('should clear errors when htmlContent changes', async () => {
    const onError = jest.fn();
    const brokenHtml = `<div class="viz-root">
      <script>window.__vizError('error 1');</script>
    </div>`;
    const fixedHtml = '<div class="viz-root" data-testid="fixed">Fixed!</div>';

    const { rerender } = render(<HtmlVisualizationRenderer htmlContent={brokenHtml} onError={onError} />);
    await waitFor(() => {
      expect(onError).toHaveBeenCalledWith('error 1');
    });

    rerender(<HtmlVisualizationRenderer htmlContent={fixedHtml} onError={onError} />);
    await waitFor(() => {
      expect(screen.getByTestId('fixed')).toBeInTheDocument();
    });
    // Error should be cleared
    expect(screen.queryByText(/Render Error/)).not.toBeInTheDocument();
  });

  it('should handle multiple re-renders with different HTML', async () => {
    const html1 = '<div class="viz-root" data-testid="viz">Version 1</div>';
    const html2 = '<div class="viz-root" data-testid="viz">Version 2</div>';

    const { rerender } = render(<HtmlVisualizationRenderer htmlContent={html1} />);
    await waitFor(() => {
      expect(screen.getByText('Version 1')).toBeInTheDocument();
    });

    rerender(<HtmlVisualizationRenderer htmlContent={html2} />);
    await waitFor(() => {
      expect(screen.getByText('Version 2')).toBeInTheDocument();
    });
  });
});
