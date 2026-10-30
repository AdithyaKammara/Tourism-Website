import { useEffect, useRef, useState } from 'react';
import { ArrowRight, ChevronDown, Mic, Search } from 'lucide-react';
import { VIBE_LABELS, type Vibe } from '../../lib/destinations';

// The Web Speech API is still prefixed in Chromium and missing in Firefox, so it's typed loosely here.
type Recognition = {
  lang: string;
  interimResults: boolean;
  start: () => void;
  stop: () => void;
  onresult: ((e: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
  onend: (() => void) | null;
  onerror: (() => void) | null;
};
type RecognitionCtor = new () => Recognition;

/** The pill-shaped search bar that overlaps the bottom of the home hero. */
export default function HeroSearch() {
  const [query, setQuery] = useState('');
  const [vibe, setVibe] = useState<Vibe | ''>('');
  const [listening, setListening] = useState(false);
  const [speech, setSpeech] = useState<RecognitionCtor | null>(null);
  const recognition = useRef<Recognition | null>(null);

  useEffect(() => {
    const w = window as unknown as { SpeechRecognition?: RecognitionCtor; webkitSpeechRecognition?: RecognitionCtor };
    setSpeech(() => w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null);
  }, []);

  function toggleVoice() {
    if (!speech) return;
    if (listening) return recognition.current?.stop();
    const r = new speech();
    r.lang = 'en-IN';
    r.interimResults = true;
    r.onresult = (e) => setQuery(Array.from(e.results, (res) => res[0].transcript).join(''));
    r.onend = () => setListening(false);
    r.onerror = () => setListening(false);
    recognition.current = r;
    setListening(true);
    r.start();
  }

  return (
    <form
      action="/destinations"
      role="search"
      className="flex items-center gap-2 rounded-full bg-card p-2 pl-5 text-ink shadow-soft ring-1 ring-line"
      onSubmit={(e) => {
        e.preventDefault();
        const params = new URLSearchParams();
        if (query.trim()) params.set('q', query.trim());
        if (vibe) params.set('vibe', vibe);
        window.location.assign(`/destinations${params.size ? `?${params}` : ''}`);
      }}
    >
      <Search className="size-5 shrink-0 text-ink-soft" aria-hidden="true" />
      <label htmlFor="hero-search" className="sr-only">
        Search destinations
      </label>
      <input
        id="hero-search"
        name="q"
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search for your next trip"
        className="min-w-0 flex-1 bg-transparent py-2 text-sm placeholder:text-ink-soft/80 focus:outline-none sm:text-base"
      />
      {speech && (
        <button
          type="button"
          onClick={toggleVoice}
          aria-pressed={listening}
          aria-label={listening ? 'Stop voice search' : 'Search by voice'}
          className="grid size-9 shrink-0 place-items-center rounded-full text-ink-soft transition-colors hover:bg-paper-deep aria-pressed:bg-accent aria-pressed:text-accent-ink"
        >
          <Mic className="size-4" aria-hidden="true" />
        </button>
      )}
      <div className="relative hidden shrink-0 sm:block">
        <label htmlFor="hero-vibe" className="sr-only">
          Type of trip
        </label>
        <select
          id="hero-vibe"
          name="vibe"
          value={vibe}
          onChange={(e) => setVibe(e.target.value as Vibe | '')}
          className="appearance-none rounded-full border border-ink/20 bg-transparent py-2 pr-9 pl-4 text-sm font-medium hover:border-ink focus:border-ink focus:outline-none"
        >
          <option value="">All trips</option>
          {(Object.keys(VIBE_LABELS) as Vibe[]).map((v) => (
            <option key={v} value={v}>
              {VIBE_LABELS[v]}
            </option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2" aria-hidden="true" />
      </div>
      <button type="submit" aria-label="Search" className="grid size-10 shrink-0 place-items-center rounded-full bg-accent text-accent-ink transition-colors hover:bg-moss">
        <ArrowRight className="size-4" aria-hidden="true" />
      </button>
    </form>
  );
}
