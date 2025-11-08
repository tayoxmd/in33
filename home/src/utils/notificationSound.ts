// Notification sound utility for new bookings
let audioContext: AudioContext | null = null;

export const playNotificationSound = () => {
  try {
    if (!audioContext) {
      audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    }

    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    // Create a pleasant notification sound (3 tones)
    const tones = [
      { frequency: 800, duration: 0.1 },
      { frequency: 1000, duration: 0.1 },
      { frequency: 1200, duration: 0.15 }
    ];

    let currentTime = audioContext.currentTime;

    tones.forEach((tone, index) => {
      const osc = audioContext!.createOscillator();
      const gain = audioContext!.createGain();
      
      osc.connect(gain);
      gain.connect(audioContext!.destination);
      
      osc.frequency.value = tone.frequency;
      osc.type = 'sine';
      
      gain.gain.setValueAtTime(0.3, currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, currentTime + tone.duration);
      
      osc.start(currentTime);
      osc.stop(currentTime + tone.duration);
      
      currentTime += tone.duration + 0.05;
    });

  } catch (error) {
    console.error('Error playing notification sound:', error);
  }
};
