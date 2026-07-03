/* eslint-disable react-refresh/only-export-components */
import React from 'react';

// --- COMMON STYLES ---
export const contentGrid: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
    gap: '20px',
};
export const sectionStyle: React.CSSProperties = {
    background: 'rgba(255,255,255,0.02)',
    padding: '20px',
    borderRadius: '15px',
    border: '1px solid #1a1a1a',
    marginBottom: '15px',
};

export const editRow: React.CSSProperties = {
    display: 'flex',
    gap: '10px',
    alignItems: 'flex-end',
    marginBottom: '15px',
};
export const applyBtn: React.CSSProperties = {
    background: '#1b4332',
    color: '#4dff4d',
    border: 'none',
    padding: '10px 15px',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '11px',
    fontWeight: 'bold',
};
export const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '12px',
    background: '#050505',
    border: '1px solid #222',
    color: '#fff',
    borderRadius: '8px',
    fontSize: '13px',
};
export const btnStyle: React.CSSProperties = {
    background: '#111',
    color: '#fff',
    border: '1px solid #222',
    padding: '12px',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '12px',
    textAlign: 'center',
    transition: 'background 0.2s',
};
export const bigBtnStyle: React.CSSProperties = {
    width: '100%',
    padding: '15px',
    background: '#1a1a1a',
    color: '#fff',
    border: '1px solid #333',
    borderRadius: '10px',
    cursor: 'pointer',
    fontWeight: 'bold',
    fontSize: '13px',
};
export const terminalStyle: React.CSSProperties = {
    height: '150px',
    background: '#000',
    padding: '15px',
    fontSize: '11px',
    color: '#2ecc71',
    overflowY: 'auto',
    borderRadius: '8px',
    border: '1px solid #111',
    marginTop: '10px',
};
export const statBox: React.CSSProperties = {
    background: '#050505',
    padding: '15px',
    borderRadius: '10px',
    border: '1px solid #111',
    textAlign: 'center',
};
export const statLabel: React.CSSProperties = {
    fontSize: '10px',
    color: '#999',
    marginBottom: '6px',
    textTransform: 'uppercase',
};
export const smallBtnStyle: React.CSSProperties = {
    padding: '8px 15px',
    background: '#111',
    border: '1px solid #222',
    color: '#999',
    fontSize: '11px',
    borderRadius: '6px',
    cursor: 'pointer',
};

// --- BASE COMPONENTS ---
export const Section: React.FC<{ title: React.ReactNode; children: React.ReactNode }> = ({ title, children }) => (
    <div style={sectionStyle}>
        <div
            style={{
                fontSize: '11px',
                color: '#333',
                marginBottom: '15px',
                borderBottom: '1px solid #111',
                textTransform: 'uppercase',
                letterSpacing: '1px',
                fontWeight: 'bold',
            }}
        >
            {title}
        </div>
        {children}
    </div>
);

export const ToggleRow: React.FC<{ label: string; active: boolean; onToggle: () => void }> = ({
    label,
    active,
    onToggle,
}) => (
    <div
        onClick={onToggle}
        style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '15px',
            background: '#080808',
            borderRadius: '10px',
            cursor: 'pointer',
            marginBottom: '8px',
            border: active ? '1px solid #ff4d4d' : '1px solid #1a1a1a',
            transition: 'border 0.2s',
        }}
    >
        <span style={{ fontSize: '12px', fontWeight: 'bold', color: active ? '#fff' : '#666' }}>{label}</span>
        <div
            style={{
                width: '40px',
                height: '20px',
                background: active ? '#ff4d4d' : '#222',
                borderRadius: '10px',
                position: 'relative',
                transition: 'background 0.3s',
            }}
        >
            <div
                style={{
                    width: '16px',
                    height: '16px',
                    background: '#fff',
                    borderRadius: '50%',
                    position: 'absolute',
                    top: '2px',
                    left: active ? '22px' : '2px',
                    transition: 'left 0.3s',
                }}
            />
        </div>
    </div>
);

export interface RealPlayer {
    id: string;
    vkId: number;
    name: string;
    photo: string;
    status: 'ONLINE' | 'OFFLINE' | 'BANNED' | 'BATTLE';
    screen: string;
    level: number;
    gold: number;
    crystals: number;
    regDate: string;
    reports: number;
    reportLogs: string[];
    gear: {
        weapon?: string;
        helm?: string;
        armor?: string;
        shield?: string;
    };
    isTest?: boolean;
    isDev?: boolean;
    lastSeenTime: string;
    rating: number;
    vipLevel: number;
    isVipActive: boolean;
    vipDaysRemaining: number;
    energy: number;
    maxEnergy: number;
    inventory: any[];
    talentPoints: number;
    hasInfiniteEnergy: boolean;
}

