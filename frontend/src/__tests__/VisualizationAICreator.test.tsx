import React from 'react';
import { render, screen, waitFor, fireEvent, act } from '@testing-library/react';
import { VisualizationAICreator } from '@/components/Visualizations/VisualizationAICreator';
import { visualizations } from '@/lib/api';

// Mock the API module
jest.mock('@/lib/api', () => ({
  visualizations: {
    suggestTopics: jest.fn(),
    get: jest.fn(),
    refine: jest.fn(),
    fixError: jest.fn(),
    update: jest.fn(),
    publish: jest.fn(),
    generateMetadata: jest.fn(),
    getVersions: jest.fn(),
    getVersionDetail: jest.fn(),
    restoreVersion: jest.fn(),
    compareVersions: jest.fn(),
    generateCover: jest.fn(),
    recordStat: jest.fn().mockResolvedValue({}),
  },
}));

// Mock the streaming hook — start immediately transitions to streaming then complete
jest.mock('@/hooks/useVisualizationStream', () => ({
  useVisualizationStream: () => {
    const [state, setState] = React.useState<any>({
      status: 'idle',
      visualizationId: null,
      title: '',
      code: '',
      error: null,
      fullResponse: null,
    });

    const start = jest.fn().mockImplementation(() => {
      setState({
        status: 'streaming',
        visualizationId: 42,
        title: 'Test Viz',
        code: '<div>generated content</div>',
        error: null,
        fullResponse: null,
      });
      setTimeout(() => {
        setState({
          status: 'complete',
          visualizationId: 42,
          title: 'Test Viz',
          code: '<div>generated content</div>',
          error: null,
          fullResponse: {
            id: 42,
            htmlContent: '<div>generated content</div>',
            raw: '<div>generated content</div>',
            title: 'Test Viz',
            status: 'draft',
          },
        });
      }, 50);
    });

    return { state, start, abort: jest.fn(), reset: jest.fn() };
  },
}));

const mockTopics = [
  { id: 'pythagorean', title: 'Pythagorean Theorem', description: 'Interactive proof of the Pythagorean theorem', subject: 'math', difficulty: 'beginner', tags: ['geometry'] },
  { id: 'pendulum', title: 'Simple Harmonic Motion', description: 'Simulate a pendulum', subject: 'physics', difficulty: 'beginner', tags: ['mechanics'] },
  { id: 'trig-unit', title: 'Unit Circle', description: 'Visualize trig functions', subject: 'math', difficulty: 'intermediate', tags: ['trig'] },
  { id: 'projectile', title: 'Projectile Motion', description: 'Launch projectiles', subject: 'physics', difficulty: 'intermediate', tags: ['kinematics'] },
  { id: 'fractal', title: 'Fractal Tree', description: 'Generate fractal tree', subject: 'math', difficulty: 'advanced', tags: ['fractals'] },
  { id: 'quantum', title: 'Quantum Well', description: 'Wavefunctions', subject: 'physics', difficulty: 'advanced', tags: ['quantum'] },
];

const mockVersions = [
  { id: 3, version: 3, changeNote: 'Refined', prompt: 'make it better', createdAt: new Date().toISOString(), isCurrent: true },
  { id: 2, version: 2, changeNote: 'Refined', prompt: 'add color', createdAt: new Date().toISOString(), isCurrent: false },
  { id: 1, version: 1, changeNote: 'Initial generation', prompt: 'initial', createdAt: new Date().toISOString(), isCurrent: false },
];

