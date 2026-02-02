'use client';
import { useState } from 'react';
import { useChat } from '@ai-sdk/react';
import {
  PromptInput,
  PromptInputBody,
  type PromptInputMessage,
  PromptInputSubmit,
  PromptInputTextarea,
  PromptInputTools,
} from '@/components/ai-elements/prompt-input';
import {
  Message,
  MessageContent,
  MessageResponse,
} from '@/components/ai-elements/message';
import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from '@/components/ai-elements/conversation';
// import {Response} from '@components/ai-elements/response'
import { Loader } from '@/components/ai-elements/loader';
export default function RagChatBot() {
  const [input, setInput] = useState('');
  const { messages, sendMessage, status } = useChat();

  const handleSubmit = (message: PromptInputMessage) => {
    if (!message) return;
    sendMessage({ text: message.text });
    setInput('');
  };
  return (
    <div className='max-w-4xl mx-auto relative p-6 size-full h-[calc(100vh-5rem)]'>
      <div className='flex flex-col h-full'>
        <Conversation className='h-full'>
          <ConversationContent>
            {messages.map((message) => (
              <Message
                from={message.role}
                key={message.id}
              >
                <MessageContent>
                  {message.parts.map((part, i) => {
                    switch (part.type) {
                      case 'text':
                        return (
                          <MessageResponse key={`${message.id}-${i}`}>
                            {part.text}
                          </MessageResponse>
                        );
                      default:
                        return null;
                    }
                  })}
                </MessageContent>
              </Message>
            ))}
            {(status === 'submitted' || status === 'streaming') && <Loader />}
          </ConversationContent>
          <ConversationScrollButton />
        </Conversation>
        <PromptInput
          className='mt-4'
          onSubmit={handleSubmit}
        >
          <PromptInputBody>
            <PromptInputTextarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
            ></PromptInputTextarea>
          </PromptInputBody>
          {/* <PromptInputTools> */}
          <PromptInputSubmit />
          {/* </PromptInputTools> */}
        </PromptInput>
      </div>
    </div>
  );
}
