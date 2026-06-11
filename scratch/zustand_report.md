# ZUSTAND STORE USAGE AUDIT REPORT

Total useGameStore calls found: 214
- Without Selector: 38
- With Selector: 176

## 1. FILES WITH ONLY SELECTORLESS CALLS (useGameStore())

Found 33 files subscribing to the entire store:

### File: `src\ui\components\hud\AdvancedSettingsBlock.tsx` (1 occurrences)
- Line 32: `} = useGameStore();`

### File: `src\ui\components\hud\BattlePass\PurchaseModal.tsx` (1 occurrences)
- Line 6: `const { crystals } = useGameStore();`

### File: `src\ui\components\hud\BattlePass\useBattlePassQuests.ts` (1 occurrences)
- Line 9: `const { bpDailyQuests, weeklyQuests } = useGameStore();`

### File: `src\ui\components\hud\BattlePassBar.tsx` (1 occurrences)
- Line 9: `const { bpLevel, bpExp, setScreen } = useGameStore();`

### File: `src\ui\components\hud\BattlePassScene.tsx` (1 occurrences)
- Line 33: `} = useGameStore();`

### File: `src\ui\components\hud\Bestiary\useBestiary.ts` (1 occurrences)
- Line 37: `const { pet, gold, crystals, collectPetDailyReward } = useGameStore();`

### File: `src\ui\components\hud\ChatPanel.tsx` (1 occurrences)
- Line 14: `const { messages, privateMessages, clanMessages, addMessage, name, clanId } = useGameStore();`

### File: `src\ui\components\hud\ClanWindow.tsx` (1 occurrences)
- Line 25: `} = useGameStore();`

### File: `src\ui\components\hud\DailyGiftWindow.tsx` (1 occurrences)
- Line 67: `const { addGold, addCrystals, addEnergy, setCanClaimDailyGift } = useGameStore();`

### File: `src\ui\components\hud\DailyTaskPanel.tsx` (1 occurrences)
- Line 17: `const { dailyQuests, claimQuestReward, refreshDailyQuests, vipLevel, vipEndTime } = useGameStore();`

### File: `src\ui\components\hud\ForgeWindow.tsx` (1 occurrences)
- Line 22: `const { gold, crystals, inventory, heroEquipment, selectedHeroId, upgradeItem } = useGameStore();`

### File: `src\ui\components\hud\FriendsWindow\useFriendsWindow.ts` (1 occurrences)
- Line 23: `} = useGameStore();`

### File: `src\ui\components\hud\HeroScene\components\HeroDetails\PurchaseModal.tsx` (1 occurrences)
- Line 9: `const { gold, crystals, rating, unlockHero, spendGold, spendDiamonds } = useGameStore();`

### File: `src\ui\components\hud\HeroScene\components\HeroList\HeroTooltip.tsx` (1 occurrences)
- Line 26: `const { ownedHeroes, graphicsQuality } = useGameStore();`

### File: `src\ui\components\hud\Inventory\ItemTooltip.tsx` (1 occurrences)
- Line 23: `const store = useGameStore();`

### File: `src\ui\components\hud\InventoryPanel.tsx` (1 occurrences)
- Line 37: `} = useGameStore();`

### File: `src\ui\components\hud\MailWindow.tsx` (2 occurrences)
- Line 25: `} = useGameStore();`
- Line 81: `const { redeemPromoCode } = useGameStore();`

### File: `src\ui\components\hud\Matchmaking\MatchmakingFound.tsx` (1 occurrences)
- Line 60: `const { heroEquipment, selectedHeroId, title, name, wins, totalBattles, isPremium } = useGameStore();`

### File: `src\ui\components\hud\Matchmaking\MatchmakingSearching.tsx` (1 occurrences)
- Line 31: `const { frame } = useGameStore();`

### File: `src\ui\components\hud\PlayerProfile.tsx` (1 occurrences)
- Line 17: `const store = useGameStore();`

### File: `src\ui\components\hud\PreBattleScreen.tsx` (1 occurrences)
- Line 367: `const { rating, heroEquipment, selectedHeroId } = useGameStore();`

### File: `src\ui\components\hud\ProfileCustomizeWindow.tsx` (1 occurrences)
- Line 36: `} = useGameStore();`

### File: `src\ui\components\hud\ProfileHub.tsx` (1 occurrences)
- Line 10: `const { level, vipLevel, exp, vkUser, title, name, avatar, frame, glowEnabled, uiAnimations } = useGameStore();`

