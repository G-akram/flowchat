import React, { useReducer, useRef, useEffect } from 'react';

const MIN_SCALE = 1;
const MAX_SCALE = 5;
const ZOOM_STEP = 0.3;

interface ViewerState {
  scale: number;
  offset: { x: number; y: number };
  isDragging: boolean;
  isLoaded: boolean;
}

type ViewerAction =
  | { type: 'ZOOM_AT_CURSOR'; delta: number; cursorX: number; cursorY: number }
  | { type: 'ZOOM_CENTER'; delta: number }
  | { type: 'PAN'; x: number; y: number }
  | { type: 'START_DRAG' }
  | { type: 'STOP_DRAG' }
  | { type: 'RESET' }
  | { type: 'LOADED' };

const INITIAL_STATE: ViewerState = {
  scale: MIN_SCALE,
  offset: { x: 0, y: 0 },
  isDragging: false,
  isLoaded: false,
};

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function applyZoom(
  state: ViewerState,
  delta: number,
  cursorX: number,
  cursorY: number
): ViewerState {
  const nextScale = clamp(state.scale + delta, MIN_SCALE, MAX_SCALE);
  if (nextScale === state.scale) return state;
  if (nextScale <= MIN_SCALE) {
    return { ...state, scale: MIN_SCALE, offset: { x: 0, y: 0 } };
  }
  const ratio = nextScale / state.scale;
  return {
    ...state,
    scale: nextScale,
    offset: {
      x: cursorX * (1 - ratio) + state.offset.x * ratio,
      y: cursorY * (1 - ratio) + state.offset.y * ratio,
    },
  };
}

function viewerReducer(state: ViewerState, action: ViewerAction): ViewerState {
  switch (action.type) {
    case 'ZOOM_AT_CURSOR':
      return applyZoom(state, action.delta, action.cursorX, action.cursorY);
    case 'ZOOM_CENTER':
      return applyZoom(state, action.delta, 0, 0);
    case 'PAN':
      return { ...state, offset: { x: action.x, y: action.y } };
    case 'START_DRAG':
      return { ...state, isDragging: true };
    case 'STOP_DRAG':
      return { ...state, isDragging: false };
    case 'RESET':
      return { ...INITIAL_STATE, isLoaded: state.isLoaded };
    case 'LOADED':
      return { ...state, isLoaded: true };
    default:
      return state;
  }
}

interface MediaViewerImageProps {
  url: string;
  fileName: string;
}

export function MediaViewerImage({ url, fileName }: MediaViewerImageProps): React.JSX.Element {
  const [state, dispatch] = useReducer(viewerReducer, INITIAL_STATE);
  const containerRef = useRef<HTMLDivElement>(null);
  const dragStart = useRef<{ mouseX: number; mouseY: number; ox: number; oy: number } | null>(null);

  // Non-passive wheel listener — required to call preventDefault in modern browsers
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    function onWheel(e: WheelEvent): void {
      e.preventDefault();
      const rect = el!.getBoundingClientRect();
      const cursorX = e.clientX - rect.left - rect.width / 2;
      const cursorY = e.clientY - rect.top - rect.height / 2;
      const delta = e.deltaY < 0 ? ZOOM_STEP : -ZOOM_STEP;
      dispatch({ type: 'ZOOM_AT_CURSOR', delta, cursorX, cursorY });
    }

    el.addEventListener('wheel', onWheel, { passive: false });
    return (): void => el.removeEventListener('wheel', onWheel);
  }, []);

  // Keyboard: +/-/0 (mounted for the lifetime of this component = when viewer is open)
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent): void {
      if (e.key === '+' || e.key === '=') {
        e.preventDefault();
        dispatch({ type: 'ZOOM_CENTER', delta: ZOOM_STEP });
      } else if (e.key === '-') {
        e.preventDefault();
        dispatch({ type: 'ZOOM_CENTER', delta: -ZOOM_STEP });
      } else if (e.key === '0') {
        e.preventDefault();
        dispatch({ type: 'RESET' });
      }
    }
    window.addEventListener('keydown', onKeyDown);
    return (): void => window.removeEventListener('keydown', onKeyDown);
  }, []);

  function handleMouseDown(e: React.MouseEvent): void {
    if (state.scale <= MIN_SCALE) return;
    e.preventDefault();
    dragStart.current = {
      mouseX: e.clientX,
      mouseY: e.clientY,
      ox: state.offset.x,
      oy: state.offset.y,
    };
    dispatch({ type: 'START_DRAG' });
  }

  function handleMouseMove(e: React.MouseEvent): void {
    if (!dragStart.current) return;
    dispatch({
      type: 'PAN',
      x: dragStart.current.ox + (e.clientX - dragStart.current.mouseX),
      y: dragStart.current.oy + (e.clientY - dragStart.current.mouseY),
    });
  }

  function handleMouseUp(): void {
    dragStart.current = null;
    dispatch({ type: 'STOP_DRAG' });
  }

  function handleDoubleClick(): void {
    if (state.scale > MIN_SCALE) {
      dispatch({ type: 'RESET' });
    } else {
      dispatch({ type: 'ZOOM_CENTER', delta: ZOOM_STEP * 3 });
    }
  }

  const cursor = state.scale > MIN_SCALE
    ? (state.isDragging ? 'grabbing' : 'grab')
    : 'zoom-in';

  return (
    <div className="flex h-full flex-col">
      <div
        ref={containerRef}
        className="flex flex-1 select-none items-center justify-center overflow-hidden"
        style={{ cursor }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onDoubleClick={handleDoubleClick}
      >
        {!state.isLoaded && (
          <div className="absolute flex flex-col items-center gap-3">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-white/70" />
          </div>
        )}
        <img
          src={url}
          alt={fileName}
          draggable={false}
          className={`max-h-full max-w-full object-contain ${state.isLoaded ? 'opacity-100' : 'opacity-0'}`}
          style={{
            transform: `translate(${state.offset.x}px, ${state.offset.y}px) scale(${state.scale})`,
            transformOrigin: 'center center',
            transition: state.isDragging ? 'none' : 'transform 0.08s ease-out',
          }}
          onLoad={() => dispatch({ type: 'LOADED' })}
        />
      </div>

      <div className="flex shrink-0 items-center justify-center gap-2 py-3">
        <button
          type="button"
          className="flex h-8 w-8 items-center justify-center rounded border border-white/20 bg-white/5 text-base text-white/60 hover:bg-white/10 hover:text-white disabled:opacity-30"
          onClick={() => dispatch({ type: 'ZOOM_CENTER', delta: -ZOOM_STEP })}
          disabled={state.scale <= MIN_SCALE}
          title="Zoom out (−)"
        >
          −
        </button>
        <button
          type="button"
          className="min-w-[56px] rounded border border-white/20 bg-white/5 px-2 py-1 text-xs text-white/60 hover:bg-white/10 hover:text-white"
          onClick={() => dispatch({ type: 'RESET' })}
          title="Reset zoom (0)"
        >
          {Math.round(state.scale * 100)}%
        </button>
        <button
          type="button"
          className="flex h-8 w-8 items-center justify-center rounded border border-white/20 bg-white/5 text-base text-white/60 hover:bg-white/10 hover:text-white disabled:opacity-30"
          onClick={() => dispatch({ type: 'ZOOM_CENTER', delta: ZOOM_STEP })}
          disabled={state.scale >= MAX_SCALE}
          title="Zoom in (+)"
        >
          +
        </button>
      </div>
    </div>
  );
}
