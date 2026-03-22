import { useEffect } from 'react';

const BASE_TITLE = 'FlowChat';

export function usePageTitle(subtitle?: string | undefined): void {
  useEffect(() => {
    document.title = subtitle ? `${subtitle} - ${BASE_TITLE}` : BASE_TITLE;

    return () => {
      document.title = BASE_TITLE;
    };
  }, [subtitle]);
}
