import React, { useState, useRef, useEffect } from 'react';
import { Send, Image as ImageIcon, Sparkles, X, Menu, GraduationCap } from 'lucide-react';
import { Subject, Message } from './types';
import SubjectCard from './components/SubjectCard';
import ChatMessage from './components/ChatMessage';
import { sendMessageToGemini, fileToBase64 } from './services/geminiService';

function App() {
  const [activeSubject, setActiveSubject] = useState<Subject>(Subject.ALGEBRA);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'model',
      content: `Привет! Я **AbramAI**.
      
Я помогу тебе с домашкой так, чтобы учитель ничего не заподозрил. 😉
Выбери предмет слева, скинь фото задачи или напиши условие.
      
Я напишу решение, которое можно **сразу переписывать в тетрадь** или составлю идеальный конспект.`,
      timestamp: Date.now()
    }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSendMessage = async () => {
    if ((!input.trim() && !selectedImage) || isLoading) return;

    const currentInput = input;
    const currentImage = selectedImage;
    
    // Reset inputs immediately
    setInput('');
    setSelectedImage(null);
    if (fileInputRef.current) fileInputRef.current.value = '';

    let base64Image: string | undefined;

    if (currentImage) {
      try {
        base64Image = await fileToBase64(currentImage);
      } catch (e) {
        console.error("Error processing image", e);
        return;
      }
    }

    const newMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: currentInput,
      image: base64Image,
      timestamp: Date.now(),
    };

    setMessages(prev => [...prev, newMessage]);
    setIsLoading(true);

    try {
      const responseText = await sendMessageToGemini(currentInput, activeSubject, base64Image);
      
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        content: responseText,
        timestamp: Date.now(),
      };

      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: 'model',
        content: 'Произошла ошибка. Попробуй еще раз.',
        timestamp: Date.now()
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const triggerFileUpload = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedImage(e.target.files[0]);
    }
  };

  const removeImage = () => {
    setSelectedImage(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="flex h-screen overflow-hidden relative text-slate-200">
      
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/60 z-30 md:hidden backdrop-blur-sm transition-opacity"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed md:static inset-y-0 left-0 z-40 w-72 
        bg-slate-900/60 backdrop-blur-2xl border-r border-white/5
        transform transition-transform duration-300 ease-in-out flex flex-col shadow-2xl
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        <div className="p-8 pb-6 flex items-center gap-3">
          <div className="relative">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <GraduationCap className="text-white w-6 h-6" />
            </div>
            <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-emerald-500 border-2 border-slate-900 rounded-full"></div>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">
              AbramAI
            </h1>
            <p className="text-xs text-slate-400 font-medium">Твой помощник 24/7</p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-2">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-4 ml-1">Выбери предмет</p>
          <SubjectCard 
            subject={Subject.ALGEBRA} 
            isActive={activeSubject === Subject.ALGEBRA} 
            onClick={(s) => { setActiveSubject(s); setIsSidebarOpen(false); }} 
          />
          <SubjectCard 
            subject={Subject.HISTORY} 
            isActive={activeSubject === Subject.HISTORY} 
            onClick={(s) => { setActiveSubject(s); setIsSidebarOpen(false); }} 
          />
          <SubjectCard 
            subject={Subject.PHYSICS} 
            isActive={activeSubject === Subject.PHYSICS} 
            onClick={(s) => { setActiveSubject(s); setIsSidebarOpen(false); }} 
          />
          <SubjectCard 
            subject={Subject.CHEMISTRY} 
            isActive={activeSubject === Subject.CHEMISTRY} 
            onClick={(s) => { setActiveSubject(s); setIsSidebarOpen(false); }} 
          />
        </div>

        <div className="p-6 border-t border-white/5">
          <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 rounded-xl p-4 border border-white/5">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span className="text-sm font-semibold text-slate-200">Pro Tip</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Отправь фото задачи, и я решу её по шагам. Не забудь выбрать правильный предмет!
            </p>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-full w-full relative">
        
        {/* Header (Mobile) */}
        <header className="md:hidden h-16 bg-slate-900/40 backdrop-blur-xl border-b border-white/5 flex items-center px-4 justify-between z-20 absolute top-0 w-full">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center">
              <GraduationCap className="text-white w-5 h-5" />
            </div>
            <span className="font-bold text-lg text-white">AbramAI</span>
          </div>
          <button onClick={() => setIsSidebarOpen(true)} className="text-slate-300 p-2 hover:bg-white/5 rounded-lg">
            <Menu />
          </button>
        </header>

        {/* Chat Area */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-2 relative scroll-smooth custom-scrollbar">
          <div className="max-w-4xl mx-auto min-h-full flex flex-col justify-end pt-20 md:pt-10">
            <div className="flex-1 space-y-2 pb-32">
              {messages.map((msg) => (
                <ChatMessage key={msg.id} message={msg} />
              ))}
              
              {isLoading && (
                <div className="flex justify-start w-full animate-in fade-in duration-300">
                  <div className="bg-slate-800/50 backdrop-blur-md border border-white/5 px-5 py-4 rounded-3xl rounded-tl-none flex items-center gap-2 shadow-lg">
                     <div className="w-2 h-2 bg-indigo-400 rounded-full animate-[bounce_1.4s_infinite_0ms]"></div>
                     <div className="w-2 h-2 bg-purple-400 rounded-full animate-[bounce_1.4s_infinite_200ms]"></div>
                     <div className="w-2 h-2 bg-pink-400 rounded-full animate-[bounce_1.4s_infinite_400ms]"></div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </div>
        </div>

        {/* Input Area */}
        <div className="absolute bottom-0 w-full z-20 px-4 pb-6 pt-10 bg-gradient-to-t from-slate-950 via-slate-950/80 to-transparent pointer-events-none">
          <div className="max-w-4xl mx-auto pointer-events-auto">
            
            {/* Image Preview */}
            {selectedImage && (
              <div className="mb-3 inline-flex items-center gap-3 bg-slate-800/80 backdrop-blur-md px-4 py-2 rounded-xl border border-white/10 shadow-lg animate-in slide-in-from-bottom-2">
                <div className="w-8 h-8 rounded bg-slate-700 flex items-center justify-center overflow-hidden">
                   <ImageIcon size={16} className="text-slate-400" />
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-medium text-slate-200 truncate max-w-[150px]">
                    {selectedImage.name}
                  </span>
                  <span className="text-[10px] text-slate-400">Изображение загружено</span>
                </div>
                <button 
                  onClick={removeImage} 
                  className="ml-2 p-1.5 hover:bg-white/10 rounded-full text-slate-400 hover:text-red-400 transition-colors"
                >
                  <X size={14} />
                </button>
              </div>
            )}
            
            {/* Input Bar */}
            <div className="relative flex items-end gap-2 bg-slate-900/60 backdrop-blur-2xl border border-white/10 rounded-3xl p-2 shadow-2xl ring-1 ring-white/5 focus-within:ring-indigo-500/50 focus-within:border-indigo-500/50 transition-all hover:bg-slate-900/80">
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                accept="image/*" 
                className="hidden" 
              />
              
              <button 
                onClick={triggerFileUpload}
                className="p-3.5 text-slate-400 hover:text-indigo-400 hover:bg-white/5 rounded-2xl transition-all duration-200 group"
                title="Загрузить изображение"
              >
                <ImageIcon size={22} className="group-hover:scale-110 transition-transform" />
              </button>

              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={`Напиши вопрос или задачу по предмету ${activeSubject}...`}
                className="flex-1 bg-transparent text-slate-100 placeholder-slate-500 resize-none max-h-40 min-h-[50px] py-3.5 focus:outline-none text-base font-light"
                rows={1}
                style={{ height: 'auto', minHeight: '50px' }}
              />

              <button 
                onClick={handleSendMessage}
                disabled={(!input.trim() && !selectedImage) || isLoading}
                className={`
                  p-3.5 rounded-2xl flex items-center justify-center transition-all duration-300 ease-out
                  ${(!input.trim() && !selectedImage) || isLoading 
                    ? 'bg-slate-800 text-slate-600 cursor-not-allowed' 
                    : 'bg-indigo-600 text-white hover:bg-indigo-500 shadow-lg shadow-indigo-600/25 hover:shadow-indigo-600/40 hover:scale-105 active:scale-95'}
                `}
              >
                <Send size={20} />
              </button>
            </div>
            
            <div className="text-center mt-3 opacity-60">
               <span className="text-[10px] text-slate-400 font-medium tracking-widest uppercase flex items-center justify-center gap-2">
                 <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse"></span>
                 Abram AI Active • {activeSubject}
               </span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;