describe('VisualizationAICreator', () => {
  const mockOnDone = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (visualizations.suggestTopics as jest.Mock).mockResolvedValue(mockTopics);
    (visualizations.get as jest.Mock).mockResolvedValue({ id: 42, title: 'Test Viz', subject: 'math', status: 'draft' });
    (visualizations.getVersions as jest.Mock).mockResolvedValue(mockVersions);
    (visualizations.getVersionDetail as jest.Mock).mockResolvedValue({ htmlContent: '<div>v2 content</div>', isCurrent: false });
    (visualizations.restoreVersion as jest.Mock).mockResolvedValue({ htmlContent: '<div>restored</div>', version: 4 });
    (visualizations.update as jest.Mock).mockResolvedValue({});
    (visualizations.publish as jest.Mock).mockResolvedValue({});
  });

  it('should render topic step by default', async () => {
    render(<VisualizationAICreator onDone={mockOnDone} />);

    await waitFor(() => {
      expect(screen.getByText('Pythagorean Theorem')).toBeInTheDocument();
    });
    expect(screen.getByText('Simple Harmonic Motion')).toBeInTheDocument();
  });

  it('should load topic suggestions on mount', async () => {
    render(<VisualizationAICreator onDone={mockOnDone} />);

    await waitFor(() => {
      expect(visualizations.suggestTopics).toHaveBeenCalledWith({ subject: 'math', count: 6 });
    });
  });

  it('should reload topics when subject changes', async () => {
    render(<VisualizationAICreator onDone={mockOnDone} />);

    await waitFor(() => {
      expect(screen.getByText('Pythagorean Theorem')).toBeInTheDocument();
    });

    // Click Physics button (by finding the button that contains the text "Physics")
    const physicsButtons = screen.getAllByText('Physics');
    const physicsButton = physicsButtons.find(btn =>
      btn.classList.contains('font-medium') || btn.tagName === 'SPAN'
    );
    fireEvent.click(physicsButton || physicsButtons[0]);

    await waitFor(() => {
      expect(visualizations.suggestTopics).toHaveBeenCalledWith({ subject: 'physics', count: 6 });
    });
    expect(visualizations.suggestTopics).toHaveBeenCalledTimes(2);
  });

  it('should fill prompt when clicking a topic suggestion', async () => {
    render(<VisualizationAICreator onDone={mockOnDone} />);

    await waitFor(() => {
      expect(screen.getByText('Pythagorean Theorem')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Pythagorean Theorem'));

    const textarea = screen.getByPlaceholderText(/describe the visualization/i);
    expect(textarea).toHaveValue('Interactive proof of the Pythagorean theorem');
  });

  it('should show Generate Visualization button disabled when prompt is empty', () => {
    render(<VisualizationAICreator onDone={mockOnDone} />);

    const generateBtn = screen.getByText('Generate Visualization').closest('button');
    expect(generateBtn).toBeDisabled();
  });

  it('should show refresh topics button', async () => {
    render(<VisualizationAICreator onDone={mockOnDone} />);

    await waitFor(() => {
      expect(screen.getByText('Pythagorean Theorem')).toBeInTheDocument();
    });

    const refreshBtn = screen.getByText('Refresh');
    fireEvent.click(refreshBtn);

    expect(visualizations.suggestTopics).toHaveBeenCalled();
  });

  it('should transition to generating step on form submit', async () => {
    render(<VisualizationAICreator onDone={mockOnDone} />);

    await waitFor(() => {
      expect(screen.getByText('Pythagorean Theorem')).toBeInTheDocument();
    });

    const textarea = screen.getByPlaceholderText(/describe the visualization/i);
    fireEvent.change(textarea, { target: { value: 'Test visualization prompt' } });

    const generateBtn = screen.getByText('Generate Visualization').closest('button');
    expect(generateBtn).not.toBeDisabled();

    fireEvent.click(generateBtn!);

    await waitFor(() => {
      expect(screen.getByText('Generating visualization...')).toBeInTheDocument();
    });
  });

  it('should show Subject selector', () => {
    render(<VisualizationAICreator onDone={mockOnDone} />);

    expect(screen.getByText('Subject')).toBeInTheDocument();
  });

  it('should show step indicator', () => {
    render(<VisualizationAICreator onDone={mockOnDone} />);

    expect(screen.getByText('Topic')).toBeInTheDocument();
    expect(screen.getByText('Generate')).toBeInTheDocument();
    expect(screen.getByText('Review')).toBeInTheDocument();
  });

  it('should show difficulty badges on topic cards', async () => {
    render(<VisualizationAICreator onDone={mockOnDone} />);

    await waitFor(() => {
      const difficultyElements = screen.getAllByText(/beginner|intermediate|advanced/);
      expect(difficultyElements.length).toBeGreaterThan(0);
    });
  });

  it('should show Custom Prompt section', () => {
    render(<VisualizationAICreator onDone={mockOnDone} />);

    expect(screen.getByText('Custom Prompt')).toBeInTheDocument();
  });
});
