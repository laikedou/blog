import type { WidgetOptions } from 'l2d-widget';

export const DEFAULT_MODEL_URL = 'https://model.hacxy.cn/cat-black/model.json';

export const WIDGET_SIZE = 260;

export const PRIMARY_COLOR = 'rgba(96,165,250,0.9)';

export function buildWidgetOptions(
  tipsMessages: string[],
  welcomeMessages: string[],
): WidgetOptions {
  return {
    model: {
      path: DEFAULT_MODEL_URL,
      scale: 1,
      tips: {
        messages: tipsMessages,
        welcomeMessage: welcomeMessages,
        duration: 3500,
        interval: 5000,
        typing: {
          speed: 100,
          minValue: 0.5,
          maxValue: 1,
        },
      },
    },
    position: 'bottom-left',
    size: WIDGET_SIZE,
    primaryColor: PRIMARY_COLOR,
    transitionDuration: 1200,
    transitionType: 'slide',
  };
}

export const EXCLUDED_PATHS = ['/admin', '/embed'];

export function isExcludedPath(pathname: string): boolean {
  return EXCLUDED_PATHS.some((p) => pathname.startsWith(p));
}
