import React, { useState, useRef, useEffect } from 'react';
import { generateAIResponse } from '../services/geminiService';
import { Bot, Send, User, Sparkles, Headset, LogOut, Loader2 } from 'lucide-react';
import { SystemUser } from '../types';

interface AIAssistantProps {
    onNotify?: (message: string) => void;
    currentUser?: SystemUser | null;
}

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
}

const AIAssistant: React.FC<AIAssistantProps> = ({ onNotify, currentUser }) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: 'Hello! I am the OLA College AI Assistant. How can I help you with administrative tasks, drafting policies, or analyzing data today?',
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isLiveAgent, setIsLiveAgent] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleConnectAgent = () => {
      setIsLiveAgent(true);
      const userIdentifier = currentUser ? (currentUser.username || currentUser.id) : 'Guest User';
      
      // Notify IT Support (Mock)
      if (onNotify) {
          onNotify(`ALERT: Live Chat requested by ${userIdentifier}. Check Help Desk.`);
      }

      // Add system message
      setMessages(prev => [...prev, {
          id: Date.now().toString(),
          role: 'system',
          content: 'Connecting to IT Support...',
          timestamp: new Date()
      }]);

      // Simulate Agent Joining
      setTimeout(() => {
          setMessages(prev => [...prev, {
              id: (Date.now() + 1).toString(),
              role: 'assistant',
              content: `Hi ${currentUser?.username?.split('@')[0] || 'there'}, this is IT Support. I see you need assistance. How can I help you?`,
              timestamp: new Date()
          }]);
      }, 2000);
  };

  const handleDisconnectAgent = () => {
      setIsLiveAgent(false);
      setMessages(prev => [...prev, {
          id: Date.now().toString(),
          role: 'system',
          content: 'Live chat ended. You are now back with the AI Assistant.',
          timestamp: new Date()
      }]);
  };

  const handleSendMessage = async () => {
    if (!input.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    if (isLiveAgent) {
        // Live Agent Simulation
        setTimeout(() => {
            const responses = [
                "I understand. Let me check the system logs for you.",
                "Could you please provide the specific error code you are seeing?",
                "I'm looking into that for you right now.",
                "Please hold on a moment while I verify your permissions.",
                "Is there anything else I can help you with regarding this issue?",
                "I have escalated this ticket to the database administrator."
            ];
            const randomResponse = responses[Math.floor(Math.random() * responses.length)];
            
            setMessages(prev => [...prev, {
                id: Date.now().toString(),
                role: 'assistant',
                content: randomResponse,
                timestamp: new Date()
            }]);
            setIsLoading(false);
        }, 1500);
        return;
    }

    try {
      // Provide context about the college
      const context = `
        You are an AI Assistant for OLA College of Education. 
        The college specializes in teacher education and runs a 4-year Bachelor of Education (B.Ed.) degree program.
        
        Key Programs offered include:
        - B.Ed. Primary Education
        - B.Ed. JHS Education
        - B.Ed. Early Childhood Education
        - B.Ed. Mathematics
        - B.Ed. Science
        
        Your role is to help administrators with tasks like:
        - Drafting official announcements and memos.
        - Summarizing student or staff data (generically, do not invent specific personal data).
        - Explaining HR policies related to leave (Sick, Casual, Maternity, Study, Annual).
        - Providing suggestions for improving college accountability and student record keeping.
        
        Recent Policy Focus:
        - Strict accountability for employee leave to ensure proper tracking.
        - Digitalization of student records for better academic monitoring.
        
        Keep responses professional, academic, formal, and helpful.
      `;
      
      const responseText = await generateAIResponse(userMessage.content, context);

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: responseText,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: "I apologize, but I encountered an issue connecting to the server.",
        timestamp: new Date()
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-[calc(100vh-6rem)] flex flex-col bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
      <div className={`p-4 border-b border-slate-100 flex items-center justify-between transition-colors duration-300 ${isLiveAgent ? 'bg-amber-50' : 'bg-slate-50'}`}>
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg text-white transition-colors duration-300 ${isLiveAgent ? 'bg-amber-500' : 'bg-blue-600'}`}>
            {isLiveAgent ? <Headset size={20} /> : <Bot size={20} />}
          </div>
          <div>
            <h3 className="font-bold text-slate-800">{isLiveAgent ? 'IT Support Agent' : 'OLA AI Assistant'}</h3>
            <p className="text-xs text-slate-500">{isLiveAgent ? 'Live Chat Session' : 'Powered by Gemini'}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
            {isLiveAgent ? (
                <button 
                    onClick={handleDisconnectAgent}
                    className="px-3 py-1.5 bg-white border border-red-200 text-red-600 text-xs font-medium rounded-lg flex items-center gap-1 hover:bg-red-50 transition-colors shadow-sm"
                >
                    <LogOut size={14} /> End Chat
                </button>
            ) : (
                <button 
                    onClick={handleConnectAgent}
                    className="px-3 py-1.5 bg-white border border-blue-200 text-blue-600 text-xs font-medium rounded-lg flex items-center gap-1 hover:bg-blue-50 transition-colors shadow-sm"
                >
                    <Headset size={14} /> Talk to Agent
                </button>
            )}
            
            <div className={`px-3 py-1 text-xs font-medium rounded-full flex items-center gap-1 ${isLiveAgent ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'}`}>
                <Sparkles size={12} />
                {isLiveAgent ? 'Live' : 'Online'}
            </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6 bg-slate-50/50">
        {messages.map((msg) => {
            if (msg.role === 'system') {
                return (
                    <div key={msg.id} className="flex justify-center my-4">
                        <span className="text-xs bg-slate-100 text-slate-500 px-3 py-1 rounded-full border border-slate-200">
                            {msg.content}
                        </span>
                    </div>
                );
            }
            return (
                <div
                    key={msg.id}
                    className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
                >
                    <div className={`
                    w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm
                    ${msg.role === 'user' ? 'bg-slate-700 text-white' : isLiveAgent && msg.role === 'assistant' ? 'bg-amber-500 text-white' : 'bg-blue-600 text-white'}
                    `}>
                    {msg.role === 'user' ? <User size={16} /> : isLiveAgent && msg.role === 'assistant' ? <Headset size={16} /> : <Bot size={16} />}
                    </div>
                    
                    <div className={`
                    max-w-[80%] rounded-2xl px-5 py-3 text-sm leading-relaxed shadow-sm
                    ${msg.role === 'user' 
                        ? 'bg-white text-slate-800 rounded-tr-none border border-slate-200' 
                        : 'bg-white text-slate-700 rounded-tl-none border border-slate-200'}
                    `}>
                    {/* Basic formatting for line breaks */}
                    {msg.content.split('\n').map((line, i) => (
                        <p key={i} className="min-h-[1rem]">{line}</p>
                    ))}
                    <p className="text-[10px] text-slate-400 mt-2 text-right">
                        {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                    </div>
                </div>
            );
        })}
        {isLoading && (
          <div className="flex gap-3">
            <div className={`w-8 h-8 rounded-full text-white flex items-center justify-center flex-shrink-0 ${isLiveAgent ? 'bg-amber-500' : 'bg-blue-600'}`}>
              {isLiveAgent ? <Headset size={16} /> : <Bot size={16} />}
            </div>
            <div className="bg-white px-5 py-4 rounded-2xl rounded-tl-none border border-slate-200 shadow-sm flex items-center gap-2">
              <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></span>
              <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-75"></span>
              <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-150"></span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 bg-white border-t border-slate-100">
        <div className="flex items-center gap-2 relative">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
            placeholder={isLiveAgent ? "Type your message to the agent..." : "Ask AI to draft a leave policy or summarize data..."}
            className={`w-full pl-4 pr-12 py-3 bg-slate-50 border rounded-xl focus:outline-none focus:ring-2 transition-all text-sm ${isLiveAgent ? 'border-amber-200 focus:ring-amber-500/50 focus:border-amber-500' : 'border-slate-200 focus:ring-blue-500/50 focus:border-blue-500'}`}
            disabled={isLoading}
          />
          <button
            onClick={handleSendMessage}
            disabled={!input.trim() || isLoading}
            className={`absolute right-2 p-2 rounded-lg transition-colors ${
              input.trim() && !isLoading 
                ? (isLiveAgent ? 'bg-amber-500 text-white hover:bg-amber-600' : 'bg-blue-600 text-white hover:bg-blue-700') 
                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
            }`}
          >
            <Send size={18} />
          </button>
        </div>
        <p className="text-center text-xs text-slate-400 mt-2">
          {isLiveAgent ? 'You are chatting with a live support agent.' : 'AI can make mistakes. Please verify important information.'}
        </p>
      </div>
    </div>
  );
};

export default AIAssistant;