### File: `src\ui\components\hud\RankingPanel.tsx` (1 occurrences)
- Line 11: `const { rating, wins, totalBattles } = useGameStore();`

### File: `src\ui\components\hud\RankingWindow.tsx` (1 occurrences)
- Line 23: `const { rating, vkUser, avatar: playerAvatar } = useGameStore();`

### File: `src\ui\components\hud\RanksListWindow.tsx` (1 occurrences)
- Line 9: `const { rating: playerTrophies } = useGameStore();`

### File: `src\ui\components\hud\SettingsWindow.tsx` (1 occurrences)
- Line 30: `} = useGameStore();`

### File: `src\ui\components\hud\ShopScene\BuyBtn.tsx` (1 occurrences)
- Line 20: `const { ownedSkins, equippedSkins, equipSkin, unequipSkin, inventory, heroEquipment, level } = useGameStore();`

### File: `src\ui\components\hud\ShopScene\useShopScene.ts` (1 occurrences)
- Line 25: `} = useGameStore();`

### File: `src\ui\components\hud\VIPWindow.tsx` (1 occurrences)
- Line 101: `const { vipLevel, isPremium, vipEndTime } = useGameStore();`

### File: `src\ui\components\screens\AncientsSanctuaryScreen.tsx` (1 occurrences)
- Line 56: `} = useGameStore();`

### File: `src\ui\components\screens\ForgeScreen.tsx` (1 occurrences)
- Line 17: `const stateStore = useGameStore();`

### File: `src\ui\screens\MainHUD.tsx` (1 occurrences)
- Line 7: `const store = useGameStore();`

## 2. FILES WITH MIXED CALLS (both with and without selectors)

Found 4 files:

### File: `src\ui\components\hud\BattleResultScreen.tsx` (7 occurrences)
- Line 100 [With Selector]: `const goToForge = useGameStore((state) => state.goToForge);`
- Line 101 [With Selector]: `const goToHeroes = useGameStore((state) => state.goToHeroes);`
- Line 102 [With Selector]: `const trophies = useGameStore((state) => state.trophies);`
- Line 103 [With Selector]: `const crystals = useGameStore((state) => state.crystals);`
- Line 104 [With Selector]: `const battleMode = useGameStore((state) => state.battleMode);`
- Line 105 [With Selector]: `const pveLoot = useGameStore((state) => state.pveLoot);`
- Line 107 [WITHOUT Selector]: `const { level, exp, gold } = useGameStore();`

### File: `src\ui\components\hud\GlobalDialogs.tsx` (2 occurrences)
- Line 6 [With Selector]: `const activeAlert = useGameStore((state) => state.activeAlert);`
- Line 81 [WITHOUT Selector]: `const { activeConfirm } = useGameStore();`

### File: `src\ui\components\hud\HeroScene\components\Equipment\GearView.tsx` (3 occurrences)
- Line 31 [With Selector]: `const equippedSkins = useGameStore((s: any) => s.equippedSkins) || {};`
- Line 36 [With Selector]: `const heroesState = useGameStore((s: any) => s.heroes) || {};`
- Line 63 [WITHOUT Selector]: `const { inventory: rawInventory } = useGameStore();`

### File: `src\ui\components\hud\HeroScene\components\Talents\TalentsView.tsx` (2 occurrences)
- Line 11 [WITHOUT Selector]: `const { heroTalents, upgradeTalent, resetTalents, talentPoints } = useGameStore();`
- Line 15 [With Selector]: `const heroesState = useGameStore((s: any) => s.heroes) || {};`

## 3. FILES WITH ONLY SELECTOR CALLS (useGameStore(s => ...))

Found 42 files using selectors exclusively:

### File: `src\hooks\useAvatarRenderer.ts` (1 occurrences)
- Line 65: `const equippedSkins = useGameStore((s: any) => s.equippedSkins) || {};`

