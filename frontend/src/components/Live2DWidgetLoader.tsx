'use client';

import dynamic from 'next/dynamic';

const Live2DWidget = dynamic(() => import('./Live2DWidget'), {
  ssr: false,
});

export default function Live2DWidgetLoader() {
  return <Live2DWidget />;
}
