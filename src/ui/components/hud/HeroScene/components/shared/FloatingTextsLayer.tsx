import { motion, AnimatePresence } from 'framer-motion';

interface FloatingTextsLayerProps {
    texts: any[];
}

export const FloatingTextsLayer: React.FC<FloatingTextsLayerProps> = ({ texts }) => {
    return (
        <div
            style={{
                position: 'absolute',
                bottom: '450px',
                left: '50%',
                transform: 'translateX(-50%)',
                pointerEvents: 'none',
                zIndex: 10000,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '8px',
            }}
        >
            <AnimatePresence>
                {texts.map((t) => (
                    <motion.div
                        key={t.id}
                        initial={{ y: 30, opacity: 0, scale: 0.8 }}
                        animate={{ y: -60, opacity: 1, scale: 1.1 }}
                        exit={{ opacity: 0, transition: { duration: 0.2 } }}
                        transition={{ type: 'spring', stiffness: 90, damping: 15 }}
                        style={{
                            color: t.color,
                            fontSize: '22px',
                            fontWeight: 800,
                            textShadow: '0 2px 4px rgba(0,0,0,0.9), 0 0 15px rgba(0,0,0,0.5)',
                            fontFamily: "'Philosopher', 'Cinzel', 'Inter', sans-serif",
                            letterSpacing: '1px',
                        }}
                    >
                        {t.text}
                    </motion.div>
                ))}
            </AnimatePresence>
        </div>
    );
};

