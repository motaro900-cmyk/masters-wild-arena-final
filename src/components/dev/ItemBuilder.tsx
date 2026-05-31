import React, { useState, useMemo } from 'react';
import { ItemPreview, ItemPreviewData } from './ItemPreview';
import { rawItemsDatabase } from '../../game/configs/items/index';

interface RarityRule {
    minLvl: number;
    maxLvl: number;
    currencies: string[];
    minGold?: number;
    maxGold?: number;
    minGem?: number;
    maxGem?: number;
}

// Price ranges by rarity from template
const RARITY_RULES: Record<'COMMON' | 'RARE' | 'EPIC' | 'LEGENDARY' | 'MYTHIC', RarityRule> = {
    COMMON: { minLvl: 1, maxLvl: 9, currencies: ['gold'], minGold: 1000, maxGold: 5000 },
    RARE: {
        minLvl: 10,
        maxLvl: 20,
        currencies: ['gold', 'gem'],
        minGold: 8000,
        maxGold: 25000,
        minGem: 150,
        maxGem: 300,
    },
    EPIC: {
        minLvl: 25,
        maxLvl: 45,
        currencies: ['gold', 'gem'],
        minGold: 30000,
        maxGold: 80000,
        minGem: 300,
        maxGem: 800,
    },
    LEGENDARY: { minLvl: 50, maxLvl: 60, currencies: ['gem'], minGem: 800, maxGem: 3000 },
    MYTHIC: { minLvl: 65, maxLvl: 80, currencies: ['gem'], minGem: 3000, maxGem: 8000 },
};

