import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface TutorialDialogProps {
    isOpen: boolean;
    onClose: () => void;
}

export const TutorialDialog: React.FC<TutorialDialogProps> = ({ isOpen, onClose }) => {
    // Reliable external image for the mentor
    const mentorImage = 'https://i.ibb.co/L6Vv4vP/elder-panda.png';
    
    // Cinematic dark background
    const bgImage = 'https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=1920&q=80';

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[99999] flex items-center justify-center bg-black overflow-hidden pointer-events-auto select-none"
                >
                    {/* 1. SOLID BACKGROUND (No transparency) */}
                    <div className="absolute inset-0 bg-[#0a0503]">
                        <img src={bgImage} className="w-full h-full object-cover opacity-30 blur-[1px]" alt="bg" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
                    </div>

                    {/* 2. CHARACTER (MENTOR) */}
                    <motion.div 
                        initial={{ x: -150, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ duration: 1, ease: "easeOut" }}
                        className="absolute bottom-0 left-0 w-[50%] h-[110%] flex items-end justify-center pointer-events-none"
                    >
                        <img 
                            src={mentorImage}
                            className="h-full w-auto object-contain object-bottom drop-shadow-[0_0_50px_rgba(0,0,0,1)]"
                            alt="Mentor"
                        />
                        <div className="absolute w-full h-[60%] bg-gradient-to-t from-black to-transparent bottom-0" />
                    </motion.div>

                    {/* 3. STORY CONTENT */}
                    <div className="relative w-full h-full flex flex-col items-end justify-center pr-[10%] pl-[45%] z-10">
                        
                        <motion.div
                            initial={{ y: 50, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.3 }}
                            className="text-center mb-10 w-full flex flex-col items-end"
                        >
                            <h3 className="text-[#c8952a] text-[20px] uppercase tracking-[0.6em] font-black"
                                style={{ fontFamily: "'Cinzel', serif" }}>
                                Путь Мастера
                            </h3>
                            <div className="w-32 h-[2px] bg-[#c8952a] mt-4 shadow-[0_0_10px_#c8952a]" />
                        </motion.div>

                        <div className="max-w-[750px] text-right space-y-8">
                            <motion.p 
                                initial={{ x: 50, opacity: 0 }}
                                animate={{ x: 0, opacity: 1 }}
                                transition={{ delay: 0.6 }}
                                className="text-[#ffe082] text-[56px] font-black leading-tight"
                                style={{ fontFamily: "'Cinzel Decorative', serif", textShadow: '0 4px 12px rgba(0,0,0,1)' }}
                            >
                                Твоё время пришло,
                                <br />
                                юный мастер!
                            </motion.p>

                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 1, duration: 0.8 }}
                                className="relative border-r-[5px] border-[#c8952a] pr-8 py-2"
                            >
                                <p className="text-white/90 text-[26px] leading-relaxed italic font-medium">
                                    "Наше королевство в великой опасности. Древние духи пробудились, и только ты можешь восстановить баланс. Бери в лапы боевой шест — я покажу тебе истинную силу!"
                                </p>
                            </motion.div>

                            <motion.div
                                initial={{ scale: 0.8, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={{ delay: 1.5 }}
                                className="flex justify-end pt-10"
                            >
                                <motion.button
                                    whileHover={{ scale: 1.05, boxShadow: '0 0 50px rgba(240,192,64,0.4)' }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={onClose}
                                    className="relative px-24 py-8 rounded-[25px] overflow-hidden group border-2 border-[#ffe082]/30"
                                    style={{ 
                                        background: 'linear-gradient(135deg, #c8952a 0%, #ffe082 50%, #c8952a 100%)',
                                        boxShadow: '0 25px 50px rgba(0,0,0,0.8)'
                                    }}
                                >
                                    <span className="relative z-10 text-black font-black text-[32px] tracking-[0.2em] uppercase">
                                        В ПУТЬ!
                                    </span>
                                    {/* Shimmer effect */}
                                    <motion.div 
                                        animate={{ x: ['-100%', '200%'] }}
                                        transition={{ repeat: Infinity, duration: 2.5, ease: 'linear' }}
                                        className="absolute inset-0 bg-white/40 skew-x-[-30deg] pointer-events-none"
                                    />
                                </motion.button>
                            </motion.div>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};
