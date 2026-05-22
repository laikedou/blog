import showdown from 'showdown';

export const converter = new showdown.Converter({
  noHeaderId: true,
  strikethrough: true,
  tables: true,
  tasklists: true,
  simpleLineBreaks: true,
});
