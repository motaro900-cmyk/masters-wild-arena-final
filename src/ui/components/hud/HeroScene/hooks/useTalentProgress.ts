import { audioService } from '../../../../../services/AudioService';
import { AssetsMap } from '../../../../../configs/AssetsMap';
import { TALENTS_CONFIG } from '../constants/talentsConfig';

export const useTalentProgress = (heroId: string, talents: any, availablePoints: number, upgradeTalent: any) => {
    const handleUpgrade = (talent: any, branchId: string) => {
        const getTalentUpgradeCost = (tId: string): number => {
            if (['atk_base', 'def_base', 'mas_base'].includes(tId)) return 1;
            if (['atk_crit', 'atk_pen', 'def_res', 'def_eva', 'mas_spd', 'mas_focus'].includes(tId)) return 2;
            if (['atk_ult', 'def_ult', 'mas_ult'].includes(tId)) return 3;
            return 1;
        };

        const cost = getTalentUpgradeCost(talent.id);
        if (availablePoints < cost) return;

        const currentLevel = talents[talent.id] || 0;
        if (currentLevel >= talent.max) return;

        const branchPoints = Object.entries(talents)
            .filter(([id]) => id.startsWith(branchId.substring(0, 3)))
            .reduce((a, [, v]) => a + (v as number), 0);

        const tier = TALENTS_CONFIG.find((b) => b.id === branchId)?.tiers.find((t) =>
            t.talents.some((tt) => tt.id === talent.id),
        );
        if (tier && branchPoints < tier.requiredInBranch) return;

        upgradeTalent(heroId, talent.id);
        audioService.playSFX(AssetsMap.AUDIO.SFX_LEVEL_UP);
    };

    return { handleUpgrade };
};
