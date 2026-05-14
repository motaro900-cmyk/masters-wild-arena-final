
import { motion, AnimatePresence } from 'framer-motion';

interface FloatingTextsLayerProps {
    texts: any[];
}

export const FloatingTextsLayer: React.FC<FloatingTextsLayerProps> = ({ texts }) => {
    return (
        <div style={{ position: 'absolute', bottom: '400px', left: '50%', transform: 'translateX(-50%)', pointerEvents: 'none', zIndex: 10000, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
            <AnimatePresence>
                {texts.map(t => (
                    <motion.div
                        key={t.id}
                        initial={{ y: 0, opacity: 0, scale: 0.5 }}
                        animate={{ y: -150, opacity: 1, scale: 2 }}
                        exit={{ opacity: 0 }}
                        style={{ color: t.color, fontSize: '36px', fontWeight: 900, textShadow: '0 0 20px rgba(0,0,0,0.9)', fontFamily: "'Cinzel', serif" }}
                    >
                        {t.text}
                    </motion.div>
                ))}
            </AnimatePresence>
        </div>
    );
};
