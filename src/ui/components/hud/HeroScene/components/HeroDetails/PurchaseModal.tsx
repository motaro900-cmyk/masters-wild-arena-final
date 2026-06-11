import { motion } from 'framer-motion';
import { useGameStore } from '../../../../../../store/useGameStore';
import { audioService } from '../../../../../../services/AudioService';
import { AssetsMap } from '../../../../../../configs/AssetsMap';
import { resolveAssetPath } from '../../../../../../utils/assetPath';
import { getRankInfo } from '../../../../../../configs/RankSystem';

export const PurchaseModal = ({ hero, onClose, rarityColors }: any) => {
    const { gold, crystals, rating, unlockHero, spendGold, spendDiamonds } = useGameStore();
    const color = rarityColors[hero.rarity];

    const priceDiamonds = hero.unlockCost || 0;
    const priceGold     = hero.unlockGoldCost || 0;

    const hasEnoughGold     = priceGold > 0 && gold >= priceGold;
    const hasEnoughDiamonds = priceDiamonds > 0 && crystals >= priceDiamonds;
    const hasEnoughTrophies = !hero.requiredTrophies || rating >= hero.requiredTrophies;

    const buyWith = (currency: 'gold' | 'diamonds') => {
        if (!hasEnoughTrophies) { audioService.playSFX('SFX_ERROR'); return; }
        unlockHero(hero.id);
        if (currency === 'gold')     spendGold(priceGold);
        if (currency === 'diamonds') spendDiamonds(priceDiamonds);
        audioService.playSFX('SFX_BUY');
        useGameStore.setState({ selectedHeroId: hero.id, heroGalleryId: hero.id });
        onClose();
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
                position: 'fixed', inset: 0, zIndex: 20000,
                background: 'rgba(0,0,0,0.85)',
                backdropFilter: 'blur(10px)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
            onClick={onClose}
        >
            <motion.div
                initial={{ scale: 0.8, y: 50 }}
                animate={{ scale: 1, y: 0 }}
                onClick={(e) => e.stopPropagation()}
                style={{
                    width: '460px',
                    background: 'rgba(18,17,22,0.97)',
                    borderRadius: '24px',
                    border: `2px solid ${color}55`,
                    padding: '36px 36px 32px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '22px',
                    boxShadow: `0 30px 100px rgba(0,0,0,0.9), 0 0 60px ${color}18`,
                }}
            >
                {/* ── Заголовок ── */}
                <div style={{ textAlign: 'center' }}>
                    <div style={{ color: color, fontSize: '11px', fontWeight: 900, letterSpacing: '4px', marginBottom: '8px' }}>
                        ПОДТВЕРЖДЕНИЕ ПОКУПКИ
                    </div>
                    <div style={{ color: '#fff', fontSize: '30px', fontWeight: 900, fontFamily: "'Cinzel', serif" }}>
                        {hero.name}
                    </div>
                </div>

                {/* ── Арт ── */}
                <img
                    src={resolveAssetPath(hero.image)}
                    style={{ width: '200px', filter: `drop-shadow(0 0 28px ${color}44)` }}
                    alt=""
                />

                {/* ── Требование кубков ── */}
                {hero.requiredTrophies && (
                    <div style={{
                        display: 'flex', alignItems: 'center', gap: '8px',
                        background: hasEnoughTrophies ? 'rgba(34,197,94,0.07)' : 'rgba(239,68,68,0.07)',
                        border: `1px solid ${hasEnoughTrophies ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.35)'}`,
                        borderRadius: '10px', padding: '8px 16px', width: '100%',
                    }}>
                        <img
                            src={resolveAssetPath(AssetsMap.UI.TROPHY_PREMIUM)}
                            style={{ width: '18px', height: '18px', objectFit: 'contain' }}
                            alt="trophy"
                        />
                        <span style={{ color: hasEnoughTrophies ? 'rgba(255,255,255,0.6)' : '#f87171', fontSize: '11px', fontWeight: 700, flex: 1 }}>
                            Требуется ранг <strong style={{ color: hasEnoughTrophies ? '#4ade80' : '#f87171' }}>{getRankInfo(hero.requiredTrophies).name}</strong>
                        </span>
                        <span style={{ fontSize: '11px', fontWeight: 900, color: hasEnoughTrophies ? '#4ade80' : '#f87171', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            {rating} / {hero.requiredTrophies}
                            <img
                                src={resolveAssetPath(AssetsMap.UI.TROPHY_PREMIUM)}
                                style={{ width: '14px', height: '14px', objectFit: 'contain' }}
                                alt="trophy"
                            />
                        </span>
                    </div>
                )}

                {/* ── Постоянство ── */}
                <div style={{
                    display: 'flex', alignItems: 'center', gap: '6px',
                    background: 'rgba(34,197,94,0.06)',
                    border: '1px solid rgba(34,197,94,0.2)',
                    borderRadius: '10px', padding: '7px 14px', width: '100%',
                }}>
                    <span style={{ fontSize: '14px' }}>🔓</span>
                    <span style={{ color: 'rgba(255,255,255,0.45)', fontSize: '10px', fontWeight: 700, lineHeight: 1.4 }}>
                        Герой <strong style={{ color: '#4ade80' }}>навсегда</strong> — не блокируется после сброса кубков
                    </span>
                </div>

                {/* ── Кнопки покупки ── */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', width: '100%' }}>

                    {/* За золото */}
                    {priceGold > 0 && (
                        <motion.button
                            whileHover={hasEnoughTrophies && hasEnoughGold ? { scale: 1.03, boxShadow: '0 0 24px rgba(241,196,15,0.35)' } : {}}
                            whileTap={hasEnoughTrophies && hasEnoughGold ? { scale: 0.96 } : {}}
                            onClick={() => hasEnoughGold && buyWith('gold')}
                            disabled={!hasEnoughGold || !hasEnoughTrophies}
                            style={{
                                width: '100%',
                                padding: '15px 20px',
                                borderRadius: '14px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                background: hasEnoughGold && hasEnoughTrophies
                                    ? 'linear-gradient(135deg, rgba(241,196,15,0.15) 0%, rgba(243,156,18,0.08) 100%)'
                                    : 'rgba(255,255,255,0.02)',
                                border: hasEnoughGold && hasEnoughTrophies
                                    ? '1.5px solid rgba(241,196,15,0.5)'
                                    : '1.5px solid rgba(255,255,255,0.07)',
                                cursor: hasEnoughGold && hasEnoughTrophies ? 'pointer' : 'not-allowed',
                                transition: 'all 0.2s',
                            }}
                        >
                            {/* Левая часть — иконка + цена */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <img
                                    src={resolveAssetPath(AssetsMap.UI.ICON_GOLD_FULL)}
                                    style={{ width: '28px', height: '28px', objectFit: 'contain' }}
                                    alt=""
                                />
                                <span style={{
                                    fontSize: '22px',
                                    fontWeight: 900,
                                    fontFamily: "'Nunito', sans-serif",
                                    color: hasEnoughGold && hasEnoughTrophies ? '#f1c40f' : 'rgba(255,255,255,0.2)',
                                }}>
                                    {priceGold.toLocaleString('ru-RU')}
                                </span>
                            </div>
                            {/* Правая часть — статус */}
                            <span style={{
                                fontSize: '11px',
                                fontWeight: 900,
                                color: hasEnoughGold ? '#4ade80' : '#f87171',
                                letterSpacing: '0.5px',
                            }}>
                                {hasEnoughGold ? '✓ ХВАТАЕТ' : '✗ МАЛО'}
                            </span>
                        </motion.button>
                    )}

                    {/* Разделитель "или" если есть оба варианта */}
                    {priceGold > 0 && priceDiamonds > 0 && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.07)' }} />
                            <span style={{ color: 'rgba(255,255,255,0.25)', fontSize: '11px', fontWeight: 700, letterSpacing: '1px' }}>ИЛИ</span>
                            <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.07)' }} />
                        </div>
                    )}

                    {/* За алмазы */}
                    {priceDiamonds > 0 && (
                        <motion.button
                            whileHover={hasEnoughTrophies && hasEnoughDiamonds ? { scale: 1.03, boxShadow: '0 0 24px rgba(168,85,247,0.35)' } : {}}
                            whileTap={hasEnoughTrophies && hasEnoughDiamonds ? { scale: 0.96 } : {}}
                            onClick={() => hasEnoughDiamonds && buyWith('diamonds')}
                            disabled={!hasEnoughDiamonds || !hasEnoughTrophies}
                            style={{
                                width: '100%',
                                padding: '15px 20px',
                                borderRadius: '14px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                background: hasEnoughDiamonds && hasEnoughTrophies
                                    ? 'linear-gradient(135deg, rgba(168,85,247,0.15) 0%, rgba(124,58,237,0.08) 100%)'
                                    : 'rgba(255,255,255,0.02)',
                                border: hasEnoughDiamonds && hasEnoughTrophies
                                    ? '1.5px solid rgba(168,85,247,0.5)'
                                    : '1.5px solid rgba(255,255,255,0.07)',
                                cursor: hasEnoughDiamonds && hasEnoughTrophies ? 'pointer' : 'not-allowed',
                                transition: 'all 0.2s',
                            }}
                        >
                            {/* Левая — иконка + цена */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <img
                                    src={resolveAssetPath(AssetsMap.UI.ICON_ALMAZ_FULL)}
                                    style={{ width: '28px', height: '28px', objectFit: 'contain' }}
                                    alt=""
                                />
                                <span style={{
                                    fontSize: '22px',
                                    fontWeight: 900,
                                    fontFamily: "'Nunito', sans-serif",
                                    color: hasEnoughDiamonds && hasEnoughTrophies ? '#c084fc' : 'rgba(255,255,255,0.2)',
                                }}>
                                    {priceDiamonds}
                                </span>
                            </div>
                            {/* Правая — статус */}
                            <span style={{
                                fontSize: '11px',
                                fontWeight: 900,
                                color: hasEnoughDiamonds ? '#4ade80' : '#f87171',
                                letterSpacing: '0.5px',
                            }}>
                                {hasEnoughDiamonds ? '✓ ХВАТАЕТ' : '✗ МАЛО'}
                            </span>
                        </motion.button>
                    )}
                </div>

                {/* ── Кнопка отмены ── */}
                <motion.button
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.96 }}
                    onClick={onClose}
                    style={{
                        width: '100%',
                        padding: '14px 0',
                        borderRadius: '12px',
                        background: 'rgba(255,255,255,0.04)',
                        border: '1px solid rgba(255,255,255,0.09)',
                        color: 'rgba(255,255,255,0.4)',
                        fontSize: '12px',
                        fontWeight: 900,
                        cursor: 'pointer',
                        fontFamily: "'Cinzel', serif",
                        letterSpacing: '2px',
                        marginTop: '-4px',
                    }}
                >
                    ОТМЕНА
                </motion.button>
            </motion.div>
        </motion.div>
    );
};