export const mapRawPlayerToRealPlayer = (p: any): RealPlayer => {
    const nameVal = p.name || p.имя || 'Unknown';
    const photoVal = p.avatar || p.фото || p.photo || 'https://vk.com/images/camera_100.png';
    const activeScreenVal = p.activeScreen || p.активныйЭкран || 'MAP';
    const lastSeenMillis = p.wasOnline?.toMillis?.() || p.былВСети?.toMillis?.() || p.lastSeen?.toMillis?.() || 0;
    const isOnline = lastSeenMillis > 0 && (Date.now() - lastSeenMillis < 300000);
    const statusVal = !isOnline ? 'OFFLINE' : (activeScreenVal === 'BATTLE' ? 'BATTLE' : 'ONLINE');

    // Парсим полноеСостояниеJSON / fullStateJSON для получения актуальных значений ресурсов игрока в реальном времени
    let parsedState: any = {};
    const stateJson = p.fullStateJSON || p.полноеСостояниеJSON;
    if (stateJson) {
        try {
            parsedState = JSON.parse(stateJson);
        } catch (e) {
            console.error('Failed to parse state JSON in AdminPanel', e);
        }
    }

    const activeHero = p.hero || parsedState.selectedHeroId || p.герой || 'panda';
    const gearVal =
        p.equipment ||
        (parsedState.heroEquipment && parsedState.heroEquipment[activeHero]
            ? parsedState.heroEquipment[activeHero]
            : p.снаряжение || p.геройСнаряжение || {});

    const lastSeenDate =
        (p.wasOnline || p.былВСети || p.lastSeen)?.toDate?.() || (lastSeenMillis ? new Date(lastSeenMillis) : null);
    const lastSeenTimeVal = lastSeenDate
        ? lastSeenDate.toLocaleString('ru-RU', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
          })
        : 'неизвестно';

    const ratingVal =
        p.rating !== undefined ? p.rating : parsedState.rating !== undefined ? parsedState.rating : p.рейтинг || 0;
    const vipLevelVal =
        p.vipLevel !== undefined ? p.vipLevel : parsedState.vipLevel !== undefined ? parsedState.vipLevel : 0;

    const vipEndTime = p.vipEndTime || parsedState.vipEndTime || 0;
    const isVipActiveVal = p.isVipActive !== undefined ? p.isVipActive : vipLevelVal > 0 && vipEndTime > Date.now();
    const vipDaysRemainingVal =
        p.vipDaysRemaining !== undefined
            ? p.vipDaysRemaining
            : isVipActiveVal
              ? Math.ceil((vipEndTime - Date.now()) / (24 * 60 * 60 * 1000))
              : 0;

    const energyVal = p.energy !== undefined ? p.energy : parsedState.energy !== undefined ? parsedState.energy : 0;
    const maxEnergyVal =
        p.maxEnergy !== undefined ? p.maxEnergy : parsedState.maxEnergy !== undefined ? parsedState.maxEnergy : 0;
    const inventoryVal = p.inventory || parsedState.inventory || p.инвентарь || [];

    return {
        id: p.id,
        vkId: p.vkId || 0,
        name: nameVal,
        photo: photoVal,
        status: p.status === 'BANNED' ? 'BANNED' : statusVal,
        screen: activeScreenVal,
        level:
            p.level !== undefined
                ? p.level
                : parsedState.level !== undefined
                  ? parsedState.level
                  : p.уровень || p.лев || 1,
        gold:
            p.gold !== undefined
                ? p.gold
                : parsedState.gold !== undefined
                  ? parsedState.gold
                  : p.золото !== undefined
                    ? p.золото
                    : 0,
        crystals:
            p.crystals !== undefined
                ? p.crystals
                : parsedState.crystals !== undefined
                  ? parsedState.crystals
                  : p.кристаллы !== undefined
                    ? p.кристаллы
                    : 0,
        regDate: lastSeenTimeVal,
        reports: p.reports || 0,
        reportLogs: p.reportLogs || [],
        gear: gearVal as any,
        isTest: p.isTestPlayer !== undefined ? p.isTestPlayer : p.тестовый || false,
        isDev: p.isDeveloper !== undefined ? p.isDeveloper : p.разработчик || false,
        lastSeenTime: lastSeenTimeVal,
        rating: ratingVal,
        vipLevel: vipLevelVal,
        isVipActive: isVipActiveVal,
        vipDaysRemaining: vipDaysRemainingVal,
        energy: energyVal,
        maxEnergy: maxEnergyVal,
        inventory: inventoryVal,
        talentPoints: p.talentPoints !== undefined ? p.talentPoints : parsedState.talentPoints || 0,
        hasInfiniteEnergy:
            p.hasInfiniteEnergy !== undefined ? p.hasInfiniteEnergy : parsedState.hasInfiniteEnergy || false,
    };
};