export const ItemBuilder: React.FC<{ onClose?: () => void }> = ({ onClose }) => {
    // Form fields
    const [id, setId] = useState('weapon_sword_shadow');
    const [name, setName] = useState('Теневой Клинок');
    const [description, setDescription] = useState(
        'Этот клинок был выкован в глубинах Бездны и поглощает свет вокруг себя.',
    );
    const [subTab, setSubTab] = useState<'WEAPONS' | 'HELMETS' | 'ARMOR' | 'SHOULDERS' | 'PANTS' | 'BOOTS' | 'SHIELDS'>(
        'WEAPONS',
    );
    const [rarity, setRarity] = useState<'COMMON' | 'RARE' | 'EPIC' | 'LEGENDARY' | 'MYTHIC'>('EPIC');
    const [requiredLevel, setRequiredLevel] = useState<number>(30);
    const [currency, setCurrency] = useState<'gold' | 'gem'>('gold');
    const [price, setPrice] = useState<number>(50000);
    const [image, setImage] = useState('weapon_sword_shadow.png');

    // Stats fields
    const [attack, setAttack] = useState<number>(25);
    const [defense, setDefense] = useState<number>(0);
    const [health, setHealth] = useState<number>(0);
    const [speed, setSpeed] = useState<number>(5);
    const [critChance, setCritChance] = useState<number>(10);
    const [critDamage, setCritDamage] = useState<number>(0);

    const [copied, setCopied] = useState(false);

    // Auto-adjust currency if selected rarity changes and doesn't support the current currency
    const handleRarityChange = (newRarity: 'COMMON' | 'RARE' | 'EPIC' | 'LEGENDARY' | 'MYTHIC') => {
        setRarity(newRarity);
        const rules = RARITY_RULES[newRarity];

        // Auto update level to mid-range
        const midLvl = Math.round((rules.minLvl + rules.maxLvl) / 2);
        setRequiredLevel(midLvl);

        // Auto update currency and price
        if (rules.currencies.length === 1) {
            const allowed = rules.currencies[0];
            setCurrency(allowed as 'gold' | 'gem');
            if (allowed === 'gold') {
                setPrice(rules.minGold || 1000);
            } else {
                setPrice(rules.minGem || 150);
            }
        } else {
            // RARE or EPIC
            if (currency === 'gold') {
                setPrice(rules.minGold || 8000);
            } else {
                setPrice(rules.minGem || 150);
            }
        }
    };

    // Calculate dynamic validations & recommendations
    const { recommendations, warnings, alternationStatus } = useMemo(() => {
        const recs: string[] = [];
        const warns: string[] = [];
        let altStatus = '';

        // 1. Level check
        const rules = RARITY_RULES[rarity];
        recs.push(`Рекомендуемый уровень для ${rarity}: ${rules.minLvl}-${rules.maxLvl}`);
        if (requiredLevel < rules.minLvl || requiredLevel > rules.maxLvl) {
            warns.push(
                `⚠️ Требуемый уровень (${requiredLevel}) выходит за рамки для редкости ${rarity} (${rules.minLvl}-${rules.maxLvl})`,
            );
        }

        // 2. Currency check
        if (currency === 'gold' && !rules.currencies.includes('gold')) {
            warns.push(`⚠️ Редкость ${rarity} НЕ может продаваться за золото. Должны быть Кристаллы 💎`);
        }
        if (currency === 'gem' && !rules.currencies.includes('gem')) {
            warns.push(`⚠️ Редкость ${rarity} НЕ может продаваться за кристаллы. Должно быть Золото 🪙`);
        }

        // 3. Price range check
        if (currency === 'gold' && rules.minGold && rules.maxGold) {
            recs.push(`Рекомендуемая цена: ${rules.minGold.toLocaleString()} - ${rules.maxGold.toLocaleString()} 🪙`);
            if (price < rules.minGold || price > rules.maxGold) {
                warns.push(
                    `⚠️ Цена (${price.toLocaleString()} 🪙) вне рекомендуемого диапазона для ${rarity} (${rules.minGold.toLocaleString()} - ${rules.maxGold.toLocaleString()} 🪙)`,
                );
            }
        } else if (currency === 'gem' && rules.minGem && rules.maxGem) {
            recs.push(`Рекомендуемая цена: ${rules.minGem.toLocaleString()} - ${rules.maxGem.toLocaleString()} 💎`);
            if (price < rules.minGem || price > rules.maxGem) {
                warns.push(
                    `⚠️ Цена (${price.toLocaleString()} 💎) вне рекомендуемого диапазона для ${rarity} (${rules.minGem.toLocaleString()} - ${rules.maxGem.toLocaleString()} 💎)`,
                );
            }
        }

        // 4. Alternation logic (only for RARE and EPIC)
        if (rarity === 'RARE' || rarity === 'EPIC') {
            const sameLvlItems = Object.values(rawItemsDatabase).filter(
                (item) => item.subTab === subTab && item.requiredLevel === requiredLevel,
            );

            if (sameLvlItems.length > 0) {
                // sort items or check the last one in the database configuration order
                const lastItem = sameLvlItems[sameLvlItems.length - 1];
                const lastWasGold = lastItem.priceGold !== undefined && lastItem.priceGold > 0;
                const nextCurrency = lastWasGold ? 'gem' : 'gold';

                altStatus = `Найдено ${sameLvlItems.length} предм. этой категории на ур. ${requiredLevel}. Последний предмет был за ${lastWasGold ? 'Золото 🪙' : 'Кристаллы 💎'}.`;

                if (currency !== nextCurrency) {
                    warns.push(
                        `⚠️ Нарушение чередования! Для категории ${subTab} уровня ${requiredLevel} рекомендуется валюта: ${nextCurrency === 'gold' ? 'Золото 🪙' : 'Кристаллы 💎'}`,
                    );
                }
            } else {
                altStatus = `Нет предметов в категории ${subTab} на уровне ${requiredLevel}. Чередование не требуется.`;
            }
        }

        return { recommendations: recs, warnings: warns, alternationStatus: altStatus };
    }, [rarity, requiredLevel, currency, price, subTab]);

    // Construct Preview Data Object
    const previewItem: ItemPreviewData = {
        id,
        name,
        description,
        type: 'EQUIPMENT',
        subTab,
        rarity,
        requiredLevel,
        priceGold: currency === 'gold' ? price : undefined,
        priceGem: currency === 'gem' ? price : undefined,
        stats: {
            attack: attack || undefined,
            defense: defense || undefined,
            health: health || undefined,
            speed: speed || undefined,
            critChance: critChance || undefined,
            critDamage: critDamage || undefined,
        },
        image,
    };

    // Code output generator
    const codeSnippet = `{
  id: '${id}',
  name: '${name}',
  description: '${description}',
  type: 'EQUIPMENT',
  subTab: '${subTab}',
  rarity: '${rarity}',
  requiredLevel: ${requiredLevel},
  
  // Цена:
  ${currency === 'gold' ? `priceGold: ${price},` : `priceGem: ${price},`}
  
  // Статы предмета:
  stats: {
    attack: ${attack || 0},
    defense: ${defense || 0},
    health: ${health || 0},
    speed: ${speed || 0},
    critChance: ${critChance || 0},
    critDamage: ${critDamage || 0},
  },
  
  image: '${image}',
}`;

    const handleCopy = () => {
        navigator.clipboard.writeText(codeSnippet);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                width: '100vw',
                height: '100vh',
                zIndex: 99999,
                background: 'rgba(5, 5, 5, 0.98)',
                display: 'flex',
                flexDirection: 'column',
                overflowY: 'auto',
                color: '#fff',
                fontFamily: "'Nunito', sans-serif",
            }}
        >
            {/* Top Toolbar */}
            <div
                style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '15px 30px',
                    borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                    background: 'linear-gradient(90deg, rgba(20,20,20,1) 0%, rgba(35,35,40,1) 100%)',
                }}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '24px' }}>🛠️</span>
                    <div>
                        <h2
                            style={{
                                margin: 0,
                                fontSize: '20px',
                                fontWeight: 800,
                                color: '#f0c040',
                                fontFamily: "'Cinzel', serif",
                            }}
                        >
                            Item Builder
                        </h2>
                        <span style={{ fontSize: '11px', color: '#888' }}>
                            Инструмент быстрого добавления новых предметов
                        </span>
                    </div>
                </div>
                {onClose && (
                    <button
                        onClick={onClose}
                        style={{
                            background: '#e11d48',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '8px',
                            padding: '8px 16px',
                            fontSize: '13px',
                            fontWeight: 700,
                            cursor: 'pointer',
                            transition: 'background 0.2s',
                            boxShadow: '0 4px 10px rgba(225, 29, 72, 0.3)',
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = '#be123c')}
                        onMouseLeave={(e) => (e.currentTarget.style.background = '#e11d48')}
                    >
                        Закрыть ✖
                    </button>
                )}
            </div>

            {/* Split Screen Container */}
            <div
                style={{
                    display: 'flex',
                    flex: 1,
                    flexDirection: 'row',
                    flexWrap: 'wrap',
                    padding: '30px',
                    gap: '30px',
                    boxSizing: 'border-box',
                }}
            >
                {/* Form Column */}
                <div
                    style={{
                        flex: '1 1 500px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '20px',
                        background: 'rgba(255, 255, 255, 0.02)',
                        padding: '25px',
                        borderRadius: '16px',
                        border: '1px solid rgba(255, 255, 255, 0.05)',
                        boxSizing: 'border-box',
                    }}
                >
                    <h3
                        style={{
                            margin: 0,
                            borderBottom: '1px solid rgba(255,255,255,0.1)',
                            paddingBottom: '10px',
                            color: '#f0c040',
                        }}
                    >
                        Конфигурация параметров
                    </h3>

                    {/* Basic Info Row */}
                    <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
                        <div style={{ flex: 1, minWidth: '200px' }}>
                            <label style={labelStyle}>ID Предмета</label>
                            <input type="text" style={inputStyle} value={id} onChange={(e) => setId(e.target.value)} />
                        </div>
                        <div style={{ flex: 1, minWidth: '200px' }}>
                            <label style={labelStyle}>Название</label>
                            <input
                                type="text"
                                style={inputStyle}
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Desc & Image */}
                    <div>
                        <label style={labelStyle}>Описание</label>
                        <textarea
                            style={{ ...inputStyle, height: '60px', resize: 'vertical' }}
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                        />
                    </div>

                    {/* Category, Rarity, Level */}
                    <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
                        <div style={{ flex: 1, minWidth: '130px' }}>
                            <label style={labelStyle}>Категория (subTab)</label>
                            <select
                                style={inputStyle}
                                value={subTab}
                                onChange={(e) => setSubTab(e.target.value as any)}
                            >
                                <option value="WEAPONS">WEAPONS (Оружие)</option>
                                <option value="HELMETS">HELMETS (Шлемы)</option>
                                <option value="ARMOR">ARMOR (Доспехи)</option>
                                <option value="SHOULDERS">SHOULDERS (Наплечники)</option>
                                <option value="PANTS">PANTS (Поножи)</option>
                                <option value="BOOTS">BOOTS (Обувь)</option>
                                <option value="SHIELDS">SHIELDS (Щиты)</option>
                            </select>
                        </div>

                        <div style={{ flex: 1, minWidth: '130px' }}>
                            <label style={labelStyle}>Редкость</label>
                            <select
                                style={inputStyle}
                                value={rarity}
                                onChange={(e) => handleRarityChange(e.target.value as any)}
                            >
                                <option value="COMMON">COMMON (Обычный)</option>
                                <option value="RARE">RARE (Редкий)</option>
                                <option value="EPIC">EPIC (Эпический)</option>
                                <option value="LEGENDARY">LEGENDARY (Легендарный)</option>
                                <option value="MYTHIC">MYTHIC (Мифический)</option>
                            </select>
                        </div>

                        <div style={{ flex: 1, minWidth: '100px' }}>
                            <label style={labelStyle}>Требуемый ур. (1-80)</label>
                            <input
                                type="number"
                                min={1}
                                max={80}
                                style={inputStyle}
                                value={requiredLevel}
                                onChange={(e) =>
                                    setRequiredLevel(Math.max(1, Math.min(80, parseInt(e.target.value) || 1)))
                                }
                            />
                        </div>
                    </div>

                    {/* Price and Currency */}
                    <div
                        style={{
                            background: 'rgba(255, 255, 255, 0.02)',
                            padding: '15px',
                            borderRadius: '10px',
                            border: '1px solid rgba(255, 255, 255, 0.05)',
                        }}
                    >
                        <label style={{ ...labelStyle, marginBottom: '10px' }}>Стоимость предмета</label>
                        <div style={{ display: 'flex', gap: '15px', alignItems: 'center', marginBottom: '12px' }}>
                            <button
                                type="button"
                                onClick={() => setCurrency('gold')}
                                style={currencyBtnStyle(currency === 'gold', '#f0c040')}
                            >
                                Золото 🪙
                            </button>
                            <button
                                type="button"
                                onClick={() => setCurrency('gem')}
                                style={currencyBtnStyle(currency === 'gem', '#3b82f6')}
                            >
                                Кристаллы 💎
                            </button>
                            <div style={{ flex: 1 }}>
                                <input
                                    type="number"
                                    min={0}
                                    style={inputStyle}
                                    value={price}
                                    onChange={(e) => setPrice(Math.max(0, parseInt(e.target.value) || 0))}
                                />
                            </div>
                        </div>

                        {/* Rules, Alternation, and Validation boxes */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '12px' }}>
                            {alternationStatus && (
                                <div
                                    style={{
                                        color: '#a855f7',
                                        background: 'rgba(168, 85, 247, 0.05)',
                                        padding: '6px 10px',
                                        borderRadius: '6px',
                                        border: '1px solid rgba(168, 85, 247, 0.2)',
                                    }}
                                >
                                    ℹ️ <strong>Чередование:</strong> {alternationStatus}
                                </div>
                            )}
                            {recommendations.map((rec, i) => (
                                <div
                                    key={i}
                                    style={{
                                        color: '#4ade80',
                                        background: 'rgba(74, 222, 128, 0.05)',
                                        padding: '6px 10px',
                                        borderRadius: '6px',
                                        border: '1px solid rgba(74, 222, 128, 0.2)',
                                    }}
                                >
                                    💡 {rec}
                                </div>
                            ))}
                            {warnings.map((warn, i) => (
                                <div
                                    key={i}
                                    style={{
                                        color: '#ef4444',
                                        background: 'rgba(239, 68, 68, 0.07)',
                                        padding: '8px 12px',
                                        borderRadius: '6px',
                                        border: '1px solid rgba(239, 68, 68, 0.3)',
                                    }}
                                >
                                    {warn}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Stats configuration */}
                    <div>
                        <label style={{ ...labelStyle, marginBottom: '10px' }}>Характеристики предмета</label>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
                            <div>
                                <label style={smallLabelStyle}>⚔️ Атака</label>
                                <input
                                    type="number"
                                    style={inputStyle}
                                    value={attack}
                                    onChange={(e) => setAttack(parseInt(e.target.value) || 0)}
                                />
                            </div>
                            <div>
                                <label style={smallLabelStyle}>🛡️ Защита</label>
                                <input
                                    type="number"
                                    style={inputStyle}
                                    value={defense}
                                    onChange={(e) => setDefense(parseInt(e.target.value) || 0)}
                                />
                            </div>
                            <div>
                                <label style={smallLabelStyle}>❤️ Здоровье</label>
                                <input
                                    type="number"
                                    style={inputStyle}
                                    value={health}
                                    onChange={(e) => setHealth(parseInt(e.target.value) || 0)}
                                />
                            </div>
                            <div>
                                <label style={smallLabelStyle}>⚡ Скорость (%)</label>
                                <input
                                    type="number"
                                    style={inputStyle}
                                    value={speed}
                                    onChange={(e) => setSpeed(parseInt(e.target.value) || 0)}
                                />
                            </div>
                            <div>
                                <label style={smallLabelStyle}>🎯 Крит. Шанс (%)</label>
                                <input
                                    type="number"
                                    style={inputStyle}
                                    value={critChance}
                                    onChange={(e) => setCritChance(parseInt(e.target.value) || 0)}
                                />
                            </div>
                            <div>
                                <label style={smallLabelStyle}>💥 Крит. Урон</label>
                                <input
                                    type="number"
                                    style={inputStyle}
                                    value={critDamage}
                                    onChange={(e) => setCritDamage(parseInt(e.target.value) || 0)}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Sprite file */}
                    <div>
                        <label style={labelStyle}>Имя спрайта (в assets)</label>
                        <input
                            type="text"
                            style={inputStyle}
                            value={image}
                            onChange={(e) => setImage(e.target.value)}
                            placeholder="example_item_sprite.png"
                        />
                    </div>
                </div>

                {/* Live Preview and Code Output Column */}
                <div
                    style={{
                        flex: '1 1 400px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '20px',
                        boxSizing: 'border-box',
                    }}
                >
                    {/* Live Preview Container */}
                    <div>
                        <ItemPreview item={previewItem} />
                    </div>

                    {/* Output Code Container */}
                    <div
                        style={{
                            background: '#151518',
                            borderRadius: '16px',
                            border: '1px solid rgba(255, 255, 255, 0.08)',
                            padding: '20px',
                            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.6)',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '12px',
                        }}
                    >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: '14px', fontWeight: 800, color: '#f0c040' }}>
                                Готовый TS-код объекта
                            </span>
                            <button
                                onClick={handleCopy}
                                style={{
                                    background: copied ? '#22c55e' : 'rgba(240, 192, 64, 0.15)',
                                    color: copied ? '#fff' : '#f0c040',
                                    border: `1px solid ${copied ? '#22c55e' : '#f0c040'}`,
                                    borderRadius: '6px',
                                    padding: '5px 12px',
                                    fontSize: '12px',
                                    fontWeight: 700,
                                    cursor: 'pointer',
                                    transition: 'all 0.2s',
                                }}
                            >
                                {copied ? 'Код скопирован! ✓' : 'Скопировать код 📋'}
                            </button>
                        </div>
                        <pre
                            style={{
                                margin: 0,
                                background: '#0a0a0c',
                                padding: '15px',
                                borderRadius: '8px',
                                border: '1px solid rgba(255, 255, 255, 0.05)',
                                overflowX: 'auto',
                                fontSize: '12px',
                                lineHeight: '1.5',
                                color: '#34d399',
                                fontFamily: 'Consolas, Monaco, monospace',
                                maxHeight: '300px',
                            }}
                        >
                            <code>{codeSnippet}</code>
                        </pre>
                    </div>
                </div>
            </div>
        </div>
    );
};

// Internal Style Utilities
const labelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: '13px',
    fontWeight: 700,
    color: '#ccc',
    marginBottom: '6px',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
};

const smallLabelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: '11px',
    fontWeight: 700,
    color: '#aaa',
    marginBottom: '4px',
};

const inputStyle: React.CSSProperties = {
    width: '100%',
    background: '#121214',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '8px',
    padding: '8px 12px',
    color: '#fff',
    fontSize: '14px',
    boxSizing: 'border-box',
    outline: 'none',
    transition: 'border-color 0.2s',
};

const currencyBtnStyle = (active: boolean, color: string): React.CSSProperties => ({
    background: active ? `${color}20` : 'transparent',
    border: `1.5px solid ${active ? color : 'rgba(255,255,255,0.15)'}`,
    color: active ? '#fff' : '#aaa',
    borderRadius: '8px',
    padding: '8px 16px',
    fontSize: '13px',
    fontWeight: 800,
    cursor: 'pointer',
    transition: 'all 0.2s',
});