### File: `src\ui\BeastsScreen.tsx` (9 occurrences)
- Line 276: `const selectedHeroId = useGameStore((state) => state.selectedHeroId);`
- Line 277: `const inventory = useGameStore((state) => state.inventory);`
- Line 278: `const equipment = useGameStore((state) => state.equipment);`
- Line 279: `const equipWeapon = useGameStore((state) => state.equipWeapon);`
- Line 280: `const equippedWeaponId = useGameStore((state) => state.equippedWeaponId);`
- Line 281: `const equippedSkins = useGameStore((state) => state.equippedSkins);`
- Line 689: `const goToMainMenu = useGameStore((state) => state.goToMainMenu);`
- Line 690: `const selectedBeastId = useGameStore((state) => state.selectedBeastId);`
- Line 691: `const setSelectedBeastId = useGameStore((state) => state.setSelectedBeastId);`

### File: `src\ui\components\ActionPanel.tsx` (1 occurrences)
- Line 18: `const goToArena = useGameStore((state) => state.goToArena);`

### File: `src\ui\components\BannedOverlay.tsx` (1 occurrences)
- Line 10: `const { isBanned, banReason, banUntil } = useGameStore((state) => ({`

### File: `src\ui\components\BattleCanvas.tsx` (1 occurrences)
- Line 16: `const selectedHeroId = useGameStore((s) => s.selectedHeroId);`

### File: `src\ui\components\GameHUD.tsx` (8 occurrences)
- Line 26: `const activeScreen = useGameStore((state) => state.activeScreen);`
- Line 27: `const showSummonOverlay = useGameStore((state) => state.showSummonOverlay);`
- Line 28: `const mails = useGameStore((state) => state.mail) || [];`
- Line 30: `const vipLevel = useGameStore((state) => state.vipLevel);`
- Line 31: `const vipEndTime = useGameStore((state) => state.vipEndTime);`
- Line 32: `const isMobile = useGameStore((state) => state.isMobile);`
- Line 36: `const goToShop = useGameStore((state) => state.goToShop);`
- Line 40: `const showFps = useGameStore((state) => state.showFps);`

### File: `src\ui\components\hud\ActionButtons.tsx` (1 occurrences)
- Line 18: `const rating = useGameStore((state) => state.rating);`

### File: `src\ui\components\hud\Admin\AdminPlayersTab.tsx` (7 occurrences)
- Line 163: `const gold         = useGameStore((s) => s.gold);`
- Line 164: `const crystals     = useGameStore((s) => s.crystals);`
- Line 165: `const level        = useGameStore((s) => s.level);`
- Line 166: `const talentPoints = useGameStore((s) => s.talentPoints);`
- Line 167: `const rating       = useGameStore((s) => s.rating);`
- Line 168: `const activeScreen = useGameStore((s) => s.activeScreen);`
- Line 169: `const hasInfiniteEnergy = useGameStore((s) => s.hasInfiniteEnergy);`

### File: `src\ui\components\hud\AdminPanel.tsx` (12 occurrences)
- Line 132: `const messages = useGameStore((state) => state.messages);`
- Line 133: `const combatLogs = useGameStore((state) => state.combatLogs);`
- Line 134: `const timeScale = useGameStore((state) => state.timeScale);`
- Line 135: `const isGodMode = useGameStore((state) => state.isGodMode);`
- Line 136: `const isOneShot = useGameStore((state) => state.isOneShot);`
- Line 137: `const isEnemyFrozen = useGameStore((state) => state.isEnemyFrozen);`
- Line 138: `const showFps = useGameStore((state) => state.showFps);`
- Line 139: `const showHitboxes = useGameStore((state) => state.showHitboxes);`
- Line 140: `const showSafeZone = useGameStore((state) => state.showSafeZone);`
- Line 141: `const debugPing = useGameStore((state) => state.debugPing);`
- Line 142: `const isOfflineMode = useGameStore((state) => state.isOfflineMode);`
- Line 657: `const isAdmin = useGameStore((state) => state.isAdmin);`

### File: `src\ui\components\hud\BaseWindow.tsx` (1 occurrences)
- Line 64: `const { uiTheme, language } = useGameStore((state: any) => ({`

### File: `src\ui\components\hud\Battle\BattleHUD.tsx` (10 occurrences)
- Line 316: `const selectedHeroId = useGameStore((s) => s.selectedHeroId) || 'panda';`
- Line 317: `const heroes = useGameStore((s) => s.heroes) || {};`
- Line 319: `const playerLevel = useGameStore((s) => s.level) || 1;`
- Line 320: `const playerRating = useGameStore((s) => s.rating || s.trophies || 0);`
- Line 322: `const playerName = useGameStore((s) => s.name) || 'Мастер';`
- Line 323: `const rawAvatar = useGameStore((s) => s.avatar);`
- Line 324: `const vkUser = useGameStore((s) => s.vkUser);`
- Line 325: `const playerFrame = useGameStore((s) => s.frame) || 'default';`
- Line 326: `const vipLevel = useGameStore((s) => s.vipLevel) || 0;`
- Line 333: `const activeRankedOpponent = useGameStore((s) => s.activeRankedOpponent);`

