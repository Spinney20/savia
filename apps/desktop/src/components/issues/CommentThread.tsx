import { useState } from 'react';
import { format } from 'date-fns';
import { ro } from 'date-fns/locale';
import type { IssueCommentDto } from '@ssm/shared';
import { Card, Avatar, Button, Input } from '@/components/ui';
import { Send } from 'lucide-react';

interface CommentThreadProps {
  comments: IssueCommentDto[];
  onAddComment: (content: string) => void;
  isAdding?: boolean;
}

export function CommentThread({ comments, onAddComment, isAdding }: CommentThreadProps) {
  const [text, setText] = useState('');

  const handleSubmit = () => {
    if (!text.trim()) return;
    onAddComment(text.trim());
    setText('');
  };

  return (
    <div>
      <div className="space-y-3 mb-4">
        {comments.length === 0 ? (
          <p className="text-sm text-gray-500">Niciun comentariu încă.</p>
        ) : (
          comments.map((c) => (
            <Card key={`${c.authorName}-${c.createdAt}`} className={c.isSystem ? '!bg-gray-50 !border-gray-200' : ''}>
              <div className="flex items-start gap-3">
                <Avatar name={c.authorName} size={32} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-semibold text-gray-900">{c.authorName}</span>
                    {c.isSystem && (
                      <span className="text-[10px] font-medium text-gray-400 bg-gray-200 px-1.5 py-0.5 rounded">Sistem</span>
                    )}
                    <span className="text-xs text-gray-400">
                      {format(new Date(c.createdAt), 'dd MMM yyyy, HH:mm', { locale: ro })}
                    </span>
                  </div>
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">{c.content}</p>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      <div className="flex items-center gap-2">
        <Input
          placeholder="Adaugă un comentariu..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSubmit()}
          className="flex-1"
        />
        <Button icon={Send} loading={isAdding} onClick={handleSubmit} disabled={!text.trim()}>
          Trimite
        </Button>
      </div>
    </div>
  );
}
