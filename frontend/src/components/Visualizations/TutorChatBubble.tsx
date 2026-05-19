'use client';

interface Props {
  role: 'user' | 'tutor';
  text: string;
  timestamp: number;
}

export default function TutorChatBubble({ role, text, timestamp }: Props) {
  const isTutor = role === 'tutor';

  return (
    <div className={`flex gap-2.5 ${isTutor ? '' : 'flex-row-reverse'}`}>
      {/* Avatar */}
      <div
        className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-xs font-bold ${
          isTutor
            ? 'bg-clay/20 text-clay'
            : 'bg-surface-container-highest text-ink-muted'
        }`}
      >
        {isTutor ? 'AI' : 'U'}
      </div>

      {/* Bubble */}
      <div
        className={`max-w-[85%] px-3.5 py-2.5 rounded-2xl text-body-sm leading-relaxed ${
          isTutor
            ? 'bg-surface-container-high text-ink rounded-tl-sm'
            : 'bg-clay text-white rounded-tr-sm'
        }`}
      >
        <p>{text}</p>
        <span className="block mt-1 text-[10px] opacity-50">
          {new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>
    </div>
  );
}
