import React from 'react';
import { useModalStore } from '../../store/useModalStore';
import { JuicyButton } from './JuicyButton';
import { ModalWindow } from './ModalWindow';

export const BottomRightNav: React.FC = () => {
    const activeModal = useModalStore((state) => state.activeModal);
    const openModal = useModalStore((state) => state.openModal);
    const closeModal = useModalStore((state) => state.closeModal);

    return (
        <>
            {/* Контейнер кнопок (Нижний правый угол) */}
            <div className="absolute bottom-6 right-6 flex gap-4 z-[150] pointer-events-none">
                <JuicyButton icon="👥" label="Друзья" notificationCount={3} onClick={() => openModal('friends')} />
                <JuicyButton icon="✉️" label="Почта" notificationCount={12} onClick={() => openModal('mail')} />
                <JuicyButton icon="⚙️" label="Настройки" onClick={() => openModal('settings')} />
            </div>

            {/* Рендеринг активного модального окна поверх всего интерфейса */}
            {activeModal === 'friends' && (
                <ModalWindow title="ДРУЗЬЯ" onClose={closeModal}>
                    <div className="p-8 text-center text-[#a08b70] font-bold text-lg">
                        У вас пока нет добавленных друзей.
                        <br />
                        <span className="text-sm font-normal mt-2 block text-[#5e4125]">
                            Приглашайте союзников для совместных рейдов!
                        </span>
                    </div>
                </ModalWindow>
            )}

            {activeModal === 'mail' && (
                <ModalWindow title="ПОЧТА" onClose={closeModal}>
                    <div className="p-8 flex flex-col gap-4">
                        <div className="bg-gradient-to-b from-[#2a1f16] to-[#16110d] border-2 border-[#5e4125] p-5 rounded-xl flex justify-between items-center shadow-inner">
                            <div className="flex flex-col">
                                <span className="text-white font-black tracking-widest text-lg uppercase drop-shadow-md">
                                    Награда за турнир
                                </span>
                                <span className="text-[#d4b483] text-sm font-bold mt-1">Вам начислено 1500 🪙</span>
                            </div>
                            <button className="pointer-events-auto bg-gradient-to-b from-[#facc15] to-[#b45309] border-2 border-[#fef08a] px-6 py-3 rounded-xl text-white font-black text-sm uppercase shadow-lg hover:brightness-110 active:scale-95 transition-all">
                                ЗАБРАТЬ
                            </button>
                        </div>
                    </div>
                </ModalWindow>
            )}

            {activeModal === 'settings' && (
                <ModalWindow title="НАСТРОЙКИ" onClose={closeModal}>
                    <div className="p-8 flex flex-col gap-6">
                        <div className="flex justify-between items-center bg-[#2a1f16] p-5 rounded-xl border-2 border-[#5e4125] shadow-inner">
                            <span className="text-white font-black tracking-widest uppercase">Громкость музыки</span>
                            <input type="range" className="w-[200px] accent-[#d4b483] pointer-events-auto" />
                        </div>
                        <div className="flex justify-between items-center bg-[#2a1f16] p-5 rounded-xl border-2 border-[#5e4125] shadow-inner">
                            <span className="text-white font-black tracking-widest uppercase">Звуки эффектов</span>
                            <input type="range" className="w-[200px] accent-[#d4b483] pointer-events-auto" />
                        </div>
                    </div>
                </ModalWindow>
            )}
        </>
    );
};
