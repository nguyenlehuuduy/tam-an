// Thiết kế âm thanh trị liệu bằng hợp âm rải (Arpeggio Synth) — spec mục A10 nâng cấp
// Dùng Web Audio API tổng hợp âm thanh nhẹ nhàng trực tiếp không cần asset ngoài.

let ctx: AudioContext | null = null;

function getContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return null;
    ctx = new AudioCtx();
  }
  if (ctx.state === "suspended") {
    ctx.resume();
  }
  return ctx;
}

// Chơi một nốt nhạc đơn với âm sắc ấm, ngân dài và suy hao cấp số mũ (exponential decay)
function playTone(freq: number, startTime: number, duration: number, volume = 0.04, type: OscillatorType = "sine") {
  const audio = getContext();
  if (!audio) return;

  const osc = audio.createOscillator();
  const gain = audio.createGain();
  
  // Thêm bộ lọc tần số thấp (lowpass filter) để âm thanh ấm áp, bớt chói
  const filter = audio.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.setValueAtTime(1000, startTime);
  filter.frequency.exponentialRampToValueAtTime(300, startTime + duration);

  osc.type = type;
  osc.frequency.setValueAtTime(freq, startTime);

  // Envelope âm lượng
  gain.gain.setValueAtTime(0.0001, startTime);
  gain.gain.linearRampToValueAtTime(volume, startTime + 0.05); // attack 50ms
  gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration); // decay/release

  osc.connect(filter);
  filter.connect(gain);
  gain.connect(audio.destination);

  osc.start(startTime);
  osc.stop(startTime + duration + 0.05);
}

// Chơi một hợp âm rải (arpeggio) thư giãn dựa trên mức tâm trạng
function playMoodArpeggio(mood: number | null, isStar: boolean) {
  const audio = getContext();
  if (!audio) return;

  const now = audio.currentTime;
  const moodVal = mood ?? 5; // Mặc định là trung bình

  // Định nghĩa danh sách tần số nốt nhạc:
  // Mood nặng (1-5): Hợp âm Thứ ngân ấm, trầm lắng giúp xoa dịu (C minor 7 hoặc A minor 7)
  // Mood nhẹ (6-10): Hợp âm Trưởng thanh thoát, rạng rỡ (F major 7 hoặc C major 9)
  let frequencies: number[] = [];
  if (moodVal <= 5) {
    // A minor 7 / Pentatonic minor: A3 (220), C4 (261.63), E4 (329.63), G4 (392.00), C5 (523.25)
    frequencies = isStar 
      ? [220, 261.63, 329.63, 392.00] 
      : [164.81, 220, 261.63, 329.63]; // Bong bóng trầm hơn chút
  } else {
    // C major 9 / Pentatonic major: C4 (261.63), E4 (329.63), G4 (392.00), B4 (493.88), D5 (587.33)
    frequencies = isStar 
      ? [261.63, 329.63, 392.00, 493.88, 587.33] 
      : [196.00, 261.63, 329.63, 392.00];
  }

  // Rải các nốt cách nhau 120ms
  frequencies.forEach((freq, index) => {
    const noteStart = now + index * 0.12;
    const duration = isStar ? 1.8 - index * 0.2 : 1.4 - index * 0.15;
    const vol = isStar ? 0.045 : 0.055;
    playTone(freq, noteStart, duration, vol, "sine");
    
    // Thêm một âm chớp nhẹ (sparkle) phụ họa tần số rất cao bằng sóng tam giác cho các nốt cao của Bầu trời
    if (isStar && index >= frequencies.length - 2) {
      playTone(freq * 2, noteStart, 0.5, 0.015, "triangle");
    }
  });
}

// Chuông rải ngân dài khi thả sao lên bầu trời
export function playReleaseStar(mood: number | null) {
  playMoodArpeggio(mood, true);
}

// Giọt nước trầm rải khi thả bong bóng xuống đại dương
export function playReleaseBubble(mood: number | null) {
  playMoodArpeggio(mood, false);
}

// Tiếng lấp lánh nhẹ nhàng khi gửi tia sáng ấm áp
export function playSendReaction() {
  const audio = getContext();
  if (!audio) return;
  const now = audio.currentTime;
  // Hợp âm rải cực nhanh nốt cao: G5 (783.99) -> B5 (987.77) -> D6 (1174.66)
  playTone(783.99, now, 0.4, 0.02, "sine");
  playTone(987.77, now + 0.08, 0.4, 0.02, "sine");
  playTone(1174.66, now + 0.16, 0.5, 0.025, "triangle");
}

