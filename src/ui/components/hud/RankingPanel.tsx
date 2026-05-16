import { resolveAssetPath } from '../../../utils/assetPath';
import { useGameStore } from '../../../store/useGameStore';
import { getRankInfo } from '../../../configs/RankSystem';

interface RankingPanelProps {
    onClose: () => void;
    onStartSearch: () => void;
}

export const RankingPanel: React.FC<RankingPanelProps> = ({ onClose, onStartSearch }) => {
    const { rating, wins, totalBattles } = useGameStore();
    const rankInfo = getRankInfo(rating);
    const winrate = totalBattles > 0 ? Math.round((wins / totalBattles) * 100) : 0;

    // Порог следующего ранга (условно +1000 к текущему или по системе)
    const nextRankTrophies = (Math.floor(rating / 1000) + 1) * 1000;

    return (
        <div
            style={{
                position: 'absolute',
                inset: 0,
                backgroundColor: 'rgba(0,0,0,0.85)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 1000,
                pointerEvents: 'auto',
            }}
        >
            {/* ИСПОЛЬЗУЕМ ПРАВИЛЬНЫЙ СПРАЙТ ПЕРГАМЕНТА */}
            <div style={{ position: 'relative', width: '600px', height: '700px' }}>
                <img src={resolveAssetPath('/assets/images/ui/btn_panel_mis12c.png')} alt="ranking parchment" />

                {/* КОНТЕНТ ПОВЕРХ ПЕРГАМЕНТА */}
                <div
                    style={{
                        position: 'absolute',
                        inset: 0,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        padding: '80px 60px',
                    }}
                >
                    <h2
                        style={{
                            color: '#451a03',
                            fontSize: '32px',
                            fontWeight: 900,
                            marginBottom: '40px',
                            fontFamily: 'Russo One, sans-serif',
                        }}
                    >
                        РЕЙТИНГ
                    </h2>

                    <div
                        style={{
                            width: '100%',
                            color: '#451a03',
                            fontSize: '20px',
                            fontWeight: 'bold',
                            display: 'flex',
                            justifyContent: 'space-between',
                            marginBottom: '20px',
                        }}
                    >
                        <span>ТЕКУЩИЙ РАНГ:</span>
                        <span style={{ color: rankInfo.color, textShadow: '1px 1px 0 rgba(0,0,0,0.2)' }}>
                            {rankInfo.name.toUpperCase()}
                        </span>
                    </div>

                    <div
                        style={{
                            width: '100%',
                            color: '#451a03',
                            fontSize: '20px',
                            fontWeight: 'bold',
                            display: 'flex',
                            justifyContent: 'space-between',
                            marginBottom: '20px',
                        }}
                    >
                        <span>КУБКИ:</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ color: '#c48b3b' }}>
                                {rating} / {nextRankTrophies}
                            </span>
                            <img
                                src={resolveAssetPath('/assets/images/ui/trophy_premium.png')}
                                alt="trophy"
                                style={{ width: '24px', height: '24px', objectFit: 'contain' }}
                            />
                        </div>
                    </div>

                    <div
                        style={{
                            width: '100%',
                            color: '#451a03',
                            fontSize: '20px',
                            fontWeight: 'bold',
                            display: 'flex',
                            justifyContent: 'space-between',
                            marginBottom: '60px',
                        }}
                    >
                        <span>ВИНРЕЙТ:</span>
                        <span style={{ color: '#c48b3b' }}>{winrate}%</span>
                    </div>

                    <button
                        onClick={onStartSearch}
                        style={{
                            width: '100%',
                            height: '80px',
                            background: 'linear-gradient(180deg, #d97706 0%, #92400e 100%)',
                            border: '3px solid #fcd34d',
                            borderRadius: '12px',
                            color: '#fff',
                            fontSize: '28px',
                            fontWeight: 900,
                            cursor: 'pointer',
                            boxShadow: '0 4px 15px rgba(0,0,0,0.5)',
                            fontFamily: 'Russo One, sans-serif',
                            marginBottom: '20px',
                        }}
                        className="hover:scale-105 transition-transform"
                    >
                        ВСТУПИТЬ В БОЙ
                    </button>

                    <button
                        onClick={onClose}
                        style={{
                            background: 'none',
                            border: 'none',
                            color: '#78350f',
                            fontSize: '16px',
                            fontWeight: 'bold',
                            cursor: 'pointer',
                            textDecoration: 'underline',
                        }}
                    >
                        ВЕРНУТЬСЯ НАЗАД
                    </button>
                </div>
            </div>
        </div>
    );
};
