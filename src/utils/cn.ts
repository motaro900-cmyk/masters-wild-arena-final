import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * cn() — стандартная утилита для слияния Tailwind-классов.
 *
 * Зачем нужна:
 * - `clsx` убирает дубли и обрабатывает условия (если false — класс не добавляется)
 * - `twMerge` разрешает конфликты Tailwind (например, `px-4` + `px-6` → только `px-6`)
 *
 * Пример:
 *   cn('border border-yellow-600', isActive && 'bg-yellow-500/20', 'rounded-xl')
 */
export function cn(...inputs: ClassValue[]): string {
    return twMerge(clsx(inputs));
}