// Tiếng chạm khẽ, ấm khi mở xem tín hiệu
export function playOpenSignal() {
  const audio = getContext();
  if (!audio) return;
  const now = audio.currentTime;
  // Một nốt ấm áp trung bình E4 (329.63) rải rất khẽ
  playTone(329.63, now, 0.5, 0.035, "sine");
  playTone(493.88, now + 0.05, 0.3, 0.015, "sine");
}

// =====================================================
// ÂM THANH NỀN (AMBIENT LOOP) — gió xa cho Sky, sóng vỗ nhẹ cho Ocean.
// Trước đây /explore hoàn toàn im lặng trừ lúc có hành động cụ thể (mở
// signal, gửi tia sáng...) — một không gian chữa lành thật sự nên có một
// lớp âm thanh nền cực khẽ, liên tục, để cảm giác "có sự sống" thay vì
// một khoảng trống vô thanh. Dùng noise qua bộ lọc + LFO biến điệu cực
// chậm (không cần file âm thanh ngoài, giống các hiệu ứng khác trong file
// này) — âm lượng rất thấp (0.02-0.025), không được lấn át giọng nói hay
// các hiệu ứng tương tác khác.
// =====================================================
let ambientNoiseSource: AudioBufferSourceNode | null = null;
let ambientFilter: BiquadFilterNode | null = null;
let ambientLFO: OscillatorNode | null = null;
let ambientGain: GainNode | null = null;
let ambientActive: "sky" | "ocean" | null = null;

function makeNoiseBuffer(audio: AudioContext): AudioBuffer {
  const bufferSize = audio.sampleRate * 2;
  const buffer = audio.createBuffer(1, bufferSize, audio.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
  return buffer;
}

/** Bắt đầu (hoặc chuyển đổi) âm thanh nền theo không gian hiện tại. Gọi lại
 * an toàn nhiều lần — tự bỏ qua nếu đã đang phát đúng loại rồi. */
export function startAmbient(kind: "sky" | "ocean") {
  const audio = getContext();
  if (!audio) return;
  if (ambientActive === kind) return;
  stopAmbient();

  const gain = audio.createGain();
  gain.gain.setValueAtTime(0.0001, audio.currentTime);
  gain.gain.linearRampToValueAtTime(kind === "sky" ? 0.018 : 0.022, audio.currentTime + 1.8);
  gain.connect(audio.destination);

  const noise = audio.createBufferSource();
  noise.buffer = makeNoiseBuffer(audio);
  noise.loop = true;

  const filter = audio.createBiquadFilter();
  const lfo = audio.createOscillator();
  const lfoGain = audio.createGain();

  if (kind === "sky") {
    // Gió xa — lowpass mở/khép rất chậm, gợi cảm giác trống trải ấm áp.
    filter.type = "lowpass";
    filter.frequency.value = 380;
    filter.Q.value = 0.6;
    lfo.frequency.value = 0.06;
    lfoGain.gain.value = 140;
  } else {
    // Sóng vỗ nhẹ — bandpass trầm hơn, biến điệu như nhịp thở của biển.
    filter.type = "bandpass";
    filter.frequency.value = 220;
    filter.Q.value = 0.9;
    lfo.frequency.value = 0.045;
    lfoGain.gain.value = 90;
  }

  lfo.connect(lfoGain);
  lfoGain.connect(filter.frequency);
  lfo.start();

  noise.connect(filter);
  filter.connect(gain);
  noise.start();

  ambientNoiseSource = noise;
  ambientFilter = filter;
  ambientLFO = lfo;
  ambientGain = gain;
  ambientActive = kind;
}

/** Tắt âm thanh nền (fade-out mềm, không cắt đột ngột) — an toàn khi gọi
 * kể cả lúc chưa có gì đang phát. */
export function stopAmbient() {
  if (ambientGain && ctx) {
    try {
      const now = ctx.currentTime;
      ambientGain.gain.cancelScheduledValues(now);
      ambientGain.gain.setValueAtTime(ambientGain.gain.value, now);
      ambientGain.gain.linearRampToValueAtTime(0.0001, now + 0.8);
    } catch {
      // ignore
    }
  }
  const stopAt = (ctx?.currentTime ?? 0) + 0.9;
  [ambientNoiseSource, ambientLFO].forEach((node) => {
    if (!node) return;
    try {
      node.stop(stopAt);
    } catch {
      // ignore — node có thể đã dừng sẵn
    }
  });
  ambientNoiseSource = null;
  ambientFilter = null;
  ambientLFO = null;
  ambientGain = null;
  ambientActive = null;
}
