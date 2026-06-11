/**
 * Censors Russian profanity in text by replacing swear words with asterisks (*).
 */
export function censorText(text: string): string {
    if (!text) return text;

    // Регулярные выражения для поиска матерных корней
    // Поддерживает как кириллическую, так и базовую латинскую раскладку (визуально похожие символы)
    // Корни: хуй/хуя/хуе/хуи, пизд, еб/иб/ебл/ебу, бля, сука, пидор/пидар, гандон/гондон, мудак
    const patterns = [
        /[хx][уy][йяеёиоу]/i,
        /[пp][иi][зз][д]/i,
        /[еe][бб][аоуелняиё]/i,
        /[иi][бб][аоуелняё]/i,
        /[бб][л]я/i,
        /сук[аиоу]/i,
        /муд[аиоук]/i,
        /пид[оа]р/i,
        /г[оа]нд[оа]н/i,
        /залуп/i,
        /манда/i,
        /член/i,
        /охуе/i
    ];

    // Разделяем строку на слова и знаки препинания, цензурируем слова
    return text.split(/(\s+|[,.!?;:()])/).map(part => {
        const cleanPart = part.trim();
        if (!cleanPart) return part;

        const hasSwear = patterns.some(pattern => pattern.test(cleanPart));
        if (hasSwear) {
            return '*'.repeat(cleanPart.length);
        }
        return part;
    }).join('');
}
