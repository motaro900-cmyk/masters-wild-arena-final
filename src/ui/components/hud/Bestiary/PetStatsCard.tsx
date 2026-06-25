import React from 'react';
import { AssetsMap } from '../../../../configs/AssetsMap';
import { PetProgressBar } from './PetProgressBar';
import {
    HUNGER_DECAY_INTERVAL_MS,
    HUNGER_DECAY_AMOUNT,
    HAPPY_DECAY_INTERVAL_MS,
    HAPPY_DECAY_AMOUNT,
    formatTime,
} from './useBestiary';

interface PetStatsCardProps {
    pet: any;
    currentTime: number;
}

export const PetStatsCard: React.FC<PetStatsCardProps> = ({ pet, currentTime }) => {
    return (
        <div
            style={{
                background: 'rgba(10, 8, 6, 0.65)',
                padding: '22px 28px',
                borderRadius: '24px',
                border: '2px solid rgba(196, 139, 59, 0.25)',
                boxShadow: 'inset 0 0 30px rgba(0, 0, 0, 0.8), 0 10px 30px rgba(0, 0, 0, 0.5)',
                display: 'flex',
                flexDirection: 'column',
                gap: '16px',
            }}
        >
            {/* Hunger Row */}
            {(() => {
                const msPerTick = HUNGER_DECAY_INTERVAL_MS;
                const lastDecay = pet.lastHungerDecay ?? currentTime;
                const msUntilNextTick = msPerTick - ((currentTime - lastDecay) % msPerTick);
                const ticksToSad = Math.max(0, Math.ceil((pet.hunger - 35) / HUNGER_DECAY_AMOUNT));
                const msToSad = msUntilNextTick + Math.max(0, ticksToSad - 1) * msPerTick;
                const ticksToEmpty = Math.max(0, Math.ceil(pet.hunger / HUNGER_DECAY_AMOUNT));
                const msToEmpty = msUntilNextTick + Math.max(0, ticksToEmpty - 1) * msPerTick;
                const isCritical = pet.hunger < 35;
                const isLow = pet.hunger < 60 && !isCritical;
                return (
                    <div>
                        <div
                            style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                marginBottom: '8px',
                            }}
                        >
                            <span
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    color: '#a7f3d0',
                                    fontSize: '15px',
                                    fontWeight: 800,
                                    letterSpacing: '1px',
                                }}
                            >
                                🥩 СЫТОСТЬ
                            </span>
                            <span
                                style={{
                                    color: isCritical ? '#f87171' : isLow ? '#fbbf24' : '#10b981',
                                    fontWeight: 900,
                                    fontSize: '15px',
                                }}
                            >
                                {pet.hunger}%
                            </span>
                        </div>
                        <PetProgressBar
                            value={pet.hunger}
                            max={100}
                            color={isCritical ? '#ef4444' : isLow ? '#f59e0b' : '#10b981'}
                        />
                        <div
                            style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                marginTop: '6px',
                                fontSize: '11px',
                                color: '#6b7280',
                            }}
                        >
                            <span style={{ color: isCritical ? '#f87171' : '#6b7280' }}>
                                {isCritical
                                    ? '⚠️ Голодает! Срочно накормите'
                                    : `Проголодается через ≈ ${formatTime(msToSad)}`}
                            </span>
                            <span style={{ color: '#4b5563' }}>
                                Опустеет через ≈ {pet.hunger === 0 ? 'уже пусто' : formatTime(msToEmpty)}
                            </span>
                        </div>
                    </div>
                );
            })()}

            {/* Happiness Row */}
            {(() => {
                const msPerTick = HAPPY_DECAY_INTERVAL_MS;
                const lastDecay = pet.lastHappinessDecay ?? currentTime;
                const msUntilNextTick = msPerTick - ((currentTime - lastDecay) % msPerTick);
                const ticksToSad = Math.max(0, Math.ceil((pet.happiness - 35) / HAPPY_DECAY_AMOUNT));
                const msToSad = msUntilNextTick + Math.max(0, ticksToSad - 1) * msPerTick;
                const ticksToEmpty = Math.max(0, Math.ceil(pet.happiness / HAPPY_DECAY_AMOUNT));
                const msToEmpty = msUntilNextTick + Math.max(0, ticksToEmpty - 1) * msPerTick;
                const isCritical = pet.happiness < 35;
                const isLow = pet.happiness < 60 && !isCritical;
                return (
                    <div>
                        <div
                            style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                marginBottom: '8px',
                            }}
                        >
                            <span
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    color: '#fde68a',
                                    fontSize: '15px',
                                    fontWeight: 800,
                                    letterSpacing: '1px',
                                }}
                            >
                                ❤️ СЧАСТЬЕ
                            </span>
                            <span
                                style={{
                                    color: isCritical ? '#f87171' : isLow ? '#fbbf24' : '#f59e0b',
                                    fontWeight: 900,
                                    fontSize: '15px',
                                }}
                            >
                                {pet.happiness}%
                            </span>
                        </div>
                        <PetProgressBar
                            value={pet.happiness}
                            max={100}
                            color={isCritical ? '#ef4444' : isLow ? '#fbbf24' : '#f59e0b'}
                        />
                        <div
                            style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                marginTop: '6px',
                                fontSize: '11px',
                                color: '#6b7280',
                            }}
                        >
                            <span style={{ color: isCritical ? '#f87171' : '#6b7280' }}>
                                {isCritical
                                    ? '⚠️ Грустит! Погладьте питомца'
                                    : `Загрустит через ≈ ${formatTime(msToSad)}`}
                            </span>
                            <span style={{ color: '#4b5563' }}>
                                Нулевое через ≈ {pet.happiness === 0 ? 'уже пусто' : formatTime(msToEmpty)}
                            </span>
                        </div>
                    </div>
                );
            })()}

            {/* Experience Row */}
            <div>
                <div
                    style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: '8px',
                        fontSize: '15px',
                        fontWeight: 800,
                        letterSpacing: '1px',
                    }}
                >
                    <span style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#bfdbfe' }}>
                        <img src={AssetsMap.UI.ICON_XP} style={{ width: '16px', height: '16px', objectFit: 'contain' }} alt="xp" />
                        ОПЫТ
                    </span>
                    <span style={{ color: '#3b82f6', fontWeight: 900 }}>{pet.exp} / 100</span>
                </div>
                <PetProgressBar value={pet.exp} max={100} color="#3b82f6" />
            </div>
        </div>
    );
};
