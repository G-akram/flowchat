import { useMutation } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';

async function markChannelRead(input: { workspaceId: string; channelId: string }): Promise<void> {
  await apiClient.post(`/workspaces/${input.workspaceId}/channels/${input.channelId}/read`);
}

export function useMarkChannelRead(): {
  mutate: (input: { workspaceId: string; channelId: string }) => void;
} {
  const { mutate } = useMutation({
    mutationFn: markChannelRead,
  });

  return { mutate };
}
