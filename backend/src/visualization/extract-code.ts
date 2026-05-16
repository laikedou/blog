export function extractHtmlCode(text: string): string {
  const match = text.match(/```(?:html|jsx?|javascript)?\s*([\s\S]*?)```/);
  if (match) return match[1].trim();
  const divMatch = text.match(/(<div\s+class="viz-root"[\s\S]*<\/div>)/);
  if (divMatch) return divMatch[1].trim();
  return text.trim();
}
