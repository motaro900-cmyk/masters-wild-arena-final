import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
// @ts-ignore
import mainBg from '../../../assets/backgrounds/main-bg.jpg';

interface IntroScreenProps {
  onComplete: () => void;
}

export const IntroScreen: React.FC<IntroScreenProps> = ({ onComplete }) => {
  const [step, setStep] = useState(1);

  const nextStep = () => {
    if (step < 3) setStep(step + 1);
    else onComplete();
  };

  return (
    <div style={{
      position: 'absolute',
      inset: 0,
      width: '1920px',
      height: '1080px',
      zIndex: 9999,
      overflow: 'hidden',
      display: 'flex', 
      backgroundColor: '#000',
      fontFamily: "'Cinzel', serif"
    }}>
      {/* BACKGROUND IMAGE */}
      <img 
        src={mainBg} 
        alt="background" 
        style={{
          position: 'absolute', 
          inset: 0, 
          width: '100%', 
          height: '100%', 
          objectFit: 'cover', 
          opacity: step === 1 ? 0.3 : (step === 2 ? 0.4 : 0.4),
          transition: 'opacity 1.5s ease'
        }}
      />

      <div style={{
        position: 'absolute',
        inset: 0,
        background: 'radial-gradient(circle at center, rgba(0,0,0,0) 0%, rgba(0,0,0,0.85) 100%)',
        pointerEvents: 'none'
      }} />

      <div style={{ 
        position: 'relative', 
        zIndex: 10, 
        width: '100%', 
        height: '100%', 
        display: 'flex', 
        flexDirection: 'column',
        alignContent: 'center',
        justifyContent: 'center',
        color: 'white'
      }}>
        
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
                padding: '60px 80px', 
                borderRadius: '50px', 
                border: '1px solid rgba(200,149,42,0.4)',
                boxShadow: '0 25px 100px rgba(0,0,0,0.8)'
              }}
            >
              <div style={{ color: '#ffd700', fontSize: '22px', letterSpacing: '0.6em', marginBottom: '25px', textTransform: 'uppercase' }}>История Создания</div>
              <h1 style={{ fontSize: '64px', margin: '0 0 35px 0', lineHeight: 1.1, textShadow: '0 5px 15px rgba(0,0,0,1)' }}>Добро пожаловать, путник!</h1>
              <p style={{ fontSize: '23px', lineHeight: 1.8, color: 'rgba(255,255,255,0.9)', textAlign: 'justify' }}>
                Перед тобой не просто игра, а результат месяцев бессонных ночей, творческих поисков и искренней страсти к разработке. 
                Мир <strong style={{ color: '#ffd700' }}>"Masters of the Wild"</strong> был рожден в уникальном тандеме человеческого воображения и современных технологий. <br/><br/>
                Вся разработка легла на плечи одного человека, но я был бы не честен, если бы не упомянул своего верного <strong style={{ color: '#ffd700' }}>ИИ-агента</strong>. 
                Мы стали неразлучным дуэтом: я задавал вектор, продумывал баланс и вкладывал душу, а мой электронный напарник помогал оживлять этот код, 
                превращая сложные идеи в работающую реальность. <br/><br/>
                Вместе мы прошли путь, который обычно преодолевают целые студии. Это был настоящий вызов, требующий предельной концентрации, 
                но именно это сделало игру такой, какая она есть — личной, детальной и созданной специально для тебя.
              </p>
              <div style={{ marginTop: '30px', fontSize: '20px', color: '#c8952a', fontStyle: 'italic' }}>Надеемся, это приключение подарит тебе ту самую ностальгию и азарт.</div>
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
                padding: '50px 70px', 
                borderRadius: '45px', 
                border: '1px solid rgba(255,255,255,0.1)',
                boxShadow: '0 20px 80px rgba(0,0,0,0.6)'
              }}
            >
              <div style={{ color: '#ffd700', fontSize: '22px', letterSpacing: '0.5em', marginBottom: '25px', textTransform: 'uppercase' }}>Основы Мастерства</div>
              <h2 style={{ fontSize: '56px', marginBottom: '40px', color: 'white' }}>Что нужно знать?</h2>
              <div style={{ textAlign: 'left', display: 'flex', flexDirection: 'column', gap: '25px' }}>
                <div style={{ background: 'rgba(255,255,255,0.05)', padding: '25px', borderRadius: '20px', borderLeft: '4px solid #ffd700' }}>
                  <strong style={{ color: '#ffd700', fontSize: '24px' }}>🛡️ Победа в подготовке:</strong> <span style={{ fontSize: '20px', color: '#ddd' }}>Битвы на арене проходят автоматически. Твоя главная задача — собрать идеальный билд из оружия и доспехов *до* начала боя.</span>
                </div>
                <div style={{ background: 'rgba(255,255,255,0.05)', padding: '25px', borderRadius: '20px', borderLeft: '4px solid #ffd700' }}>
                  <strong style={{ color: '#ffd700', fontSize: '24px' }}>⚡ Баланс характеристик:</strong> <span style={{ fontSize: '20px', color: '#ddd' }}>Сила увеличивает урон, Ловкость — шанс крита и скорость, а Стойкость — твое здоровье. Ищи баланс, подходящий под твоего героя.</span>
                </div>
                <div style={{ background: 'rgba(255,255,255,0.05)', padding: '25px', borderRadius: '20px', borderLeft: '4px solid #ffd700' }}>
                  <strong style={{ color: '#ffd700', fontSize: '24px' }}>💎 Редкость имеет значение:</strong> <span style={{ fontSize: '20px', color: '#ddd' }}>Предметы с золотыми и фиолетовыми рамками намного сильнее обычных. Даже одна такая вещь может переломить ход всего сражения.</span>
                </div>
                <div style={{ background: 'rgba(255,255,255,0.05)', padding: '25px', borderRadius: '20px', borderLeft: '4px solid #ffd700' }}>
                  <strong style={{ color: '#ffd700', fontSize: '24px' }}>📜 Квесты и Энергия:</strong> <span style={{ fontSize: '20px', color: '#ddd' }}>Каждый бой тратит энергию. Чтобы не терять темп, выполняй ежедневные квесты — это твой главный источник золота и алмазов.</span>
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
                padding: '50px',
                margin: '0 auto',
                background: 'rgba(0,0,0,0.5)',
                backdropFilter: 'blur(15px)',
                borderRadius: '40px',
                border: '1px solid rgba(255,255,255,0.1)'
              }}
            >
              <h2 style={{ fontSize: '48px', textAlign: 'center', marginBottom: '50px', color: '#ffd700' }}>Путеводитель Мастера</h2>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '35px' }}>
                <GuideItem title="ЗВЕРИ" desc="Твой основной отряд. Прокачивай характеристики своей панды или кабана, выбирай лучшие способности и доминируй в битвах!" />
                <GuideItem title="МАГАЗИН" desc="Экипировка и Алхимия. Здесь ты найдешь всё: от простых палок до легендарных мечей, а также ценную энергию и валюту." />
                <GuideItem title="РАНГИ" desc="Дорога к славе. Сражайся на арене, чтобы подняться в мировом рейтинге и получить статус 'Легенда Арены'." />
                <GuideItem title="БОЕВОЙ ПРОПУСК" desc="Сезонные награды. Выполняй ежедневные квесты, зарабатывай опыт и забирай эксклюзивные подарки каждый день."
                />
              </div>
              <div style={{ textAlign: 'center', marginTop: '50px', fontSize: '22px', color: 'rgba(255,255,255,0.7)', fontWeight: 'bold' }}>
                Мир кликабелен — исследуй каждую иконку, чтобы стать сильнее!
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: '60px' }}>
          <motion.button
            whileHover={{ scale: 1.05, boxShadow: '0 0 50px rgba(200,149,42,0.7)' }}
            whileTap={{ scale: 0.95 }}
            onClick={nextStep}
            style={{
              padding: '24px 100px', 
              background: 'linear-gradient(135deg, #ffe082, #c8952a)', 
              border: 'none', 
              borderRadius: '12px', 
              fontSize: '28px', 
              fontWeight: 'bold', 
              color: '#1a0e05', 
              cursor: 'pointer', 
              letterSpacing: '0.25em', 
              boxShadow: '0 10px 30px rgba(0,0,0,0.5)'
            }}
          >
            {step === 3 ? 'В БОЙ!' : 'ДАЛЕЕ'}
          </motion.button>

          <div style={{ marginTop: '25px', color: 'rgba(255,255,255,0.4)', fontSize: '16px', letterSpacing: '0.1em' }}>
            ШАГ {step} ИЗ 3
          </div>
        </div>
      </div>
    </div>
  );
};

const GuideItem = ({ title, desc }: { title: string, desc: string }) => (
  <div style={{ 
    padding: '30px', 
    background: 'rgba(255,255,255,0.04)', 
    borderRadius: '25px', 
    borderLeft: '5px solid #c8952a', 
    boxShadow: '0 10px 20px rgba(0,0,0,0.2)'
  }}>
    <h4 style={{ margin: '0 0 15px 0', color: '#ffd700', fontSize: '26px', letterSpacing: '0.05em' }}>{title}</h4>
    <p style={{ margin: 0, fontSize: '20px', lineHeight: 1.6, color: 'rgba(255,255,255,0.85)' }}>{desc}</p>
  </div>
);
