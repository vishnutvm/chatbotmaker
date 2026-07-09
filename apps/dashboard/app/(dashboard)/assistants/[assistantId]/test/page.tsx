'use client';

import { useParams } from 'next/navigation';
import { useState } from 'react';
import { ChatPlayground, PageHeader, type ChatMessage } from '@genie/ui';
import { getAssistantById } from '@/lib/mocks/assistants.mock';
import { simulateChatResponse } from '@/lib/mocks/conversations.mock';

export default function TestPlaygroundPage() {
  const params = useParams();
  const assistant = getAssistantById(params.assistantId as string);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);

  if (!assistant) return null;

  async function handleSend(content: string) {
    setMessages((prev) => [...prev, { id: `m-${Date.now()}`, role: 'user', content }]);
    setLoading(true);
    const response = await simulateChatResponse(content);
    setMessages((prev) => [
      ...prev,
      {
        id: `m-${Date.now() + 1}`,
        role: 'assistant',
        content: response.content,
        sources: response.sources,
      },
    ]);
    setLoading(false);
  }

  return (
    <div>
      <PageHeader title="Test Playground" description="Chat with your assistant to verify responses." />
      <ChatPlayground
        messages={messages}
        onSend={handleSend}
        loading={loading}
        welcomeMessage={assistant.welcomeMessage}
        className="h-[600px]"
      />
    </div>
  );
}