### File: `src\ui\components\hud\BattleScene.tsx` (11 occurrences)
- Line 19: `const selectedHeroId = useGameStore((state) => state.selectedHeroId);`
- Line 20: `const selectedEnemyId = useGameStore((state) => state.selectedEnemyId);`
- Line 21: `const goToMainMenu = useGameStore((state) => state.goToMainMenu);`
- Line 22: `const getCalculatedStats = useGameStore((state) => state.getCalculatedStats);`
- Line 23: `const timeScale = useGameStore((state) => state.timeScale);`
- Line 24: `const setTimeScale = useGameStore((state) => state.setTimeScale);`
- Line 25: `const activePveEnemy = useGameStore((state) => state.activePveEnemy);`
- Line 26: `const activeRankedOpponent = useGameStore((state) => state.activeRankedOpponent);`
- Line 27: `const battleMode = useGameStore((state) => state.battleMode);`
- Line 28: `const equippedSkins = useGameStore((state) => state.equippedSkins);`
- Line 588: `const isMobile = useGameStore((state) => state.isMobile);`

### File: `src\ui\components\hud\BottomNavigation.tsx` (1 occurrences)
- Line 21: `const activeScreen = useGameStore((state) => state.activeScreen);`

### File: `src\ui\components\hud\DailyGiftBanner.tsx` (4 occurrences)
- Line 9: `const canClaim = useGameStore((state) => state.canClaimDailyGift);`
- Line 10: `const setCanClaim = useGameStore((state) => state.setCanClaimDailyGift);`
- Line 11: `const lastDailyGiftClaimedTime = useGameStore((state) => state.lastDailyGiftClaimedTime);`
- Line 12: `const lastWheelSpinTime = useGameStore((state) => state.lastWheelSpinTime);`

### File: `src\ui\components\hud\HeroScene\components\Equipment\EquipmentSlot.tsx` (1 occurrences)
- Line 29: `const inventory = useGameStore((state) => state.inventory);`

### File: `src\ui\components\hud\HeroScene\components\HeroList\components\HeroCard.tsx` (1 occurrences)
- Line 25: `const { rating, crystals, gold } = useGameStore((state) => ({`

### File: `src\ui\components\hud\HeroScene\components\HeroList\components\HeroDetailPanel.tsx` (1 occurrences)
- Line 96: `const { rating, gold, crystals } = useGameStore((state) => ({`

### File: `src\ui\components\hud\HeroScene\components\HeroList\FilterBar.tsx` (1 occurrences)
- Line 7: `const { gold, crystals, ownedHeroes } = useGameStore((s: any) => ({`

### File: `src\ui\components\hud\HeroScene\components\HeroList\HeroCard.tsx` (1 occurrences)
- Line 18: `const { gold, crystals, level, trophies, heroes } = useGameStore((s: any) => ({`

### File: `src\ui\components\hud\HeroScene\components\HeroList\index.tsx` (1 occurrences)
- Line 72: `const { setSelectedHeroId, ownedSkins, equippedSkins, equipSkin, setHeroGalleryId } = useGameStore((s: any) => ({`

### File: `src\ui\components\hud\HeroScene\components\Skins\SkinsView.tsx` (1 occurrences)
- Line 26: `const { ownedSkins, equippedSkins, equipSkin } = useGameStore((s: any) => ({`

### File: `src\ui\components\hud\HeroScene\HeroScene.tsx` (13 occurrences)
- Line 54: `const getCalculatedStats = useGameStore((state) => state.getCalculatedStats);`
- Line 55: `const inventory = useGameStore((state) => state.inventory);`
- Line 56: `const equipItem = useGameStore((state) => state.equipItem);`
- Line 57: `const unequipItem = useGameStore((state) => state.unequipItem);`
- Line 58: `const heroEquipment = useGameStore((state) => state.heroEquipment);`
- Line 59: `const heroesInitialTab = useGameStore((state) => state.heroesInitialTab);`
- Line 60: `const selectedHeroId = useGameStore((state) => state.selectedHeroId);`
- Line 61: `const setSelectedHeroId = useGameStore((state) => state.setSelectedHeroId);`
- Line 62: `const setHeroGalleryId = useGameStore((state) => state.setHeroGalleryId);`
- Line 63: `const ownedHeroes = useGameStore((state) => state.ownedHeroes);`
- Line 64: `const goToMainMenu = useGameStore((state) => state.goToMainMenu);`
- Line 65: `const goToShop = useGameStore((state) => state.goToShop);`
- Line 66: `const isMobile = useGameStore((state) => state.isMobile);`

