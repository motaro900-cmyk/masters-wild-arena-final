import { motion } from 'framer-motion';
import { useGameStore } from '../../../../../../store/useGameStore';
import { audioService } from '../../../../../../services/AudioService';
import { AssetsMap } from '../../../../../../configs/AssetsMap';

export const PurchaseModal = ({ hero, onClose, rarityColors }: any) => {
    const { gold, crystals, unlockHero, spendGold, spendDiamonds } = useGameStore();
    const color = rarityColors[hero.rarity];

    const price = hero.unlockCost;
    const isGold = hero.unlockType === 'gold';
    const hasEnough = isGold ? gold >= price : crystals >= price;

    const handleConfirm = () => {
        if (hasEnough) {
            unlockHero(hero.id);
            if (isGold) spendGold(price);
            else spendDiamonds(price);
            audioService.playSFX('SFX_BUY');
            onClose();
        } else {
            audioService.playSFX('SFX_ERROR');
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
                position: 'fixed',
                inset: 0,
                zIndex: 20000,
                background: 'rgba(0,0,0,0.85)',
                backdropFilter: 'blur(10px)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
            }}
            onClick={onClose}
        >
            <motion.div
                initial={{ scale: 0.8, y: 50 }}
                animate={{ scale: 1, y: 0 }}
                onClick={(e) => e.stopPropagation()}
                style={{
                    width: '500px',
                    background: 'rgba(25,25,30,0.95)',
                    borderRadius: '24px',
                    border: `2px solid ${color}66`,
                    padding: '40px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '30px',
                    boxShadow: `0 30px 100px rgba(0,0,0,0.9), 0 0 50px ${color}22`,
                }}
            >
                <div style={{ textAlign: 'center' }}>
                    <div
                        style={{
                            color: color,
                            fontSize: '12px',
                            fontWeight: 900,
                            letterSpacing: '4px',
                            marginBottom: '10px',
                        }}
                    >
                        ПОДТВЕРЖДЕНИЕ ПОКУПКИ
                    </div>
                    <div style={{ color: '#fff', fontSize: '32px', fontWeight: 900, fontFamily: "'Cinzel', serif" }}>
                        {hero.name}
                    </div>
                </div>

                <img src={hero.avatar} style={{ width: '220px', filter: `drop-shadow(0 0 30px ${color}44)` }} alt="" />

                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '15px',
                        background: 'rgba(0,0,0,0.3)',
                        padding: '15px 30px',
                        borderRadius: '16px',
                    }}
                >
                    <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '14px', fontWeight: 900 }}>ЦЕНА:</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <img
                            src={isGold ? AssetsMap.UI.ICON_GOLD_FULL : AssetsMap.UI.ICON_ALMAZ_FULL}
                            style={{ width: '32px', height: '32px' }}
                            alt=""
                        />
                        <span style={{ fontSize: '32px', fontWeight: 900, color: hasEnough ? '#fff' : '#ff4444' }}>
                            {price}
                        </span>
                    </div>
                </div>

                {!hasEnough && (
                    <div style={{ color: '#ff4444', fontSize: '12px', fontWeight: 900, letterSpacing: '1px' }}>
                        ⚠️ НЕДОСТАТОЧНО СРЕДСТВ
                    </div>
                )}

                <div style={{ display: 'flex', gap: '20px', width: '100%' }}>
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={onClose}
                        style={{
                            flex: 1,
                            padding: '18px 0',
                            borderRadius: '12px',
                            background: 'rgba(255,255,255,0.05)',
                            border: '1px solid rgba(255,255,255,0.1)',
                            color: 'rgba(255,255,255,0.6)',
                            fontSize: '12px',
                            fontWeight: 900,
                            cursor: 'pointer',
                            fontFamily: "'Cinzel', serif",
                        }}
                    >
                        ОТМЕНА
                    </motion.button>
                    <motion.button
                        whileHover={hasEnough ? { scale: 1.05, boxShadow: `0 0 20px ${color}44` } : {}}
                        whileTap={hasEnough ? { scale: 0.95 } : {}}
                        onClick={handleConfirm}
                        disabled={!hasEnough}
                        style={{
                            flex: 1,
                            padding: '18px 0',
                            borderRadius: '12px',
                            background: hasEnough
                                ? isGold
                                    ? 'linear-gradient(180deg, #f1c40f 0%, #f39c12 100%)'
                                    : 'linear-gradient(180deg, #a855f7 0%, #7c3aed 100%)'
                                : 'rgba(255,255,255,0.02)',
                            border: 'none',
                            color: hasEnough ? '#fff' : 'rgba(255,255,255,0.1)',
                            fontSize: '12px',
                            fontWeight: 900,
                            cursor: hasEnough ? 'pointer' : 'default',
                            fontFamily: "'Cinzel', serif",
                            boxShadow: hasEnough ? '0 10px 30px rgba(0,0,0,0.3)' : 'none',
                        }}
                    >
                        РАЗБЛОКИРОВАТЬ
                    </motion.button>
                </div>
            </motion.div>
        </motion.div>
    );
};
