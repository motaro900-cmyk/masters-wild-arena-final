import { audioService } from '../../../../../services/AudioService';
import { AssetsMap } from '../../../../../configs/AssetsMap';
import { TALENTS_CONFIG } from '../constants/talentsConfig';

export const useTalentProgress = (heroId: string, talents: any, availablePoints: number, upgradeTalent: any) => {
    const handleUpgrade = (talent: any, branchId: string) => {
        if (availablePoints <= 0) return;
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
