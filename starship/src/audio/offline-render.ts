import { CONFIG } from '../config';
import type { Engine } from '../engine';
import { AudioGraph, audioStateAt } from './graph';

/**
 * Offline soundtrack (record mode): the same AudioGraph in an OfflineAudioContext (48 kHz), automation
 * scheduled every 1/60 s of cinematic time from the same state function the live engine uses, one-shots
 * at the sample-accurate crossing times. Returns a 32-bit float WAV, base64 encoded (ffmpeg encodes AAC).
 */
export async function renderOfflineWav(engine: Engine, start: number, end: number): Promise<string> {
  const sr = CONFIG.audio.sampleRate;
  const dur = Math.max(0.1, end - start);
  const ctx = new OfflineAudioContext(2, Math.ceil(dur * sr), sr);
  const graph = new AudioGraph(ctx, engine, dur);
  let prev: string | null = null;
  const step = 1 / 60;
  for (let c = start; c <= end + 1e-6; c += step) {
    const s = audioStateAt(engine, Math.min(c, engine.shots.duration), prev);
    prev = s.shotId;
    graph.apply(s, Math.max(0, c - start), true);
  }
  const buf = await ctx.startRendering();
  return encodeWavBase64(buf);
}

export function encodeWavBase64(buf: AudioBuffer): string {
  const ch = buf.numberOfChannels;
  const n = buf.length;
  // 24-bit PCM (ffmpeg re-encodes to AAC 320k)
  const bps = 3;
  const bytes = 44 + n * ch * bps;
  const out = new DataView(new ArrayBuffer(bytes));
  const w = (o: number, s: string) => { for (let i = 0; i < s.length; i++) out.setUint8(o + i, s.charCodeAt(i)); };
  w(0, 'RIFF'); out.setUint32(4, bytes - 8, true); w(8, 'WAVE'); w(12, 'fmt ');
  out.setUint32(16, 16, true); out.setUint16(20, 1, true); out.setUint16(22, ch, true);
  out.setUint32(24, buf.sampleRate, true); out.setUint32(28, buf.sampleRate * ch * bps, true);
  out.setUint16(32, ch * bps, true); out.setUint16(34, 24, true); w(36, 'data'); out.setUint32(40, n * ch * bps, true);
  const data = [...Array(ch).keys()].map((c) => buf.getChannelData(c));
  let o = 44;
  for (let i = 0; i < n; i++) {
    for (let c = 0; c < ch; c++) {
      const v = Math.max(-1, Math.min(1, data[c][i])) * 8388607;
      const x = Math.round(v) & 0xffffff;
      out.setUint8(o, x & 0xff); out.setUint8(o + 1, (x >> 8) & 0xff); out.setUint8(o + 2, (x >> 16) & 0xff);
      o += 3;
    }
  }
  const u8 = new Uint8Array(out.buffer);
  let s = '';
  const chunk = 0x8000;
  for (let i = 0; i < u8.length; i += chunk) s += String.fromCharCode(...u8.subarray(i, i + chunk));
  return btoa(s);
}
