declare module '*.glsl' {
  const src: string;
  export default src;
}
interface Window {
  __step?: (dt: number) => Promise<void>;
  __ready?: boolean;
  __engine?: unknown;
  __seekCin?: (t: number) => Promise<void>;
  __renderAt?: (opts: { cin?: number; mission?: number; camera?: unknown; warm?: number }) => Promise<void>;
  __capture?: () => Promise<string>;
  __renderAudio?: (start: number, end: number) => Promise<string>;
  __info?: () => unknown;
  __errors?: string[];
}
