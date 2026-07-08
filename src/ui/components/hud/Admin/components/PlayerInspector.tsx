import React from 'react';
import { RealPlayer, Section, statBox, statLabel } from '../AdminShared';
import { AssetsMap } from '../../../../../configs/AssetsMap';

interface PlayerInspectorProps {
    selectedPlayer: RealPlayer;
}

export const PlayerInspector: React.FC<PlayerInspectorProps> = ({ selectedPlayer }) => {
    return (
        <>
            {/* Инспектор статистики и ресурсов */}
            <Section title="ИНСПЕКТОР СТАТИСТИКИ И РЕСУРСОВ">
                <div
                    style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(4, 1fr)',
                        gap: '10px',
                    }}
                >
                    <div style={statBox}>
                        <div style={statLabel}>Уровень (LVL)</div>
                        <span
                            style={{
                                color: '#a78bfa',
                                fontWeight: 'bold',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                            }}
                        >
                            <img
                                src={AssetsMap.UI.ICON_XP}
                                alt="xp"
                                style={{ width: '16px', height: '16px', objectFit: 'contain' }}
                            />
                            {selectedPlayer.level}
                        </span>
                    </div>
                    <div style={statBox}>
                        <div style={statLabel}>Кубки (Cups)</div>
                        <span
                            style={{
                                color: '#fbbf24',
                                fontWeight: 'bold',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                            }}
                        >
                            <img
                                src={AssetsMap.UI.TROPHY_PREMIUM}
                                alt="trophy"
                                style={{ width: '16px', height: '16px', objectFit: 'contain' }}
                            />
                            {selectedPlayer.rating || 0}
                        </span>
                    </div>
                    <div style={statBox}>
                        <div style={statLabel}>Золото (Gold)</div>
                        <span
                            style={{
                                color: '#ffd700',
                                fontWeight: 'bold',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                            }}
                        >
                            <img
                                src={AssetsMap.UI.ICON_GOLD_FULL}
                                alt="gold"
                                style={{ width: '16px', height: '16px', objectFit: 'contain' }}
                            />
                            {selectedPlayer.gold.toLocaleString()}
                        </span>
                    </div>
                    <div style={statBox}>
                        <div style={statLabel}>Кристаллы (Gems)</div>
                        <span
                            style={{
                                color: '#00ffff',
                                fontWeight: 'bold',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                            }}
                        >
                            <img
                                src={AssetsMap.UI.ICON_ALMAZ_FULL}
                                alt="crystals"
                                style={{ width: '16px', height: '16px', objectFit: 'contain' }}
                            />
                            {selectedPlayer.crystals.toLocaleString()}
                        </span>
                    </div>
                    <div style={statBox}>
                        <div style={statLabel}>Энергия (Energy)</div>
                        <span
                            style={{
                                color: '#38bdf8',
                                fontWeight: 'bold',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                            }}
                        >
                            <img
                                src={AssetsMap.UI.ICON_ENERGY_FULL}
                                alt="energy"
                                style={{ width: '16px', height: '16px', objectFit: 'contain' }}
                            />
                            {selectedPlayer.energy ?? 0} / {selectedPlayer.maxEnergy ?? 0}
                        </span>
                    </div>
                    <div style={statBox}>
                        <div style={statLabel}>VIP Статус</div>
                        <span
                            style={{
                                color: selectedPlayer.isVipActive ? '#f43f5e' : '#888',
                                fontWeight: 'bold',
                                fontSize: '11px',
                            }}
                        >
                            👑{' '}
                            {selectedPlayer.vipLevel > 0
                                ? `${selectedPlayer.isVipActive ? 'Активен' : 'Истёк'} (LVL ${selectedPlayer.vipLevel}, ${selectedPlayer.vipDaysRemaining} дн)`
                                : 'Нет VIP'}
                        </span>
                    </div>
                    <div style={statBox}>
                        <div style={statLabel}>Экран (Screen)</div>
                        <span style={{ color: '#10b981', fontWeight: 'bold', fontSize: '11px' }}>
                            🖥️ {selectedPlayer.screen}
                        </span>
                    </div>
                    <div style={statBox}>
                        <div style={statLabel}>Жалобы (Reports)</div>
                        <span
                            style={{
                                color: selectedPlayer.reports > 0 ? '#ff4d4d' : '#888',
                                fontWeight: 'bold',
                            }}
                        >
                            🚨 {selectedPlayer.reports}
                        </span>
                    </div>
                </div>
            </Section>

            {/* Инвентарь */}
            <Section title="ИНВЕНТАРЬ (Inventory)">
                {selectedPlayer.inventory && selectedPlayer.inventory.length > 0 ? (
                    <div
                        style={{
                            display: 'flex',
                            flexWrap: 'wrap',
                            gap: '8px',
                            maxHeight: '120px',
                            overflowY: 'auto',
                            padding: '5px',
                        }}
                    >
                        {selectedPlayer.inventory.map((item: any, idx: number) => {
                            const itemName =
                                typeof item === 'string' ? item : item.id || item.name || JSON.stringify(item);
                            const count = typeof item === 'object' && item.count !== undefined ? ` x${item.count}` : '';
                            return (
                                <div
                                    key={idx}
                                    style={{
                                        background: '#121212',
                                        border: '1px solid #333',
                                        borderRadius: '6px',
                                        padding: '6px 12px',
                                        fontSize: '11px',
                                        color: '#e0e0e0',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '4px',
                                    }}
                                >
                                    📦 <span>{itemName}</span>
                                    <strong style={{ color: '#fbbf24' }}>{count}</strong>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div style={{ color: '#555', fontSize: '12px', fontStyle: 'italic', padding: '10px' }}>
                        Инвентарь пуст
                    </div>
                )}
            </Section>

            {/* Инспектор (Stats & Gear dump) */}
            <Section title="ИНСПЕКТОР (Stats & Gear)">
                <div
                    style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(4, 1fr)',
                        gap: '10px',
                        marginBottom: '15px',
                    }}
                >
                    <div style={statBox}>
                        <div style={statLabel}>GOLD</div>
                        <span
                            style={{
                                color: '#ffd700',
                                fontWeight: 'bold',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                            }}
                        >
                            <img
                                src={AssetsMap.UI.ICON_GOLD_FULL}
                                alt="gold"
                                style={{ width: '16px', height: '16px', objectFit: 'contain' }}
                            />
                            {selectedPlayer.gold.toLocaleString()}
                        </span>
                    </div>
                    <div style={statBox}>
                        <div style={statLabel}>GEMS</div>
                        <span
                            style={{
                                color: '#00ffff',
                                fontWeight: 'bold',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                            }}
                        >
                            <img
                                src={AssetsMap.UI.ICON_ALMAZ_FULL}
                                alt="gems"
                                style={{ width: '16px', height: '16px', objectFit: 'contain' }}
                            />
                            {selectedPlayer.crystals.toLocaleString()}
                        </span>
                    </div>
                    <div style={statBox}>
                        <div style={statLabel}>LVL</div>
                        <span
                            style={{
                                color: '#a78bfa',
                                fontWeight: 'bold',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                            }}
                        >
                            <img
                                src={AssetsMap.UI.ICON_XP}
                                alt="xp"
                                style={{ width: '16px', height: '16px', objectFit: 'contain' }}
                            />
                            {selectedPlayer.level}
                        </span>
                    </div>
                    <div style={statBox}>
                        <div style={statLabel}>LOCATION</div>
                        <span style={{ color: '#60a5fa', fontWeight: 'bold' }}>📍 {selectedPlayer.screen}</span>
                    </div>
                </div>
                <div style={statLabel}>GEAR DUMP:</div>
                <div
                    style={{
                        display: 'flex',
                        gap: '8px',
                        background: '#050505',
                        padding: '12px',
                        borderRadius: '8px',
                        border: '1px solid #111',
                    }}
                >
                    {['WEAPONS', 'HELMETS', 'ARMOR', 'SHIELDS', 'SHOULDERS', 'PANTS', 'BOOTS'].map((slot) => (
                        <div
                            key={slot}
                            style={{
                                flex: 1,
                                height: '50px',
                                background: '#111',
                                border: '1px solid #222',
                                borderRadius: '4px',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                                textAlign: 'center',
                                minWidth: '50px',
                            }}
                        >
                            <div
                                style={{
                                    fontSize: '6px',
                                    color: '#444',
                                    textTransform: 'uppercase',
                                }}
                            >
                                {slot}
                            </div>
                            <div style={{ fontSize: '8px', color: '#888', wordBreak: 'break-all' }}>
                                {(selectedPlayer.gear as any)[slot] || 'EMPTY'}
                            </div>
                        </div>
                    ))}
                </div>
            </Section>
        </>
    );
};
