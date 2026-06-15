import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '../../../store/useGameStore';
import { ITEMS_DATABASE } from '../../../game/configs/ItemsConfig';
import { audioService } from '../../../services/AudioService';
import { AssetsMap } from '../../../configs/AssetsMap';

// Subcomponents & Styles
import { styles } from './Forge/ForgeStyles';
import { ForgeHeader } from './Forge/ForgeHeader';
import { ForgeArsenal } from './Forge/ForgeArsenal';
import { ForgeAnvil } from './Forge/ForgeAnvil';
import { ForgeUpgradePanel } from './Forge/ForgeUpgradePanel';
import { DismantleConfirmModal, ReforgeConfirmModal, ForgeStatusModal } from './Forge/ForgeModals';

export const ForgeScreen: React.FC = () => {
    const stateStore = useGameStore();
    const {
        gold,
        crystals,
        coal,
        steel_bars,
        runic_shards,
        protection_stones,
        inventory,
        upgradeItem,
        dismantleItem,
        reforgeItem,
        goToCity,
        isMobile,
    } = stateStore;

    const [activeCategory, setActiveCategory] = useState<string>('ALL');
    const [sortBy, setSortBy] = useState<'RARITY' | 'LEVEL' | 'POWER'>('RARITY');
    const [selectedItemId, setSelectedItemId] = useState<string | null>(null);

    // Состояния модалок и эффектов
    const [isUpgrading, setIsUpgrading] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const [showDismantleConfirm, setShowDismantleConfirm] = useState(false);
    const [showReforgeConfirm, setShowReforgeConfirm] = useState(false);
    const [reforgeNewMultiplier, setReforgeNewMultiplier] = useState<number | null>(null);
    const [useProtection, setUseProtection] = useState(false);
    const [sparkPositions, setSparkPositions] = useState<{ x: number; y: number }[]>([]);

    const [statusModalConfig, setStatusModalConfig] = useState<{
        isOpen: boolean;
        title: string;
        message: string;
        type: 'success' | 'fail' | 'protection' | 'info';
        rewards?: {
            goldGained: number;
            coalGained: number;
            steelGained: number;
            shardGained: number;
        } | null;
    }>({
        isOpen: false,
        title: '',
        message: '',
        type: 'info',
        rewards: null,
    });

    // Фильтруем инвентарь по категории для предвыбора первого предмета
    const filteredInventory = useMemo(() => {
        return inventory.filter((item: any) => {
            const data = ITEMS_DATABASE[item.id] as any;
            if (!data) return false;
            const subTab = data.subTab || data.type || '';
            if (activeCategory === 'ALL')
                return ['WEAPONS', 'HELMETS', 'ARMOR', 'SHIELDS', 'SHOULDERS', 'PANTS', 'BOOTS'].includes(subTab);
            return subTab === activeCategory;
        });
    }, [inventory, activeCategory]);

    // Сортировка инвентаря
    const sortedInventory = useMemo(() => {
        return [...filteredInventory].sort((a: any, b: any) => {
            const dataA = ITEMS_DATABASE[a.id] as any;
            const dataB = ITEMS_DATABASE[b.id] as any;
            if (!dataA || !dataB) return 0;

            if (sortBy === 'LEVEL') {
                return (b.level || 1) - (a.level || 1);
            }
            const weightA =
                dataA.rarity === 'LEGENDARY' ? 4 : dataA.rarity === 'EPIC' ? 3 : dataA.rarity === 'RARE' ? 2 : 1;
            const weightB =
                dataB.rarity === 'LEGENDARY' ? 4 : dataB.rarity === 'EPIC' ? 3 : dataB.rarity === 'RARE' ? 2 : 1;
            return weightB - weightA;
        });
    }, [filteredInventory, sortBy]);

    // При первой загрузке выбираем первый предмет из отсортированного списка
    useEffect(() => {
        if (sortedInventory.length > 0 && !selectedItemId) {
            const timer = setTimeout(() => {
                setSelectedItemId(sortedInventory[0].instanceId || sortedInventory[0].id);
            }, 0);
            return () => clearTimeout(timer);
        }
    }, [sortedInventory, selectedItemId]);

    useEffect(() => {
        const timer = setTimeout(() => {
            if (isUpgrading) {
                setSparkPositions(
                    Array.from({ length: 25 }).map(() => ({
                        x: 20 + Math.random() * 60,
                        y: 20 + Math.random() * 60,
                    })),
                );
            } else {
                setSparkPositions([]);
            }
        }, 0);
        return () => clearTimeout(timer);
    }, [isUpgrading]);

    const invItem = inventory.find((i: any) => i.instanceId === selectedItemId || String(i.id) === selectedItemId);
    const itemData = invItem ? ITEMS_DATABASE[invItem.id] : null;

    const currentLevel = invItem?.level || 1;
    const maxLevel = 10;
    const isMaxLevel = currentLevel >= maxLevel;

    // Расчет требований к ресурсам
    const getUpgradeRequirements = (level: number, rarity: string) => {
        let coalCost = 10;
        let steelCost = 5;
        let shardCost = 0;
        let goldCost = 1000;

        let rareType: string | null = null;
        let rareCost = 0;

        const rarityMultiplier = rarity === 'LEGENDARY' ? 3 : rarity === 'EPIC' ? 2 : rarity === 'RARE' ? 1.5 : 1;

        if (level === 1) {
            coalCost = Math.round(10 * rarityMultiplier);
            steelCost = Math.round(4 * rarityMultiplier);
            goldCost = Math.round(1000 * rarityMultiplier);
        } else if (level === 2) {
            coalCost = Math.round(15 * rarityMultiplier);
            steelCost = Math.round(8 * rarityMultiplier);
            shardCost = rarity === 'LEGENDARY' || rarity === 'EPIC' ? 2 : 0;
            goldCost = Math.round(2000 * rarityMultiplier);
            if (rarity === 'RARE') {
                rareType = 'ancient_compass';
                rareCost = 1;
            } else if (rarity === 'EPIC') {
                rareType = 'astral_crystal';
                rareCost = 1;
            } else if (rarity === 'LEGENDARY' || rarity === 'MYTHIC') {
                rareType = 'void_sphere';
                rareCost = 1;
            }
        } else if (level === 3) {
            coalCost = Math.round(25 * rarityMultiplier);
            steelCost = Math.round(15 * rarityMultiplier);
            shardCost = rarity === 'LEGENDARY' || rarity === 'EPIC' ? 4 : 1;
            goldCost = Math.round(4000 * rarityMultiplier);
            if (rarity === 'RARE') {
                rareType = 'ancient_compass';
                rareCost = 2;
            } else if (rarity === 'EPIC') {
                rareType = 'astral_crystal';
                rareCost = 2;
            } else if (rarity === 'LEGENDARY' || rarity === 'MYTHIC') {
                rareType = 'void_sphere';
                rareCost = 2;
            }
        } else if (level === 4) {
            coalCost = Math.round(40 * rarityMultiplier);
            steelCost = Math.round(25 * rarityMultiplier);
            shardCost = rarity === 'LEGENDARY' || rarity === 'EPIC' ? 8 : 3;
            goldCost = Math.round(8000 * rarityMultiplier);
            if (rarity === 'RARE') {
                rareType = 'golden_sprout';
                rareCost = 2;
            } else if (rarity === 'EPIC') {
                rareType = 'dragon_scale';
                rareCost = 2;
            } else if (rarity === 'LEGENDARY' || rarity === 'MYTHIC') {
                rareType = 'lava_heart';
                rareCost = 2;
            }
        } else {
            const scale = level - 3;
            coalCost = Math.round(30 * scale * rarityMultiplier);
            steelCost = Math.round(18 * scale * rarityMultiplier);
            shardCost = Math.round(3 * scale * rarityMultiplier);
            goldCost = Math.round(8000 * Math.pow(1.5, scale - 1) * rarityMultiplier);

            if (rarity === 'RARE') {
                rareType = 'golden_sprout';
                rareCost = Math.min(5, scale);
            } else if (rarity === 'EPIC') {
                rareType = 'dragon_scale';
                rareCost = Math.min(5, scale);
            } else if (rarity === 'LEGENDARY' || rarity === 'MYTHIC') {
                rareType = 'lava_heart';
                rareCost = Math.min(5, scale);
            }
        }

        return { coalCost, steelCost, shardCost, goldCost, rareType, rareCost };
    };

    const reqs = itemData
        ? getUpgradeRequirements(currentLevel, itemData.rarity)
        : { coalCost: 0, steelCost: 0, shardCost: 0, goldCost: 0, rareType: null, rareCost: 0 };
    const isDiamondItem = itemData ? !!(itemData.priceGem && itemData.priceGem > 0) : false;

    let goldCost = reqs.goldCost;
    let gemCost = 0;

    if (isDiamondItem) {
        goldCost = 0;
        if (currentLevel === 1) gemCost = 75;
        else if (currentLevel === 2) gemCost = 150;
        else if (currentLevel === 3) gemCost = 300;
        else if (currentLevel === 4) gemCost = 500;
        else gemCost = Math.round(500 * Math.pow(1.4, currentLevel - 4));
    }

    const hasRareResource = !reqs.rareType || ((stateStore as any)[reqs.rareType] || 0) >= reqs.rareCost;
    const needsProtection = currentLevel >= 5;
    const hasProtectionStone = !needsProtection || !useProtection || (protection_stones || 0) >= 1;

    const canUpgrade =
        !isMaxLevel &&
        gold >= goldCost &&
        crystals >= gemCost &&
        (coal || 0) >= reqs.coalCost &&
        (steel_bars || 0) >= reqs.steelCost &&
        (runic_shards || 0) >= reqs.shardCost &&
        hasRareResource &&
        hasProtectionStone;

    const handleUpgrade = async () => {
        if (!selectedItemId || isUpgrading || !canUpgrade) return;
        setIsUpgrading(true);
        audioService.playSFX(AssetsMap.AUDIO.SFX_HIT);

        try {
            await new Promise((resolve) => setTimeout(resolve, 1500));
            const res = upgradeItem(selectedItemId, useProtection);
            if (res) {
                if (res.success) {
                    setShowSuccess(true);
                    audioService.playSFX(AssetsMap.AUDIO.SFX_BUY);
                    setTimeout(() => setShowSuccess(false), 2000);
                } else {
                    audioService.playSFX(AssetsMap.AUDIO.SFX_ERROR);
                    if (res.degraded) {
                        setStatusModalConfig({
                            isOpen: true,
                            title: 'УЛУЧШЕНИЕ НЕ УДАЛОСЬ 💥',
                            message: 'Не повезло! Уровень вашего предмета понизился.',
                            type: 'fail',
                        });
                    } else if (res.protectionUsed) {
                        setStatusModalConfig({
                            isOpen: true,
                            title: 'ПРЕДМЕТ СПАСЕН! 🛡️',
                            message: 'Улучшение не удалось, но Камень защиты спас ваш предмет от понижения уровня!',
                            type: 'protection',
                        });
                    } else {
                        setStatusModalConfig({
                            isOpen: true,
                            title: 'УЛУЧШЕНИЕ НЕ УДАЛОСЬ',
                            message: 'К сожалению, улучшить предмет не удалось. Попробуйте еще раз!',
                            type: 'fail',
                        });
                    }
                }
            }
        } catch (error) {
            console.error('[ForgeScreen] Upgrade failed:', error);
        } finally {
            setIsUpgrading(false);
        }
    };

    const handleDismantle = () => {
        if (!selectedItemId) return;
        const reward = dismantleItem(selectedItemId);
        if (reward) {
            audioService.playSFX(AssetsMap.AUDIO.SFX_BUY);
            setStatusModalConfig({
                isOpen: true,
                title: 'ПРЕДМЕТ РАЗОБРАН! ⚒️',
                message: 'Вы успешно разобрали предмет на полезные ресурсы:',
                type: 'success',
                rewards: {
                    goldGained: reward.goldGained,
                    coalGained: reward.coalGained,
                    steelGained: reward.steelGained,
                    shardGained: reward.shardGained,
                },
            });
            setSelectedItemId(null);
            setShowDismantleConfirm(false);
        }
    };

    const handleReforge = () => {
        if (!selectedItemId) return;
        const mult = reforgeItem(selectedItemId);
        if (mult) {
            setReforgeNewMultiplier(mult);
            audioService.playSFX(AssetsMap.AUDIO.SFX_HIT);
            setTimeout(() => {
                setReforgeNewMultiplier(null);
                setShowReforgeConfirm(false);
            }, 2500);
        }
    };

    // Нативный выход по ESC
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') goToCity();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [goToCity]);

    const getStatMultiplier = (lvl: number) => {
        if (lvl === 1) return 1.0;
        if (lvl === 2) return 1.15;
        if (lvl === 3) return 1.35;
        if (lvl === 4) return 1.6;
        if (lvl === 5) return 1.9;
        if (lvl === 6) return 2.25;
        if (lvl === 7) return 2.65;
        if (lvl === 8) return 3.1;
        if (lvl === 9) return 3.6;
        if (lvl === 10) return 4.2;
        return 1.0;
    };

    const itemReforgeMultiplier = invItem?.reforgeMultiplier || 1.0;

    const getStatsList = () => {
        if (!itemData) return [];
        const list = [];
        if (itemData.attackBonus) {
            list.push({ label: 'Урон', val: itemData.attackBonus, icon: '⚔️' });
            list.push({ label: 'Сила атаки', val: Math.round(itemData.attackBonus * 0.7), icon: '🔨' });
        }
        if (itemData.defenseBonus) {
            list.push({ label: 'Защита', val: itemData.defenseBonus, icon: '🛡️' });
        }
        if (itemData.hpBonus) {
            list.push({ label: 'Здоровье', val: itemData.hpBonus, icon: '❤️' });
        }
        if (itemData.critBonus) {
            list.push({
                label: 'Шанс крита',
                val: itemData.critBonus,
                icon: '🎯',
            });
        }
        return list.slice(0, 4);
    };

    const currentXp = currentLevel === 10 ? 1000 : currentLevel * 100;
    const maxXp = 1000;
    const progressXp = (currentXp / maxXp) * 100;

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={styles.screenContainer}
        >
            <div
                style={{
                    ...styles.bgOverlay,
                    background: `#0d0a08 url("${isMobile ? AssetsMap.BACKGROUNDS.FORGE_MOBILE : AssetsMap.BACKGROUNDS.FORGE}") no-repeat center/cover`,
                }}
            />

            {/* ВСПЫШКА УСПЕХА */}
            <AnimatePresence>
                {showSuccess && (
                    <motion.div
                        initial={{ opacity: 1 }}
                        animate={{ opacity: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.5 }}
                        style={{
                            position: 'absolute',
                            inset: 0,
                            background: '#fff',
                            zIndex: 9999,
                            pointerEvents: 'none',
                        }}
                    />
                )}
            </AnimatePresence>

            <ForgeHeader goToCity={goToCity} />

            <div style={styles.mainContent}>
                <ForgeArsenal
                    inventory={inventory}
                    activeCategory={activeCategory}
                    setActiveCategory={setActiveCategory}
                    sortBy={sortBy}
                    setSortBy={setSortBy}
                    selectedItemId={selectedItemId}
                    setSelectedItemId={setSelectedItemId}
                    onDismantle={() => {
                        if (selectedItemId) {
                            const heroId = stateStore.selectedHeroId || 'panda';
                            const equippedGear = stateStore.heroEquipment[heroId] || {};
                            const isEquipped = Object.values(equippedGear).includes(selectedItemId);
                            if (isEquipped) {
                                setStatusModalConfig({
                                    isOpen: true,
                                    title: 'НЕЛЬЗЯ РАЗОБРАТЬ ❌',
                                    message: 'Этот предмет сейчас надет на герое. Снимите его перед разбором!',
                                    type: 'fail',
                                });
                            } else {
                                setShowDismantleConfirm(true);
                            }
                        }
                    }}
                    onReforge={() => setShowReforgeConfirm(true)}
                />

                <ForgeAnvil
                    itemData={itemData}
                    currentLevel={currentLevel}
                    isUpgrading={isUpgrading}
                    sparkPositions={sparkPositions}
                    itemReforgeMultiplier={itemReforgeMultiplier}
                    isMaxLevel={isMaxLevel}
                    getStatsList={getStatsList}
                    getStatMultiplier={getStatMultiplier}
                />

                <ForgeUpgradePanel
                    itemData={itemData}
                    currentLevel={currentLevel}
                    currentXp={currentXp}
                    maxXp={maxXp}
                    progressXp={progressXp}
                    reqs={reqs}
                    isDiamondItem={isDiamondItem}
                    gemCost={gemCost}
                    goldCost={goldCost}
                    coal={coal}
                    steel_bars={steel_bars}
                    runic_shards={runic_shards}
                    protection_stones={protection_stones}
                    stateStore={stateStore}
                    useProtection={useProtection}
                    setUseProtection={setUseProtection}
                    canUpgrade={canUpgrade}
                    isUpgrading={isUpgrading}
                    handleUpgrade={handleUpgrade}
                    isMaxLevel={isMaxLevel}
                    itemReforgeMultiplier={itemReforgeMultiplier}
                    getStatMultiplier={getStatMultiplier}
                />
            </div>

            <DismantleConfirmModal
                isOpen={showDismantleConfirm && !!itemData}
                onClose={() => setShowDismantleConfirm(false)}
                onConfirm={handleDismantle}
                itemName={itemData?.name || ''}
            />

            <ReforgeConfirmModal
                isOpen={showReforgeConfirm && !!itemData}
                onClose={() => setShowReforgeConfirm(false)}
                onConfirm={handleReforge}
                itemName={itemData?.name || ''}
                itemReforgeMultiplier={itemReforgeMultiplier}
                reforgeNewMultiplier={reforgeNewMultiplier}
            />

            <ForgeStatusModal
                isOpen={statusModalConfig.isOpen}
                onClose={() => setStatusModalConfig((prev) => ({ ...prev, isOpen: false }))}
                title={statusModalConfig.title}
                message={statusModalConfig.message}
                type={statusModalConfig.type}
                rewards={statusModalConfig.rewards}
            />
        </motion.div>
    );
};
