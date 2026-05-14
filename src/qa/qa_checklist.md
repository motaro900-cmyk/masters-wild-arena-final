# Masters of the Wild - Comprehensive QA Checklist

## 1. PIXI / RENDER PIPELINE DEBUG
**Goal:** Ensure the rendering engine is stable and assets are correctly displayed.

- [ ] Canvas is correctly mounted and visible in the DOM.
- [ ] Renderer width/height are non-zero and match the intended resolution.
- [ ] Pixi Stage contains children (at least background and layers).
- [ ] Characters have textures assigned (no pink/white boxes).
- [ ] Sprites have `visible=true` and `alpha > 0`.
- [ ] zIndex ordering is correct (characters not behind backgrounds).
- [ ] Battle scene is NOT destroyed immediately after mount.
- [ ] No `removeChild`/`destroy` errors in console.
- [ ] Pixi Ticker is running and updating at target FPS.
- [ ] FPS is stable (>30) and doesn't degrade over time.

**If Screen is Black/Blank:**
- [ ] Verify Canvas mount point.
- [ ] Check Asset Loader status (Texture loading).
- [ ] Check Camera/Stage position (is it outside view bounds?).
- [ ] Check for CSS overlays blocking interaction or visibility.
- [ ] Check React Lifecycle (unmount/remount loops).

---

## 2. MEMORY LEAK TEST
**Goal:** Ensure the game doesn't crash during long sessions on mobile devices.

**Stress Test (10 Iterations):**
1. Enter Battle.
2. Exit Battle.
3. Repeat 10 times.

- [ ] Memory usage remains stable (no persistent growth).
- [ ] Pixi Texture count does not increase indefinitely.
- [ ] Event listener count remains stable.
- [ ] Sprites are not duplicated in memory/layers.
- [ ] Battle scenes are correctly destroyed and garbage collected.
- [ ] `app.destroy()` is called correctly on engine shutdown.
- [ ] Global cache cleanup is verified.

---

## 3. SOCKET / EQUIPMENT TEST
**Goal:** Ensure the character customization and visual equipment system works perfectly.

- [ ] Weapons are correctly attached to the character's hand bone/socket.
- [ ] Weapons do not shift or float when switching between heroes.
- [ ] Character pivots are consistent across all hero types.
- [ ] Equipment does not break the character's pose or animation.
- [ ] Weapons do not appear at character feet or origin.
- [ ] Items have correct scaling relative to the hero.
- [ ] Armor overlays align with the body (no clipping or weird layering).

---

## 4. RESPONSIVE / SAFE AREA TEST
**Goal:** Ensure the game is playable on all mobile devices and within VK webviews.

- [ ] Safe Area support (iPhone Notch, dynamic islands).
- [ ] UI elements are not obscured by device notches or home indicators.
- [ ] Ultra-narrow screens (320px) layout remains functional.
- [ ] Landscape mode transitions are smooth (if supported).
- [ ] VK Mobile Webview compatibility (navbar/header considerations).
- [ ] Scroll lock active (page doesn't scroll/bounce during gameplay).
- [ ] Buttons are accessible and "thumb-friendly" for mobile users.

---

## 5. LOADING / ASSET TEST
**Goal:** Smooth entry into the game without "hanging" or visual glitches.

- [ ] Loading screen exists and is visible on startup.
- [ ] Progress indicator reflects actual loading state.
- [ ] Textures load gradually without blocking the UI thread.
- [ ] No lag spike/freeze during the first attack animation.
- [ ] No freeze/hang when entering the battle scene.
- [ ] No missing textures (checkered patterns).
- [ ] No "Texture Popping" (switching from low to high res visible to user).

---

## 6. GAME FEEL / JUICE TEST
**Goal:** Evaluate the emotional impact and "satisfaction" of the gameplay.

- [ ] Hits feel impactful (impact particles/sfx).
- [ ] Impact feedback (slight pause or visual cue on hit).
- [ ] Screen Shake intensity is appropriate for the action.
- [ ] Hit Flash (character briefly flashes white/red on damage).
- [ ] Critical Hit feedback is distinct and rewarding.
- [ ] Damage numbers are readable and move in a pleasing way.
- [ ] Attack-to-Damage timing is synchronized.
- [ ] Victory/Defeat screens feel meaningful (fanfare/animations).

---

## 7. LIVE SERVICE / RETENTION CHECK
**Goal:** Check if the game loop encourages long-term play.

- [ ] Clear reasons for the player to return (daily rewards, progress).
- [ ] Strong sense of character progression.
- [ ] Rewards are clearly explained and feel valuable.
- [ ] Dopamine feedback loops (chests, level-ups, new items).
- [ ] Item rarity is visually distinct and easy to understand.
- [ ] Overall desire to restart or continue playing is high.

---

## 8. FIRST TIME USER EXPERIENCE (FTUE)
**Goal:** Ensure new players aren't lost in the first 30 seconds.

- [ ] Player understands what to do within the first 30 seconds.
- [ ] "Start Battle" flow is intuitive.
- [ ] "Equip Item" flow is intuitive.
- [ ] Purpose of resources (gold, gems, etc.) is clear.
- [ ] UI is not overwhelming or cluttered for a beginner.
- [ ] No "Confusion Moments" (player asking "what now?").

---

## 9. VISUAL CONSISTENCY TEST
**Goal:** Ensure professional "premium" look and feel.

- [ ] Unified UI style (colors, borders, shadows).
- [ ] Consistent character scaling (no giant rats vs tiny dragons).
- [ ] Consistent lighting and shading across all assets.
- [ ] Consistent character shadows on the arena floor.
- [ ] Consistent pivots/anchors (no "sliding" characters).
- [ ] Text readability (font size, contrast, localization space).
- [ ] Rarity colors match across inventory, shop, and battle.

---

## 10. CONSOLE ERROR CLASSIFICATION
**Goal:** Systematic tracking of technical issues.

**Classification:**
- **CRITICAL:** Crashes, freezes, non-functional core features.
- **WARNING:** Visual glitches, performance drops, non-breaking logic errors.
- **INFO:** Debug logs, asset loading info.

**For every bug found:**
1. **Screenshot:** Required.
2. **Severity:** Blocker / Critical / Major / Minor.
3. **Probable Cause:** Logic, Assets, CSS, React, etc.
4. **Reproduction Steps:** Step-by-step to trigger.
5. **Retention Impact:** Does this make a player quit?

---

## MASK/PERSPECTIVE CHECK
Evaluate the game through these lenses:
- **New Player:** "Is this fun and easy to start?"
- **Whale/Payer:** "Does this look premium enough to spend money on?"
- **Mobile User:** "Does it work well on my phone?"
- **Idle RPG Fan:** "Is the progression satisfying?"

---

## FINAL NOTES
- **Don't limit yourself to this list.** 
- If something feels "cheap," "confusing," or "janky," mark it down.
- Focus on the *feel* as much as the *function*.
