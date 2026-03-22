import { useEffect } from 'react';

const BASE_TITLE = 'FlowChat';

export function usePageTitle(subtitle?: string): void {
  useEffect(() => {
    document.title = subtitle ? `${subtitle} - ${BASE_TITLE}` : BASE_TITLE;

    return (): void => {
      document.title = BASE_TITLE;
    };
  }, [subtitle]);
}
