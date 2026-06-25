import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { audioService } from '../../../services/AudioService';
import { AssetsMap } from '../../../configs/AssetsMap';
import { useGameStore } from '../../../store/useGameStore';
import { syncService, SyncService } from '../../../services/SyncService';
import { LegalModal } from '../LegalDocuments';

interface IntroScreenProps {
    onComplete: () => void;
}

export const IntroScreen: React.FC<IntroScreenProps> = ({ onComplete }) => {
    const [step, setStep] = useState(1);
    const storeName = useGameStore((state) => state.name);
    const [nickname, setNickname] = useState(storeName && storeName !== 'Мастер' ? storeName : '');
    const [isChecking, setIsChecking] = useState(false);
    const [error, setError] = useState('');
    const [legalAccepted, setLegalAccepted] = useState(false);
    const [openDoc, setOpenDoc] = useState<'privacy' | 'terms' | null>(null);
    const [isTransitioning, setIsTransitioning] = useState(false);
    const isMobile = useGameStore((state) => state.isMobile);
    const backgroundSrc = isMobile ? AssetsMap.BACKGROUNDS.MAIN_MENU_MOBILE : AssetsMap.BACKGROUNDS.MAIN_MENU;
    const changeName = useGameStore((state) => state.changeName);

    const hasPrepopulated = React.useRef(false);

    React.useEffect(() => {
        if (step === 4 && !hasPrepopulated.current) {
            hasPrepopulated.current = true;
            const currentStoreName = useGameStore.getState().name;
            const vkUser = useGameStore.getState().vkUser;
            const defaultName =
                currentStoreName && currentStoreName !== 'Мастер' ? currentStoreName : vkUser?.firstName || '';

            if (defaultName) {
                setTimeout(() => {
                    setNickname(defaultName);
                }, 0);
            }
        }
    }, [step]);

    const validateNickname = async (name: string) => {
        if (!name) {
            return 'Имя должно быть от 2 до 15 символов';
        }
        const cleanName = name.trim();
        if (cleanName.length < 2 || cleanName.length > 15) {
            return 'Имя должно быть от 2 до 15 символов';
        }

        // Простая проверка на запрещенные слова (мат)
        const forbidden = [
            'хуй',
            'пизд',
            'еблан',
            'сука',
            'бля',
            'блять',
            'админ',
            'gm',
            'admin',
            'moder',
            'очко',
            'гнида',
            'мразь',
            'шлюха',
            'vk',
            'вконтакте',
        ];
        const lowerName = cleanName.toLowerCase();
        if (forbidden.some((word) => lowerName.includes(word))) {
            return 'Имя содержит недопустимые слова';
        }

        // Проверка на разрешенные символы
        const nameRegex = /^[a-zA-Zа-яА-Я0-9\s]+$/;
        if (!nameRegex.test(cleanName)) {
            return 'Только буквы и цифры';
        }

        // Проверка на уникальность
        setIsChecking(true);
        const store = useGameStore.getState();
        const currentUserId = SyncService.getPrefixedUserId(store.vkUser, store.playerId);
        const guestUserId = SyncService.getPrefixedUserId(null, store.playerId);
        const isUnique = await syncService.isNicknameUnique(cleanName, currentUserId, guestUserId);
        setIsChecking(false);
        if (!isUnique) {
            return 'Это имя уже занято другим мастером';
        }

        return '';
    };

    const nextStep = async () => {
        if (isTransitioning) return;
        setIsTransitioning(true);
        setTimeout(() => setIsTransitioning(false), 400);

        // Request fullscreen on first interaction
        if (step === 1) {
            audioService.resumeContext();
            if (AssetsMap?.AUDIO?.MUSIC_LIST && !audioService.isPlaying()) {
                audioService.playPlaylist(AssetsMap.AUDIO.MUSIC_LIST);
            }

            const doc = document.documentElement;
            const isFirstLaunch = !useGameStore.getState().name || useGameStore.getState().name === 'Мастер';
            const isLocalhost =
                typeof window !== 'undefined' &&
                (window.location.hostname === 'localhost' ||
                    window.location.hostname === '127.0.0.1' ||
                    window.location.protocol === 'file:');

            if (doc.requestFullscreen && !document.fullscreenElement && isFirstLaunch && !isLocalhost) {
                doc.requestFullscreen().catch(() => console.warn('Fullscreen denied'));
            }
        }

        if (step === 4) {
            if (!legalAccepted) {
                setError('Необходимо принять Пользовательское соглашение и Политику конфиденциальности');
                audioService.playSFX(AssetsMap.AUDIO.SFX_ERROR || '');
                return;
            }
            const validationError = await validateNickname(nickname);
            if (validationError) {
                setError(validationError);
                audioService.playSFX(AssetsMap.AUDIO.SFX_ERROR || '');
                return;
            }

            // Сохраняем имя и завершаем onboarding
            changeName(nickname);
            const store = useGameStore.getState();
            if (store.setOnboardingCompleted) {
                store.setOnboardingCompleted(true);
            } else {
                useGameStore.setState({ onboardingCompleted: true });
                syncService.debouncedSync();
            }

            // Send welcome mail to Firestore
            const currentUserId = SyncService.getPrefixedUserId(store.vkUser, store.playerId);
            const welcomeMail = {
                id: 'welcome-mail',
                tab: 'INBOX',
                type: 'SYSTEM',
                from: 'МУДРЫЙ ФИЛИН',
                subject: 'ПРИВЕТСТВЕННЫЙ ПОДАРOК!',
                body: 'Приветствуем тебя, защитник Диких Земель! Рады видеть тебя в нашей дружной игре Masters of the Wild. Мы подготовили для тебя этот приятный подарок в знак нашего гостеприимства и поддержки на старте твоего путешествия. Пусть эти ресурсы принесут тебе удачу в первых битвах, а твоё восхождение к вершинам Арены будет увлекательным и славным! Исследуй мир, находи верных друзей и побеждай!',
                date: 'СЕГОДНЯ',
                isRead: false,
                isStarred: false,
                timestamp: Date.now(),
                expiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000,
                rewards: [
                    { type: 'GOLD', amount: 1000 },
                    { type: 'CRYSTALS', amount: 50 },
                ],
            };
            syncService
                .sendMail(currentUserId, welcomeMail)
                .catch((e) => console.error('Failed to send welcome mail:', e));

            useGameStore.setState({ tutorialStep: 0 });
            audioService.playSFX(AssetsMap.AUDIO.SFX_CLICK);
            onComplete();
            return;
        }

        if (step < 4) {
            setStep(step + 1);
            audioService.playSFX(AssetsMap.AUDIO.SFX_CLICK);
        }
    };

    return (
        <div
            style={{
                position: 'absolute',
                inset: 0,
                width: '100%',
                height: '100%',
                zIndex: 9999,
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
                backgroundColor: '#000',
                fontFamily: "'Cinzel', serif",
                pointerEvents: 'auto',
            }}
        >
            {/* Возрастной ценз для модерации VK */}
            <div className="absolute top-4 right-4 bg-black/60 text-gray-400 text-xs font-bold border border-gray-700 px-2 py-1 rounded z-20">
                12+
            </div>
            {/* BACKGROUND IMAGE */}
            <img
                src={backgroundSrc}
                alt="background"
                style={{
                    position: 'absolute',
                    inset: 0,
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    opacity: step === 1 ? 0.3 : 0.4,
                    transition: 'opacity 1.5s ease',
                }}
            />

            <div
                style={{
                    position: 'absolute',
                    inset: 0,
                    background: 'radial-gradient(circle at center, rgba(0,0,0,0) 0%, rgba(0,0,0,0.85) 100%)',
                    pointerEvents: 'none',
                }}
            />

            <div
                style={{
                    position: 'relative',
                    zIndex: 10,
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: isMobile ? 'flex-start' : 'center',
                    color: 'white',
                    padding: isMobile ? '20px 12px 10px 12px' : '40px',
                }}
            >
                <div
                    style={{
                        width: '100%',
                        flex: 1,
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: isMobile ? 'flex-start' : 'center',
                        overflowY: 'auto',
                        padding: '10px 0',
                        marginBottom: '10px',
                    }}
                    className="custom-scrollbar"
                >
                    <AnimatePresence mode="wait">
                        {step === 1 && (
                            <motion.div
                                key="step1"
                                initial={{ opacity: 0, scale: 0.98 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 1.02 }}
                                style={{
                                    textAlign: 'center',
                                    maxWidth: '1100px',
                                    margin: '0 auto',
                                    background: 'rgba(0,0,0,0.7)',
                                    backdropFilter: 'blur(30px)',
                                    padding: isMobile ? '20px 16px' : '30px 40px',
                                    borderRadius: isMobile ? '24px' : '40px',
                                    border: '1px solid rgba(200,149,42,0.4)',
                                    boxShadow: '0 25px 100px rgba(0,0,0,0.8)',
                                }}
                            >
                                <div
                                    style={{
                                        color: '#ffd700',
                                        fontSize: isMobile ? '13px' : '18px',
                                        letterSpacing: '0.4em',
                                        marginBottom: '15px',
                                        textTransform: 'uppercase',
                                    }}
                                >
                                    Легенда о Диких Земелях
                                </div>
                                <h1
                                    style={{
                                        fontSize: isMobile ? '24px' : '42px',
                                        margin: '0 0 20px 0',
                                        lineHeight: 1.1,
                                        textShadow: '0 5px 15px rgba(0,0,0,1)',
                                    }}
                                >
                                    Добро пожаловать, путник!
                                </h1>
                                <p
                                    style={{
                                        fontSize: isMobile ? '14px' : '18px',
                                        lineHeight: 1.6,
                                        color: 'rgba(255,255,255,0.9)',
                                        textAlign: 'justify',
                                    }}
                                >
                                    Перед тобой простираются Дикие Земли — древний мир, где гармония природы и сила
                                    тотемов веками оберегали жизнь от тьмы. Но пришел час испытаний: Скверна проникает в
                                    некогда священные леса, оскверняя разум диких зверей и разрушая древние алтари.{' '}
                                    <br />
                                    <br />
                                    Мастера Дикой Природы должны объединиться, чтобы противостоять этой угрозе. Тебе
                                    предстоит пробудить силу древних тотемов, призвать могучих чемпионов и повести их на
                                    Арену, чтобы доказать право называться истинным Хранителем Диких Земель. <br />
                                    <br />
                                    Собери свою волю в кулак, выбери верную тактику снаряжения и впиши свое имя в
                                    летопись побед Арены!
                                </p>
                            </motion.div>
                        )}

                        {step === 2 && (
                            <motion.div
                                key="step2"
                                initial={{ opacity: 0, x: 30 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -30 }}
                                style={{
                                    textAlign: 'center',
                                    maxWidth: '1100px',
                                    margin: '0 auto',
                                    background: 'rgba(0,0,0,0.65)',
                                    backdropFilter: 'blur(25px)',
                                    padding: isMobile ? '20px 16px' : '40px 60px',
                                    borderRadius: isMobile ? '24px' : '45px',
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    boxShadow: '0 20px 80px rgba(0,0,0,0.6)',
                                }}
                            >
                                <div
                                    style={{
                                        color: '#ffd700',
                                        fontSize: isMobile ? '15px' : '22px',
                                        letterSpacing: isMobile ? '0.2em' : '0.5em',
                                        marginBottom: '20px',
                                        textTransform: 'uppercase',
                                    }}
                                >
                                    Основы Мастерства
                                </div>
                                <h2
                                    style={{
                                        fontSize: isMobile ? '26px' : '48px',
                                        marginBottom: isMobile ? '15px' : '30px',
                                        color: 'white',
                                    }}
                                >
                                    Что нужно знать?
                                </h2>
                                <div
                                    style={{
                                        textAlign: 'left',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: isMobile ? '12px' : '20px',
                                    }}
                                >
                                    <div
                                        style={{
                                            background: 'rgba(255,255,255,0.05)',
                                            padding: isMobile ? '12px 14px' : '20px',
                                            borderRadius: '20px',
                                            borderLeft: '4px solid #ffd700',
                                        }}
                                    >
                                        <strong style={{ color: '#ffd700', fontSize: isMobile ? '16px' : '22px' }}>
                                            🛡️ Победа в подготовке:
                                        </strong>{' '}
                                        <span style={{ fontSize: isMobile ? '13px' : '18px', color: '#ddd' }}>
                                            Битвы на арене проходят автоматически. Твоя главная задача — собрать
                                            идеальный билд из оружия и доспехов *до* начала боя.
                                        </span>
                                    </div>
                                    <div
                                        style={{
                                            background: 'rgba(255,255,255,0.05)',
                                            padding: isMobile ? '12px 14px' : '20px',
                                            borderRadius: '20px',
                                            borderLeft: '4px solid #ffd700',
                                        }}
                                    >
                                        <strong style={{ color: '#ffd700', fontSize: isMobile ? '16px' : '22px' }}>
                                            ⚡ Баланс характеристик:
                                        </strong>{' '}
                                        <span style={{ fontSize: isMobile ? '13px' : '18px', color: '#ddd' }}>
                                            Сила увеличивает урон, Ловкость — шанс крита и скорость, а Стойкость — твое
                                            здоровье. Ищи баланс, подходящий под твоего героя.
                                        </span>
                                    </div>
                                    <div
                                        style={{
                                            background: 'rgba(255,255,255,0.05)',
                                            padding: isMobile ? '12px 14px' : '20px',
                                            borderRadius: '20px',
                                            borderLeft: '4px solid #ffd700',
                                        }}
                                    >
                                        <strong style={{ color: '#ffd700', fontSize: isMobile ? '16px' : '22px' }}>
                                            📜 Квесты и Энергия:
                                        </strong>{' '}
                                        <span style={{ fontSize: isMobile ? '13px' : '18px', color: '#ddd' }}>
                                            Каждый бой тратит энергию. Выполняй ежедневные квесты — это твой главный
                                            источник золота и алмазов.
                                        </span>
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {step === 3 && (
                            <motion.div
                                key="step3"
                                initial={{ opacity: 0, scale: 1.1 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                style={{
                                    maxWidth: '1300px',
                                    width: '100%',
                                    padding: isMobile ? '20px 16px' : '40px',
                                    margin: '0 auto',
                                    background: 'rgba(0,0,0,0.5)',
                                    backdropFilter: 'blur(15px)',
                                    borderRadius: '40px',
                                    border: '1px solid rgba(255,255,255,0.1)',
                                }}
                            >
                                <h2
                                    style={{
                                        fontSize: isMobile ? '26px' : '42px',
                                        textAlign: 'center',
                                        marginBottom: isMobile ? '20px' : '40px',
                                        color: '#ffd700',
                                    }}
                                >
                                    Путеводитель Мастера
                                </h2>
                                <div
                                    style={{
                                        display: 'grid',
                                        gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
                                        gap: isMobile ? '12px' : '30px',
                                    }}
                                >
                                    <GuideItem
                                        title="ГЕРОИ"
                                        desc="Твой чемпион. Нанимай и повышай уровень могучих воинов: от верного Панды Фэн Луна до благородного Льва Аурелиуса и свирепого Минотавра Громма."
                                        isMobile={isMobile}
                                    />
                                    <GuideItem
                                        title="МАГАЗИН"
                                        desc="Снаряжение и ресурсы. Здесь ты найдешь всё необходимое для подготовки к битвам: от простых клинков до редких доспехов и эликсиров энергии."
                                        isMobile={isMobile}
                                    />
                                    <GuideItem
                                        title="РАНГИ"
                                        desc="Путь к славе. Сражайся на Арене, зарабатывай рейтинг и кубки, поднимаясь от скромного Странника до великой Легенды Арены!"
                                        isMobile={isMobile}
                                    />
                                    <GuideItem
                                        title="КУЗНИЦА"
                                        desc="Снаряжение и ковка. Переплавляй ненужные предметы в Кузнице, создавая легендарное снаряжение и многократно усиливая боевую мощь твоего Героя."
                                        isMobile={isMobile}
                                    />
                                </div>
                            </motion.div>
                        )}

                        {step === 4 && (
                            <motion.div
                                key="step4"
                                initial={{ opacity: 0, y: 50 }}
                                animate={{ opacity: 1, y: 0 }}
                                style={{
                                    textAlign: 'center',
                                    maxWidth: '900px',
                                    margin: '0 auto',
                                    background: 'rgba(10, 7, 5, 0.95)',
                                    backdropFilter: 'blur(40px)',
                                    padding: isMobile ? '24px 20px 30px 20px' : '50px 70px',
                                    borderRadius: isMobile ? '28px' : '60px',
                                    border: '2px solid #c8952a',
                                    boxShadow: '0 0 120px rgba(200,149,42,0.25)',
                                }}
                            >
                                <div
                                    style={{
                                        color: '#ffd700',
                                        fontSize: 'clamp(14px, 3.5vw, 20px)',
                                        letterSpacing: isMobile ? '0.4em' : '0.8em',
                                        marginBottom: isMobile ? '10px' : '20px',
                                        textTransform: 'uppercase',
                                        fontWeight: 900,
                                    }}
                                >
                                    Печать Судьбы
                                </div>
                                <h2
                                    style={{
                                        fontSize: 'clamp(24px, 5.5vw, 56px)',
                                        marginBottom: '15px',
                                        color: 'white',
                                        textShadow: '0 4px 15px #000',
                                        fontFamily: "'Cinzel Decorative', serif",
                                    }}
                                >
                                    Твое Имя в Кодексе
                                </h2>
                                <p
                                    style={{
                                        fontSize: 'clamp(14px, 2.5vw, 22px)',
                                        color: 'rgba(255,255,255,0.8)',
                                        marginBottom: isMobile ? '15px' : '35px',
                                        lineHeight: 1.5,
                                    }}
                                >
                                    Каждый великий Мастер начинает свой путь с имени. <br />
                                    Выбери его мудро — под этим именем тебя запомнят на Арене Диких Земель.
                                </p>

                                {/* КОДЕКС ИМЕНИ (ПРАВИЛА) */}
                                <div
                                    style={{
                                        display: 'grid',
                                        gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr 1fr',
                                        gap: isMobile ? '10px' : '15px',
                                        marginBottom: isMobile ? '20px' : '35px',
                                        textAlign: 'left',
                                    }}
                                >
                                    <div
                                        style={{
                                            background: 'rgba(255,255,255,0.03)',
                                            padding: isMobile ? '10px 12px' : '15px',
                                            borderRadius: '15px',
                                            border: '1px solid rgba(200,149,42,0.2)',
                                        }}
                                    >
                                        <div
                                            style={{
                                                color: '#ffd700',
                                                fontSize: isMobile ? '12px' : '14px',
                                                fontWeight: 'bold',
                                                marginBottom: '5px',
                                            }}
                                        >
                                            📜 УНИКАЛЬНОСТЬ
                                        </div>
                                        <div
                                            style={{
                                                fontSize: isMobile ? '11px' : '12px',
                                                color: 'rgba(255,255,255,0.5)',
                                            }}
                                        >
                                            Двух одинаковых Мастеров не существует.
                                        </div>
                                    </div>
                                    <div
                                        style={{
                                            background: 'rgba(255,255,255,0.03)',
                                            padding: isMobile ? '10px 12px' : '15px',
                                            borderRadius: '15px',
                                            border: '1px solid rgba(200,149,42,0.2)',
                                        }}
                                    >
                                        <div
                                            style={{
                                                color: '#ffd700',
                                                fontSize: isMobile ? '12px' : '14px',
                                                fontWeight: 'bold',
                                                marginBottom: '5px',
                                            }}
                                        >
                                            🛡️ ЧЕСТЬ
                                        </div>
                                        <div
                                            style={{
                                                fontSize: isMobile ? '11px' : '12px',
                                                color: 'rgba(255,255,255,0.5)',
                                            }}
                                        >
                                            Без нецензурной лексики. Соблюдай правила Арены.
                                        </div>
                                    </div>
                                    <div
                                        style={{
                                            background: 'rgba(255,255,255,0.03)',
                                            padding: isMobile ? '10px 12px' : '15px',
                                            borderRadius: '15px',
                                            border: '1px solid rgba(200,149,42,0.2)',
                                        }}
                                    >
                                        <div
                                            style={{
                                                color: '#ffd700',
                                                fontSize: isMobile ? '12px' : '14px',
                                                fontWeight: 'bold',
                                                marginBottom: '5px',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '6px',
                                            }}
                                        >
                                            <img src={AssetsMap.UI.TROPHY_PREMIUM} style={{ width: '16px', height: '16px', objectFit: 'contain' }} alt="trophy" />
                                            <span>СЛАВА</span>
                                        </div>
                                        <div
                                            style={{
                                                fontSize: isMobile ? '11px' : '12px',
                                                color: 'rgba(255,255,255,0.5)',
                                            }}
                                        >
                                            Это имя увидят все соперники в таблице лидеров.
                                        </div>
                                    </div>
                                </div>

                                <div style={{ position: 'relative', marginBottom: '20px' }}>
                                    <input
                                        type="text"
                                        value={nickname}
                                        onChange={(e) => {
                                            setNickname(e.target.value);
                                            setError('');
                                        }}
                                        placeholder="Введи свое имя..."
                                        maxLength={15}
                                        style={{
                                            width: '100%',
                                            background: 'rgba(0,0,0,0.6)',
                                            border: '2px solid rgba(200,149,42,0.6)',
                                            borderRadius: isMobile ? '15px' : '25px',
                                            padding: isMobile ? '12px 20px' : '25px 35px',
                                            fontSize: 'clamp(18px, 4vw, 36px)',
                                            color: '#fff',
                                            textAlign: 'center',
                                            fontFamily: "'Cinzel', serif",
                                            outline: 'none',
                                            transition: 'all 0.3s ease',
                                            boxShadow: 'inset 0 0 30px rgba(0,0,0,0.8), 0 0 20px rgba(200,149,42,0.1)',
                                        }}
                                        onFocus={(e) => {
                                            e.target.style.borderColor = '#ffd700';
                                            e.target.style.boxShadow =
                                                'inset 0 0 30px rgba(0,0,0,0.8), 0 0 30px rgba(200,149,42,0.3)';
                                        }}
                                        onBlur={(e) => {
                                            e.target.style.borderColor = 'rgba(200,149,42,0.6)';
                                        }}
                                    />
                                    {isChecking && (
                                        <div
                                            style={{
                                                position: 'absolute',
                                                right: isMobile ? '15px' : '30px',
                                                top: '50%',
                                                transform: 'translateY(-50%)',
                                            }}
                                        >
                                            <div className="animate-spin h-6 w-6 border-3 border-[#ffd700] border-t-transparent rounded-full" />
                                        </div>
                                    )}
                                </div>

                                {error && (
                                    <motion.div
                                        initial={{ opacity: 0, y: -10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        style={{
                                            color: '#ff4444',
                                            fontSize: isMobile ? '14px' : '18px',
                                            fontWeight: 'bold',
                                            marginTop: '15px',
                                            background: 'rgba(255,0,0,0.1)',
                                            padding: '10px 20px',
                                            borderRadius: '10px',
                                            display: 'inline-block',
                                        }}
                                    >
                                        ⚠️ {error}
                                    </motion.div>
                                )}

                                {/* LEGAL CONSENT */}
                                <div
                                    style={{
                                        marginTop: isMobile ? '12px' : '20px',
                                        display: 'flex',
                                        alignItems: 'flex-start',
                                        gap: '12px',
                                        background: legalAccepted ? 'rgba(240,192,64,0.07)' : 'rgba(255,255,255,0.03)',
                                        border: `1px solid ${legalAccepted ? 'rgba(240,192,64,0.35)' : 'rgba(255,255,255,0.1)'}`,
                                        borderRadius: '14px',
                                        padding: isMobile ? '10px 12px' : '14px 18px',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s',
                                    }}
                                    onClick={() => {
                                        setLegalAccepted(!legalAccepted);
                                        setError('');
                                    }}
                                >
                                    <div
                                        style={{
                                            width: '22px',
                                            height: '22px',
                                            borderRadius: '6px',
                                            border: `2px solid ${legalAccepted ? '#f0c040' : 'rgba(255,255,255,0.3)'}`,
                                            background: legalAccepted ? '#f0c040' : 'transparent',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            flexShrink: 0,
                                            marginTop: '1px',
                                            transition: 'all 0.2s',
                                        }}
                                    >
                                        {legalAccepted && (
                                            <span style={{ color: '#1a0e05', fontSize: '14px', fontWeight: 900 }}>
                                                ✓
                                            </span>
                                        )}
                                    </div>
                                    <div
                                        style={{
                                            fontSize: isMobile ? '12px' : '13px',
                                            color: 'rgba(255,255,255,0.65)',
                                            lineHeight: 1.5,
                                            textAlign: 'left',
                                        }}
                                    >
                                        Я прочитал(а) и принимаю{' '}
                                        <span
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setOpenDoc('terms');
                                            }}
                                            style={{ color: '#f0c040', textDecoration: 'underline', cursor: 'pointer' }}
                                        >
                                            Пользовательское соглашение
                                        </span>{' '}
                                        и{' '}
                                        <span
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setOpenDoc('privacy');
                                            }}
                                            style={{ color: '#f0c040', textDecoration: 'underline', cursor: 'pointer' }}
                                        >
                                            Политику конфиденциальности
                                        </span>{' '}
                                        игры Masters of the Wild.
                                    </div>
                                </div>

                                <p
                                    style={{
                                        marginTop: isMobile ? '15px' : '25px',
                                        color: 'rgba(255,255,255,0.3)',
                                        fontSize: isMobile ? '11px' : '13px',
                                        letterSpacing: '0.1em',
                                        textTransform: 'uppercase',
                                    }}
                                >
                                    Внимательно проверь каждую букву. Назад пути не будет.
                                </p>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <div
                        style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            marginTop: '30px',
                            paddingBottom: isMobile ? '60px' : '20px',
                        }}
                    >
                        <motion.button
                            whileHover={{ scale: 1.05, boxShadow: '0 0 50px rgba(200,149,42,0.7)' }}
                            whileTap={{ scale: 0.95 }}
                            disabled={isChecking}
                            onClick={nextStep}
                            style={{
                                padding: isMobile ? '14px 40px' : '20px 80px',
                                background: isChecking ? '#333' : 'linear-gradient(135deg, #ffe082, #c8952a)',
                                border: 'none',
                                borderRadius: '12px',
                                fontSize: isMobile ? '18px' : '24px',
                                fontWeight: 'bold',
                                color: isChecking ? '#666' : '#1a0e05',
                                cursor: isChecking ? 'not-allowed' : 'pointer',
                                letterSpacing: '0.2em',
                                boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
                            }}
                        >
                            {step === 4 ? 'НАЧАТЬ ПУТЬ' : 'ДАЛЕЕ'}
                        </motion.button>

                        <div
                            style={{
                                marginTop: '15px',
                                color: 'rgba(255,255,255,0.4)',
                                fontSize: '14px',
                                letterSpacing: '0.1em',
                            }}
                        >
                            ШАГ {step} ИЗ 4
                        </div>
                    </div>
                </div>
            </div>
            <LegalModal open={openDoc} onClose={() => setOpenDoc(null)} />
        </div>
    );
};

const GuideItem = ({ title, desc, isMobile }: { title: string; desc: string; isMobile?: boolean }) => (
    <div
        style={{
            padding: isMobile ? '14px 16px' : '30px',
            background: 'rgba(255,255,255,0.04)',
            borderRadius: '25px',
            borderLeft: '5px solid #c8952a',
            boxShadow: '0 10px 20px rgba(0,0,0,0.2)',
        }}
    >
        <h4
            style={{
                margin: '0 0 10px 0',
                color: '#ffd700',
                fontSize: isMobile ? '18px' : '26px',
                letterSpacing: '0.05em',
            }}
        >
            {title}
        </h4>
        <p
            style={{
                margin: 0,
                fontSize: isMobile ? '14px' : '20px',
                lineHeight: 1.6,
                color: 'rgba(255,255,255,0.85)',
            }}
        >
            {desc}
        </p>
    </div>
);