### File: `src\ui\components\hud\LeftSidebar.tsx` (1 occurrences)
- Line 26: `const activeScreen = useGameStore((state) => state.activeScreen);`

### File: `src\ui\components\hud\LevelUpOverlay.tsx` (1 occurrences)
- Line 9: `const { latestLevelUp, clearLatestLevelUp } = useGameStore((s: any) => ({`

### File: `src\ui\components\hud\Matchmaking\components\EquipmentSlotItem.tsx` (1 occurrences)
- Line 51: `const inventory = useGameStore((s: any) => s.inventory) || [];`

### File: `src\ui\components\hud\MatchmakingOverlay.tsx` (12 occurrences)
- Line 29: `const name = useGameStore((state) => state.name);`
- Line 30: `const rating = useGameStore((state) => state.rating);`
- Line 31: `const vipLevel = useGameStore((state) => state.vipLevel);`
- Line 32: `const selectedHeroId = useGameStore((state) => state.selectedHeroId);`
- Line 33: `const level = useGameStore((state) => state.level);`
- Line 34: `const getCalculatedStats = useGameStore((state) => state.getCalculatedStats);`
- Line 35: `const avatar = useGameStore((state) => state.avatar);`
- Line 36: `const vkUser = useGameStore((state) => state.vkUser);`
- Line 37: `const isMobile = useGameStore((state) => state.isMobile);`
- Line 38: `const equippedSkins = useGameStore((state) => state.equippedSkins);`
- Line 39: `const winStreak = useGameStore((state) => state.winStreak);`
- Line 40: `const lossStreak = useGameStore((state) => state.lossStreak);`

### File: `src\ui\components\hud\ProfileBar.tsx` (7 occurrences)
- Line 11: `const avatar = useGameStore((s) => s.avatar) || 'панда.png';`
- Line 12: `const frame = useGameStore((s) => s.frame) || 'harvest_wheat_frame.webp';`
- Line 13: `const trophies = useGameStore((s) => s.trophies) ?? 0;`
- Line 14: `const exp = useGameStore((s) => s.exp) ?? 0;`
- Line 15: `const level = useGameStore((s) => s.level) ?? 1;`
- Line 16: `const vkUser = useGameStore((s) => s.vkUser);`
- Line 17: `const name = useGameStore((s) => s.name);`

### File: `src\ui\components\hud\ResourceBar.tsx` (6 occurrences)
- Line 12: `const gold = useGameStore((s) => s.gold);`
- Line 13: `const crystals = useGameStore((s) => s.crystals);`
- Line 14: `const energy = useGameStore((s) => s.energy);`
- Line 15: `const maxEnergy = useGameStore((s) => s.maxEnergy);`
- Line 16: `const lastEnergyUpdate = useGameStore((s) => s.lastEnergyUpdate);`
- Line 17: `const regenerateEnergy = useGameStore((s) => s.regenerateEnergy);`

### File: `src\ui\components\hud\RightPanel.tsx` (1 occurrences)
- Line 11: `const canClaimDailyGift = useGameStore((s: any) => s.canClaimDailyGift);`

### File: `src\ui\components\hud\SharedUI.tsx` (6 occurrences)
- Line 26: `const isLow = useGameStore((state) => state.graphicsQuality === 'LOW');`
- Line 94: `const isLow = useGameStore((state) => state.graphicsQuality === 'LOW');`
- Line 122: `const isLow = useGameStore((state) => state.graphicsQuality === 'LOW');`
- Line 159: `const isLow = useGameStore((state) => state.graphicsQuality === 'LOW');`
- Line 228: `const isLow = useGameStore((state) => state.graphicsQuality === 'LOW');`
- Line 303: `const isMobile = useGameStore((state) => state.isMobile);`

