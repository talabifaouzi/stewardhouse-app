import { Card } from './Card.jsx';
import { SectionLabel } from './SectionLabel.jsx';
import { formatDate } from '../utils/formatDate.js';

// ENT #45 — shared Message-history card. Pure presentational: takes
// `messages` as a prop. The `useComms()` / `getThread()` call stays in
// each parent (Rules-of-Hooks discipline, sibling of #127). Renders nothing
// when there are no messages.
export default function MessageHistoryCard({ messages }) {
  if (messages.length === 0) return null;
  return (
    <Card>
      <SectionLabel>Message history</SectionLabel>
      <p style={messageSubtitleStyle}>
        {messages.length} message{messages.length > 1 ? 's' : ''}
      </p>
      <ul style={messageListStyle}>
        {messages.slice().reverse().map((m, i) => (
          <li key={m.timestamp} style={messageRowStyle(i === 0)}>
            <p style={messageMetaStyle}>{formatDate(m.timestamp)} · From {m.fromName}</p>
            <p style={messageSubjectStyle}>{m.subject}</p>
            <p style={messageBodyPreviewStyle}>
              {m.body.length > 60 ? m.body.slice(0, 60) + '…' : m.body}
            </p>
          </li>
        ))}
      </ul>
    </Card>
  );
}

const messageSubtitleStyle = {
  fontSize: 'var(--sh-text-xs)',
  color: 'var(--sh-text-muted)',
  letterSpacing: '0.02em',
  marginTop: 'var(--sh-space-3)',
  marginBottom: 'var(--sh-space-3)',
};

const messageListStyle = {
  listStyle: 'none',
  margin: 0,
  padding: 0,
};

function messageRowStyle(isFirst) {
  return {
    paddingTop: 'var(--sh-space-3)',
    paddingBottom: 'var(--sh-space-3)',
    borderTop: isFirst ? 'none' : 'var(--sh-border-thin)',
  };
}

const messageMetaStyle = {
  fontSize: 'var(--sh-text-xs)',
  color: 'var(--sh-text-muted)',
  letterSpacing: '0.02em',
  marginBottom: 'var(--sh-space-1)',
};

const messageSubjectStyle = {
  fontFamily: 'var(--sh-font-serif)',
  fontSize: 'var(--sh-text-base)',
  color: 'var(--sh-text-primary)',
  marginBottom: 'var(--sh-space-1)',
};

const messageBodyPreviewStyle = {
  fontSize: 'var(--sh-text-sm)',
  color: 'var(--sh-text-body)',
  fontStyle: 'italic',
  lineHeight: 1.5,
};
