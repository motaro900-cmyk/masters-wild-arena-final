import { useEffect } from 'react';
import { useGameStore } from '@store/useGameStore';

/**
 * Хук для обработки глобальных горячих клавиш.
 * - 'i': Открыть/закрыть инвентарь
 */
export const useHotkeys = () => {
    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            // Игнорируем ввод в текстовых полях, чтобы не мешать, например, вводу в чате
            if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
                return;
            }

            if (event.key.toLowerCase() === 'i') {
                const { activeScreen, setActiveScreen } = useGameStore.getState();
                // Проверяем, что метод setActiveScreen существует в сторе
                if (typeof setActiveScreen === 'function') {
                    const nextScreen = activeScreen === 'INVENTORY' ? 'MAIN_MENU' : 'INVENTORY';
                    console.log(`[Hotkeys] Toggling inventory via 'I' key. New screen: ${nextScreen}`);
                    setActiveScreen(nextScreen);
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []); // Пустой массив зависимостей, т.к. мы получаем актуальный state через getState()
};
