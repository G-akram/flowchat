import { toast } from 'sonner';

let audioContext: AudioContext | null = null;

function getAudioContext(): AudioContext {
  if (!audioContext) {
    audioContext = new AudioContext();
  }
  return audioContext;
}

function playSound(frequency: number, duration: number, volume: number = 0.3): void {
  try {
    const ctx = getAudioContext();

    if (ctx.state === 'suspended') {
      void ctx.resume();
    }

    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(frequency, ctx.currentTime);

    gainNode.gain.setValueAtTime(volume, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);

    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + duration);
  } catch {
    // Audio not supported — fail silently
  }
}

function playNotificationSound(): void {
  playSound(880, 0.15, 0.25);
  setTimeout(() => playSound(1100, 0.12, 0.2), 120);
}

function playWarningSound(): void {
  playSound(440, 0.2, 0.2);
  setTimeout(() => playSound(350, 0.25, 0.15), 180);
}

export function notifyChannelAdded(channelName: string): void {
  playNotificationSound();
  toast('Added to channel', {
    description: `You were added to #${channelName}`,
    duration: 5000,
  });
}

export function notifyChannelRemoved(channelName: string): void {
  playWarningSound();
  toast('Removed from channel', {
    description: `You were removed from #${channelName}`,
    duration: 5000,
  });
}

export function notifyWorkspaceAdded(workspaceName: string): void {
  playNotificationSound();
  toast('Added to workspace', {
    description: `You were added to ${workspaceName}`,
    duration: 5000,
  });
}

export function notifyWorkspaceRemoved(workspaceName: string): void {
  playWarningSound();
  toast('Removed from workspace', {
    description: `You were removed from ${workspaceName}`,
    duration: 6000,
  });
}
