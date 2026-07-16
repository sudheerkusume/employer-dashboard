"use client";
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { Send, X, Gift, Smile, Clock } from 'lucide-react';
import useSWR from 'swr';

const fetcher = (url) => fetch(url).then((res) => res.json());

export default function BirthdayCelebration({ currentUser, allEmployees }) {
  const [activeBirthday, setActiveBirthday] = useState(null);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const [hasFiredConfetti, setHasFiredConfetti] = useState(false);
  const chatEndRef = useRef(null);

  // Check for active birthdays (12 PM day before to 12 PM day of)
  useEffect(() => {
    if (!allEmployees) return;

    const now = new Date();

    // For manual testing, you can uncomment this to force a specific date:
    // const now = new Date('2026-07-15T15:00:00Z');

    const currentYear = now.getFullYear();

    for (const emp of allEmployees) {
      if (!emp.dateOfBirth) continue;

      const dob = new Date(emp.dateOfBirth);
      const dobMonth = dob.getMonth();
      const dobDate = dob.getDate();

      // Everyone sees it exactly on the birthday (12:00 AM to 11:59 PM)
      const windowStart = new Date(currentYear, dobMonth, dobDate, 0, 0, 0);
      const windowEnd = new Date(currentYear, dobMonth, dobDate, 23, 59, 59);

      if (now >= windowStart && now <= windowEnd) {
        setActiveBirthday({ ...emp, year: currentYear });
        break; // Only show one celebration at a time for simplicity
      }
    }
  }, [allEmployees]);

  // Removed confetti on mount as requested by user.

  // SWR Polling for chat messages
  const { data: messages, mutate } = useSWR(
    activeBirthday ? `/api/chat/birthday?employeeId=${activeBirthday._id}&year=${activeBirthday.year}` : null,
    fetcher,
    { refreshInterval: 3000 }
  );

  useEffect(() => {
    if (chatEndRef.current && isChatOpen) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }

    // Fireworks confetti effect when modal opens (only once per session)
    if (isChatOpen && !hasFiredConfetti) {
      setHasFiredConfetti(true);
      const duration = 2.5 * 1000;
      const end = Date.now() + duration;
      const colors = ['#FF69B4', '#87CEEB', '#FFD700', '#98FB98'];

      const frame = () => {
        confetti({
          particleCount: 4,
          angle: 60,
          spread: 55,
          origin: { x: 0, y: 0.6 },
          colors: colors,
          zIndex: 9999
        });
        confetti({
          particleCount: 4,
          angle: 120,
          spread: 55,
          origin: { x: 1, y: 0.6 },
          colors: colors,
          zIndex: 9999
        });

        if (Date.now() < end) {
          requestAnimationFrame(frame);
        }
      };
      frame();
    }
  }, [messages, isChatOpen]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeBirthday || !currentUser) return;

    const msgData = {
      birthdayEmployeeId: activeBirthday._id,
      year: activeBirthday.year,
      senderId: currentUser.userId || currentUser._id,
      senderName: currentUser.name,
      message: newMessage
    };

    // Optimistic UI update
    mutate(messages ? [...messages, { ...msgData, timestamp: new Date().toISOString(), _id: 'temp-' + Date.now() }] : [], false);
    setNewMessage('');

    try {
      await fetch('/api/chat/birthday', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(msgData)
      });
      mutate(); // Re-fetch actual data
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  if (!activeBirthday) return null;

  return (
    <>
      {/* Floating Widget Button */}
      <motion.div
        initial={{ opacity: 0, y: 50, scale: 0.8 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="fixed bottom-6 right-6 z-40"
      >
        <button
          onClick={() => setIsChatOpen(true)}
          className="relative flex items-center justify-center w-16 h-16 bg-gradient-to-tr from-pink-500 to-orange-400 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 border-2 border-white"
        >
          <Gift size={28} className="text-white animate-bounce" />
          <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full shadow-md animate-pulse">
            Wish!
          </span>
        </button>
      </motion.div>

      {/* Chat Modal */}
      <AnimatePresence>
        {isChatOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col h-[600px] max-h-[85vh] relative"
            >
              {/* Header */}
              <div className="bg-gradient-to-r from-pink-500 via-rose-500 to-orange-400 p-6 text-white text-center relative shrink-0 overflow-hidden">
                {/* One-time Realistic Balloon Bundle Animation */}
                <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
                  <motion.div
                    initial={{ y: 250, opacity: 0, scale: 0.5, rotate: -5 }}
                    animate={{ y: -20, opacity: 1, scale: 1, rotate: 0 }}
                    transition={{ type: "spring", stiffness: 45, damping: 12, mass: 1 }}
                    className="absolute left-[5%] sm:left-[5%] bottom-[-20px] opacity-90"
                  >
                    <svg viewBox="0 0 200 300" className="w-32 h-48 sm:w-40 sm:h-60 drop-shadow-2xl">
                      <defs>
                        <radialGradient id="blue3D" cx="30%" cy="30%" r="70%">
                          <stop offset="0%" stopColor="#93C5FD" />
                          <stop offset="50%" stopColor="#3B82F6" />
                          <stop offset="100%" stopColor="#1E3A8A" />
                        </radialGradient>
                        <radialGradient id="yellow3D" cx="30%" cy="30%" r="70%">
                          <stop offset="0%" stopColor="#FDE68A" />
                          <stop offset="50%" stopColor="#F59E0B" />
                          <stop offset="100%" stopColor="#92400E" />
                        </radialGradient>
                        <radialGradient id="red3D" cx="30%" cy="30%" r="70%">
                          <stop offset="0%" stopColor="#FCA5A5" />
                          <stop offset="50%" stopColor="#EF4444" />
                          <stop offset="100%" stopColor="#7F1D1D" />
                        </radialGradient>
                        <radialGradient id="pink3D" cx="30%" cy="30%" r="70%">
                          <stop offset="0%" stopColor="#F9A8D4" />
                          <stop offset="50%" stopColor="#EC4899" />
                          <stop offset="100%" stopColor="#831843" />
                        </radialGradient>
                        <radialGradient id="purple3D" cx="30%" cy="30%" r="70%">
                          <stop offset="0%" stopColor="#C4B5FD" />
                          <stop offset="50%" stopColor="#8B5CF6" />
                          <stop offset="100%" stopColor="#4C1D95" />
                        </radialGradient>
                      </defs>
                      {/* Strings */}
                      <path d="M100,150 Q90,210 100,290" fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth="1.5" />
                      <path d="M60,120 Q80,190 100,290" fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth="1.5" />
                      <path d="M140,120 Q120,190 100,290" fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth="1.5" />

                      {/* Blue Balloon */}
                      <g>
                        <polygon points="55,160 65,160 60,168" fill="#1E3A8A" />
                        <ellipse cx="60" cy="120" rx="30" ry="42" fill="url(#blue3D)" />
                        <ellipse cx="48" cy="100" rx="6" ry="16" fill="rgba(255,255,255,0.7)" transform="rotate(-30 48 100)" />
                      </g>

                      {/* Yellow Balloon */}
                      <g>
                        <polygon points="135,150 145,150 140,158" fill="#92400E" />
                        <ellipse cx="140" cy="110" rx="30" ry="42" fill="url(#yellow3D)" />
                        <ellipse cx="128" cy="90" rx="6" ry="16" fill="rgba(255,255,255,0.7)" transform="rotate(-30 128 90)" />
                      </g>

                      {/* Red Balloon */}
                      <g>
                        <polygon points="95,126 105,126 100,134" fill="#7F1D1D" />
                        <ellipse cx="100" cy="80" rx="35" ry="48" fill="url(#red3D)" />
                        <ellipse cx="86" cy="55" rx="8" ry="18" fill="rgba(255,255,255,0.7)" transform="rotate(-30 86 55)" />
                      </g>
                    </svg>
                  </motion.div>

                  <motion.div
                    initial={{ y: 280, opacity: 0, scale: 0.5, rotate: 5 }}
                    animate={{ y: -10, opacity: 1, scale: 1, rotate: 0 }}
                    transition={{ type: "spring", stiffness: 40, damping: 10, mass: 1, delay: 0.15 }}
                    className="absolute right-[2%] sm:right-[5%] bottom-[-40px] opacity-90"
                  >
                    <svg viewBox="0 0 200 300" className="w-28 h-40 sm:w-32 sm:h-48 drop-shadow-2xl transform -scale-x-100">
                      {/* Using the same defs is valid in SVG if they are defined globally, but we'll safely redefine to avoid issues */}
                      <defs>
                        <radialGradient id="pink3D2" cx="30%" cy="30%" r="70%">
                          <stop offset="0%" stopColor="#F9A8D4" />
                          <stop offset="50%" stopColor="#EC4899" />
                          <stop offset="100%" stopColor="#831843" />
                        </radialGradient>
                        <radialGradient id="purple3D2" cx="30%" cy="30%" r="70%">
                          <stop offset="0%" stopColor="#C4B5FD" />
                          <stop offset="50%" stopColor="#8B5CF6" />
                          <stop offset="100%" stopColor="#4C1D95" />
                        </radialGradient>
                        <radialGradient id="yellow3D2" cx="30%" cy="30%" r="70%">
                          <stop offset="0%" stopColor="#FDE68A" />
                          <stop offset="50%" stopColor="#F59E0B" />
                          <stop offset="100%" stopColor="#92400E" />
                        </radialGradient>
                      </defs>
                      <path d="M100,150 Q90,210 100,290" fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth="1.5" />
                      <path d="M60,120 Q80,190 100,290" fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth="1.5" />
                      <path d="M140,120 Q120,190 100,290" fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth="1.5" />

                      {/* Pink Balloon */}
                      <g>
                        <polygon points="55,160 65,160 60,168" fill="#831843" />
                        <ellipse cx="60" cy="120" rx="30" ry="42" fill="url(#pink3D2)" />
                        <ellipse cx="48" cy="100" rx="6" ry="16" fill="rgba(255,255,255,0.7)" transform="rotate(-30 48 100)" />
                      </g>

                      {/* Purple Balloon */}
                      <g>
                        <polygon points="135,150 145,150 140,158" fill="#4C1D95" />
                        <ellipse cx="140" cy="110" rx="30" ry="42" fill="url(#purple3D2)" />
                        <ellipse cx="128" cy="90" rx="6" ry="16" fill="rgba(255,255,255,0.7)" transform="rotate(-30 128 90)" />
                      </g>

                      {/* Yellow Balloon */}
                      <g>
                        <polygon points="95,126 105,126 100,134" fill="#92400E" />
                        <ellipse cx="100" cy="80" rx="35" ry="48" fill="url(#yellow3D2)" />
                        <ellipse cx="86" cy="55" rx="8" ry="18" fill="rgba(255,255,255,0.7)" transform="rotate(-30 86 55)" />
                      </g>
                    </svg>
                  </motion.div>
                </div>
                <button
                  onClick={() => setIsChatOpen(false)}
                  className="absolute top-4 right-4 p-2 bg-white/20 hover:bg-white/30 rounded-full transition-colors"
                >
                  <X size={20} />
                </button>
                <div className="w-20 h-20 mx-auto bg-white rounded-full flex items-center justify-center shadow-lg mb-3 border-4 border-white/30">
                  {activeBirthday.profileImage ? (
                    <img src={activeBirthday.profileImage} alt={activeBirthday.name} className="w-full h-full rounded-full object-cover" />
                  ) : (
                    <span className="text-3xl font-bold text-pink-500">
                      {activeBirthday.name.charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>
                <h2 className="text-2xl font-bold tracking-tight">Happy Birthday</h2>
                <p className="text-pink-100 font-medium opacity-90">{activeBirthday.name}</p>
              </div>

              {/* Chat Messages */}
              <div className="flex-1 overflow-y-auto p-4 bg-gray-50/50 space-y-4">
                {messages && messages.length > 0 ? (
                  messages.map((msg) => {
                    const isMe = msg.senderId === (currentUser?.userId || currentUser?._id);
                    return (
                      <div key={msg._id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                        <div className={`flex items-end gap-2 max-w-[85%] ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${isMe ? 'bg-orange-100 text-orange-600' : 'bg-pink-100 text-pink-600'}`}>
                            {msg.senderName.charAt(0).toUpperCase()}
                          </div>
                          <div className={`p-3 rounded-2xl shadow-sm ${isMe ? 'bg-gradient-to-br from-orange-400 to-rose-400 text-white rounded-br-sm' : 'bg-white border border-gray-100 text-gray-800 rounded-bl-sm'}`}>
                            {!isMe && <p className="text-xs font-bold text-pink-500 mb-1">{msg.senderName}</p>}
                            <p className="text-sm leading-relaxed">{msg.message}</p>
                          </div>
                        </div>
                        <span className="text-[10px] text-gray-400 mt-1 px-1">
                          {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    );
                  })
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-gray-400 space-y-3">
                    <Smile size={48} className="text-pink-300 opacity-50" />
                    <p className="text-sm font-medium">Be the first to wish {activeBirthday.name}!</p>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>

              {/* Input Area */}
              <div className="p-4 bg-white border-t border-gray-100 shrink-0">
                <form onSubmit={handleSendMessage} className="relative flex items-center">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type a birthday wish..."
                    className="w-full pl-5 pr-14 py-3.5 bg-gray-100/80 border-transparent rounded-full text-gray-900 focus:bg-white focus:border-pink-300 focus:ring-2 focus:ring-pink-100 outline-none transition-all"
                  />
                  <button
                    type="submit"
                    disabled={!newMessage.trim()}
                    className="absolute right-2 p-2 bg-gradient-to-r from-pink-500 to-orange-400 text-white rounded-full hover:shadow-md disabled:opacity-50 disabled:hover:shadow-none transition-all"
                  >
                    <Send size={18} className="ml-0.5" />
                  </button>
                </form>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
