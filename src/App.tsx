import { useEffect, useMemo, useState } from 'react';
import {
  RotateCcw,
  Undo2,
  Lightbulb,
  Volume2,
  VolumeX,
  Trophy,
  Sparkles,
  Droplets,
  Pause,
  Play,
  ChevronRight,
} from 'lucide-react';

const PALETTE = [
  { id: 'coral', hex: '#ff5c70' },
  { id: 'aqua', hex: '#32d6cf' },
  { id: 'sun', hex: '#ffc247' },
  { id: 'violet', hex: '#a88aff' },
  { id: 'lime', hex: '#b5e85c' },
  { id: 'blue', hex: '#5b9cff' },
  { id: 'pink', hex: '#ff83c5' },
  { id: 'orange', hex: '#ff9852' },
];

function makeLevel(level: number) {
  const colorCount = Math.min(4 + Math.floor((level - 1) / 3), 8);
  const colors = PALETTE.slice(0, colorCount).map(c => c.id);
  const beads = colors.flatMap(color => Array(4).fill(color));
  for (let i = beads.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [beads[i], beads[j]] = [beads[j], beads[i]];
  }
  const tubes = [];
  for (let i = 0; i < colorCount + 2; i += 1) {
    tubes.push(beads.slice(i * 4, (i + 1) * 4));
  }
  return tubes;
}

function isWon(tubes: string[][]) {
  return tubes.every(
    tube =>
      tube.length === 0 || (tube.length === 4 && tube.every(c => c === tube[0]))
  );
}

function colorHex(id: string) {
  return PALETTE.find(c => c.id === id)?.hex || '#ffffff';
}