### File: `src\ui\components\hud\ShopScene.tsx` (1 occurrences)
- Line 43: `const equippedItems = useGameStore((state: any) => state.heroEquipment?.[state.selectedHeroId || 'panda'] || {});`

### File: `src\ui\components\hud\TopBar.tsx` (11 occurrences)
- Line 12: `const avatar = useGameStore((state) => state.avatar);`
- Line 13: `const title = useGameStore((state) => state.title);`
- Line 14: `const level = useGameStore((state) => state.level);`
- Line 15: `const crystals = useGameStore((state) => state.crystals);`
- Line 16: `const gold = useGameStore((state) => state.gold);`
- Line 17: `const energy = useGameStore((state) => state.energy);`
- Line 18: `const maxEnergy = useGameStore((state) => state.maxEnergy);`
- Line 19: `const exp = useGameStore((state) => state.exp);`
- Line 20: `const vkUser = useGameStore((state) => state.vkUser);`
- Line 21: `const name = useGameStore((state) => state.name);`
- Line 22: `const frame = useGameStore((state) => state.frame);`

### File: `src\ui\components\LeftBar.tsx` (3 occurrences)
- Line 15: `const level = useGameStore((state) => state.level);`
- Line 16: `const exp = useGameStore((state) => state.exp);`
- Line 17: `const currentHeroId = useGameStore((state) => state.currentHeroId);`

### File: `src\ui\components\RightBar.tsx` (2 occurrences)
- Line 6: `const currentHeroId = useGameStore((state) => state.currentHeroId);`
- Line 7: `const getCalculatedStats = useGameStore((state) => state.getCalculatedStats);`

### File: `src\ui\components\SceneSwitcher.tsx` (2 occurrences)
- Line 18: `const activeScreen = useGameStore((state) => state.activeScreen);`
- Line 19: `const profileStatus = useGameStore((state) => state.profileStatus);`

### File: `src\ui\components\screens\CityScreen.tsx` (8 occurrences)
- Line 12: `const isMobile = useGameStore((state) => state.isMobile);`
- Line 13: `const goToMainMenu = useGameStore((state) => state.goToMainMenu);`
- Line 14: `const goToShop = useGameStore((state) => state.goToShop);`
- Line 15: `const goToForge = useGameStore((state) => state.goToForge);`
- Line 16: `const openChest = useGameStore((state) => state.openChest);`
- Line 17: `const crystals = useGameStore((state) => state.crystals);`
- Line 20: `const showSummonOverlay = useGameStore((state) => state.showSummonOverlay) || false;`
- Line 21: `const setShowSummonOverlay = useGameStore((state) => state.setShowSummonOverlay);`

### File: `src\ui\components\screens\IntroScreen.tsx` (3 occurrences)
- Line 14: `const storeName = useGameStore((state) => state.name);`
- Line 18: `const isMobile = useGameStore((state) => state.isMobile);`
- Line 20: `const changeName = useGameStore((state) => state.changeName);`

### File: `src\ui\components\SideMenu.tsx` (1 occurrences)
- Line 18: `const goToInventory = useGameStore((state) => state.goToInventory);`

### File: `src\ui\components\TopBar.tsx` (2 occurrences)
- Line 6: `const gold = useGameStore((state) => state.gold);`
- Line 7: `const crystals = useGameStore((state) => state.crystals);`

### File: `src\ui\components\TopPanel.tsx` (7 occurrences)
- Line 14: `const gold = useGameStore((state) => state.gold);`
- Line 15: `const crystals = useGameStore((state) => state.crystals);`
- Line 16: `const energy = useGameStore((state) => state.energy);`
- Line 17: `const maxEnergy = useGameStore((state) => state.maxEnergy);`
- Line 18: `const level = useGameStore((state) => state.level);`
- Line 19: `const exp = useGameStore((state) => state.exp);`
- Line 20: `const currentHeroId = useGameStore((state) => state.currentHeroId);`

### File: `src\ui\layouts\SafeGameLayout.tsx` (2 occurrences)
- Line 24: `const { setShowFps, showFps, isBanned, banReason, banUntil, sessionConflict } = useGameStore((state) => ({`
- Line 92: `const isMobile = useGameStore((state) => state.isMobile);`

### File: `src\ui\ModalManager.tsx` (1 occurrences)
- Line 17: `const activeScreen = useGameStore((state: any) => state.activeScreen);`
