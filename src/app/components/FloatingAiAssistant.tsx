import React, { useEffect, useRef, useState } from 'react';
import { Send, X } from 'lucide-react';

const LOGO_SRC = '/figma-homepage/assistant/ai-lotus-logo-button.png';
const POSITION_KEY = 'hcminvhub-floating-ai-position-v2';
const BUTTON_SIZE = 144;
const EDGE_PADDING = 16;

type Position = {
  x: number;
  y: number;
};

type ChatMessage = {
  id: string;
  role: 'assistant' | 'user';
  text: string;
};

function getDefaultPosition(): Position {
  if (typeof window === 'undefined') {
    return { x: 24, y: 320 };
  }

  return {
    x: Math.max(EDGE_PADDING, window.innerWidth - BUTTON_SIZE - 24),
    y: Math.max(EDGE_PADDING, window.innerHeight - BUTTON_SIZE - 24),
  };
}

function clampPosition(position: Position): Position {
  if (typeof window === 'undefined') {
    return position;
  }

  return {
    x: Math.min(Math.max(EDGE_PADDING, position.x), window.innerWidth - BUTTON_SIZE - EDGE_PADDING),
    y: Math.min(Math.max(EDGE_PADDING, position.y), window.innerHeight - BUTTON_SIZE - EDGE_PADDING),
  };
}

function readStoredPosition(): Position {
  if (typeof window === 'undefined') {
    return getDefaultPosition();
  }

  try {
    const parsed = JSON.parse(window.localStorage.getItem(POSITION_KEY) ?? '');
    if (typeof parsed?.x === 'number' && typeof parsed?.y === 'number') {
      return clampPosition(parsed);
    }
  } catch {
    // Ignore stale localStorage values and fall back to the default anchor.
  }

  return getDefaultPosition();
}

export function FloatingAiAssistant() {
  const [position, setPosition] = useState<Position>(() => readStoredPosition());
  const [isOpen, setIsOpen] = useState(false);
  const [draft, setDraft] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      text: 'Hi, I can help you explore projects, explain investment requirements, and find the right next action.',
    },
  ]);
  const dragRef = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    originX: number;
    originY: number;
    hasMoved: boolean;
  } | null>(null);

  useEffect(() => {
    const handleResize = () => {
      setPosition((current) => {
        const next = clampPosition(current);
        window.localStorage.setItem(POSITION_KEY, JSON.stringify(next));
        return next;
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handlePointerDown = (event: React.PointerEvent<HTMLButtonElement>) => {
    event.currentTarget.setPointerCapture(event.pointerId);
    dragRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      originX: position.x,
      originY: position.y,
      hasMoved: false,
    };
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLButtonElement>) => {
    const dragState = dragRef.current;
    if (!dragState || dragState.pointerId !== event.pointerId) return;

    const deltaX = event.clientX - dragState.startX;
    const deltaY = event.clientY - dragState.startY;
    if (Math.abs(deltaX) > 4 || Math.abs(deltaY) > 4) {
      dragState.hasMoved = true;
    }

    setPosition(clampPosition({ x: dragState.originX + deltaX, y: dragState.originY + deltaY }));
  };

  const handlePointerUp = (event: React.PointerEvent<HTMLButtonElement>) => {
    const dragState = dragRef.current;
    if (!dragState || dragState.pointerId !== event.pointerId) return;

    const finalPosition = clampPosition({
      x: dragState.originX + event.clientX - dragState.startX,
      y: dragState.originY + event.clientY - dragState.startY,
    });
    setPosition(finalPosition);
    window.localStorage.setItem(POSITION_KEY, JSON.stringify(finalPosition));
    dragRef.current = null;

    if (!dragState.hasMoved) {
      setIsOpen((current) => !current);
    }
  };

  const handleSend = () => {
    const text = draft.trim();
    if (!text) return;

    setMessages((current) => [
      ...current,
      { id: `user-${Date.now()}`, role: 'user', text },
      {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        text: 'Thanks. In this demo, I will route your question to the investment support assistant.',
      },
    ]);
    setDraft('');
  };

  const panelLeft = position.x > window.innerWidth / 2 ? Math.max(EDGE_PADDING, position.x - 340) : position.x;
  const panelTop = Math.min(Math.max(EDGE_PADDING, position.y - 316), window.innerHeight - 388);

  return (
    <div className="fixed z-[9999]" style={{ left: position.x, top: position.y }}>
      {isOpen && (
        <div
          className="fixed flex h-[372px] w-[320px] flex-col overflow-hidden rounded-lg border border-slate-200 bg-white shadow-2xl"
          style={{ left: panelLeft, top: panelTop }}
        >
          <div className="flex items-center justify-between border-b border-slate-100 bg-slate-950 px-4 py-3 text-white">
            <div className="flex items-center gap-3">
              <img src={LOGO_SRC} alt="" className="h-9 w-9 rounded-full object-cover" />
              <div>
                <div className="text-sm font-semibold leading-5">HIH AI Assistant</div>
                <div className="text-xs text-sky-100">Online</div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="flex h-8 w-8 items-center justify-center rounded-full text-white hover:bg-white/10"
              aria-label="Close AI assistant"
            >
              <X size={16} />
            </button>
          </div>

          <div className="flex-1 space-y-3 overflow-y-auto bg-slate-50 px-4 py-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`max-w-[88%] rounded-lg px-3 py-2 text-sm leading-5 ${
                  message.role === 'user'
                    ? 'ml-auto bg-[#ed6203] text-white'
                    : 'bg-white text-slate-700 shadow-sm'
                }`}
              >
                {message.text}
              </div>
            ))}
          </div>

          <div className="border-t border-slate-100 bg-white p-3">
            <div className="flex items-end gap-2">
              <textarea
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' && !event.shiftKey) {
                    event.preventDefault();
                    handleSend();
                  }
                }}
                rows={1}
                placeholder="Ask about a project..."
                className="max-h-24 min-h-10 flex-1 resize-none rounded-md border border-slate-200 px-3 py-2 text-sm outline-none focus:border-[#ed6203] focus:ring-2 focus:ring-orange-100"
              />
              <button
                type="button"
                onClick={handleSend}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-[#ed6203] text-white hover:bg-[#d95702]"
                aria-label="Send message"
              >
                <Send size={16} />
              </button>
            </div>
          </div>
        </div>
      )}

      <button
        type="button"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        className="group flex h-36 w-36 cursor-grab touch-none items-center justify-center overflow-hidden rounded-full border-4 border-white bg-slate-950 shadow-2xl ring-2 ring-sky-300/40 active:cursor-grabbing"
        aria-label="Open AI assistant"
      >
        <img src={LOGO_SRC} alt="" draggable={false} className="h-full w-full select-none object-cover transition-transform duration-200 group-hover:scale-105" />
      </button>
    </div>
  );
}