export default function App() {
  const [level, setLevel] = useState(() =>
    Number(localStorage.getItem('rang-level') || 1)
  );
  const [tubes, setTubes] = useState<string[][]>(() =>
    makeLevel(Number(localStorage.getItem('rang-level') || 1))
  );
  const [selected, setSelected] = useState<number | null>(null);
  const [history, setHistory] = useState<string[][][]>([]);
  const [moves, setMoves] = useState(0);
  const [hint, setHint] = useState('');
  const [won, setWon] = useState(false);
  const [sound, setSound] = useState(true);
  const [paused, setPaused] = useState(false);
  const [best, setBest] = useState(() =>
    Number(localStorage.getItem('rang-best') || 0)
  );

  useEffect(() => {
    localStorage.setItem('rang-level', String(level));
  }, [level]);
  useEffect(() => {
    if (isWon(tubes) && moves > 0) {
      setWon(true);
      const nextBest = best === 0 ? level : Math.max(best, level);
      setBest(nextBest);
      localStorage.setItem('rang-best', String(nextBest));
    }
  }, [tubes, moves]);

  const colorCount = Math.min(4 + Math.floor((level - 1) / 3), 8);
  const progress = useMemo(
    () =>
      tubes.reduce(
        (sum, tube) =>
          sum + (tube.length === 4 && tube.every(c => c === tube[0]) ? 1 : 0),
        0
      ),
    [tubes]
  );

  function resetLevel() {
    setTubes(makeLevel(level));
    setSelected(null);
    setHistory([]);
    setMoves(0);
    setHint('');
    setWon(false);
    setPaused(false);
  }

  function pour(from: number, to: number) {
    if (from === to) {
      setSelected(null);
      return;
    }
    const source = tubes[from];
    const target = tubes[to];
    if (!source.length || target.length === 4) return false;
    const top = source[source.length - 1];
    if (target.length && target[target.length - 1] !== top) return false;
    const next = tubes.map(tube => [...tube]);
    let count = 0;
    while (
      next[from].length &&
      next[from][next[from].length - 1] === top &&
      next[to].length < 4
    ) {
      next[to].push(next[from].pop() as string);
      count += 1;
    }
    if (!count) return false;
    setHistory(old => [...old, tubes.map(tube => [...tube])]);
    setTubes(next);
    setMoves(n => n + 1);
    setSelected(null);
    setHint('');
    return true;
  }

  function tapTube(index: number) {
    if (won || paused) return;
    setHint('');
    if (selected === null) {
      if (tubes[index].length) setSelected(index);
      return;
    }
    if (selected === index) {
      setSelected(null);
      return;
    }
    const didPour = pour(selected, index);
    if (!didPour) {
      if (tubes[index].length) setSelected(index);
      else setHint('Is tube mein abhi pour nahi ho sakta.');
    }
  }

  function showHint() {
    for (let i = 0; i < tubes.length; i += 1) {
      if (!tubes[i].length) continue;
      const top = tubes[i][tubes[i].length - 1];
      for (let j = 0; j < tubes.length; j += 1) {
        if (
          i !== j &&
          tubes[j].length < 4 &&
          (!tubes[j].length || tubes[j][tubes[j].length - 1] === top)
        ) {
          setSelected(i);
          setHint(
            'Tube ' + (i + 1) + ' se Tube ' + (j + 1) + ' mein pour karo.'
          );
          return;
        }
      }
    }
    setHint('Shandaar! Koi obvious move nahi mila. Undo ya restart try karo.');
  }

  function undo() {
    if (!history.length) return;
    setTubes(history[history.length - 1].map(tube => [...tube]));
    setHistory(old => old.slice(0, -1));
    setMoves(n => Math.max(0, n - 1));
    setSelected(null);
    setWon(false);
    setHint('');
  }

  function nextLevel() {
    const next = level + 1;
    setLevel(next);
    setTubes(makeLevel(next));
    setHistory([]);
    setMoves(0);
    setSelected(null);
    setWon(false);
    setHint('');
  }

  return (
    <main className="game-shell">
      <div className="ambient ambient-one" />
      <div className="ambient ambient-two" />
      <header className="topbar">
        <div className="brand">
          <div className="brand-mark">
            <Droplets size={22} />          </div>
          <div>
            <span className="brand-name">RANG</span>
            <span className="brand-sub">FLOW LAB</span>
          </div>
        </div>
        <div className="top-actions">
          <div className="best-pill">
            <Trophy size={15} /> BEST {best || '—'}
          </div>
          <button
            className="icon-btn"
            aria-label="Toggle sound"
            onClick={() => setSound(!sound)}
          >
            {sound ? <Volume2 /> : <VolumeX />}
          </button>
          <button
            className="icon-btn"
            aria-label="Pause game"
            onClick={() => setPaused(!paused)}
          >
            {paused ? <Play /> : <Pause />}
          </button>
        </div>
      </header>

      <section className="hero">
        <div className="eyebrow">
          <Sparkles size={13} /> THE COLOURFUL BRAIN BREAK
        </div>
        <h1>
          Sort the flow.
          <br />
          <em>Find your calm.</em>
        </h1>
        <p>Ek rang, ek tube. Sabko sahi jagah pahunchao.</p>
      </section>

      <section className="level-strip">
        <div>
          <span className="muted-label">CURRENT CHALLENGE</span>
          <strong>LEVEL {String(level).padStart(2, '0')}</strong>
        </div>
        <div className="level-progress">
          <div className="progress-copy">
            <span>COLOUR SETS</span>
            <b>
              {progress}/{colorCount}
            </b>
          </div>
          <div className="progress-track">
            <div style={{ width: (progress / colorCount) * 100 + '%' }} />
          </div>
        </div>
        <div className="move-count">
          <span className="muted-label">MOVES</span>
          <strong>{moves}</strong>
        </div>
      </section>

      <section className="play-area">
        <div className="play-caption">
          <span>✦ TAP A TUBE, THEN ANOTHER</span>
          <span className="capacity">4 LAYERS / TUBE</span>
        </div>
        <div
          className="tube-grid"
          style={{ '--tube-count': tubes.length } as React.CSSProperties}
        >
          {tubes.map((tube, index) => (
            <button
              key={index}
              className={
                'tube-button ' +
                (selected === index ? 'selected' : '') +
                (tube.length === 4 && tube.every(c => c === tube[0])
                  ? ' completed'
                  : '')
              }
              onClick={() => tapTube(index)}
              aria-label={
                'Tube ' + (index + 1) + ', ' + tube.length + ' layers'
              }
            >
              <span className="tube-number">
                {String(index + 1).padStart(2, '0')}
              </span>
              <span className="glass-tube">
                <span className="glass-shine" />
                {Array.from({ length: 4 }, (_, slot) => {
                  const color = tube[slot];
                  return (
                    <span
                      key={slot}
                      className={'liquid-layer ' + (color ? 'filled' : 'empty')}
                      style={
                        color
                          ? {
                              background:
                                'linear-gradient(105deg, ' +
                                colorHex(color) +
                                ' 0%, ' +
                                colorHex(color) +
                                ' 55%, rgba(255,255,255,.32) 100%)',
                              boxShadow:
                                'inset 0 2px 4px rgba(255,255,255,.35), 0 0 12px ' +
                                colorHex(color) +
                                '55',
                            }
                          : undefined
                      }
                    />
                  );
                })}
                <span className="tube-base" />
              </span>
              {selected === index && (
                <span className="select-label">SELECTED</span>
              )}
              {tube.length === 4 && tube.every(c => c === tube[0]) && (
                <span className="done-dot">✓</span>
              )}
            </button>
          ))}
        </div>
        {hint && (
          <div className="hint-message">
            <Lightbulb size={16} /> {hint}
          </div>
        )}
      </section>

      <section className="controls">
        <button className="tool-btn" onClick={undo} disabled={!history.length}>
          <Undo2 />
          <span>UNDO</span>
        </button>
        <button className="tool-btn hint-tool" onClick={showHint}>
          <Lightbulb />
          <span>HINT</span>
        </button>
        <button className="tool-btn" onClick={resetLevel}>
          <RotateCcw />
          <span>RESTART</span>
        </button>
      </section>
      <footer className="footer-note">
        <span>✦</span> Match all four layers to complete a colour <span>✦</span>
      </footer>

      {(won || paused) && (
        <div className="overlay">
          <div className="modal-card">
            <div className="modal-orb">
              {won ? <Trophy size={34} /> : <Pause size={32} />}
            </div>
            <span className="eyebrow">
              {won ? 'LEVEL COMPLETE' : 'TAKE A BREATHER'}
            </span>
            <h2>{won ? 'Flow state!' : 'Game paused'}</h2>
            <p>
              {won
                ? 'All colours are sorted. You made it look easy.'
                : 'Your tubes are waiting right where you left them.'}
            </p>
            {won ? (
              <button className="primary-btn" onClick={nextLevel}>
                NEXT LEVEL <ChevronRight size={18} />
              </button>
            ) : (
              <button className="primary-btn" onClick={() => setPaused(false)}>
                RESUME GAME <Play size={16} />
              </button>
            )}
            {won && (
              <button className="text-btn" onClick={resetLevel}>
                Replay this level
              </button>
            )}
          </div>
        </div>
      )}
    </main>
  );
}
