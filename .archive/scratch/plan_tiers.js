import fs from 'fs';

const rawData = JSON.parse(fs.readFileSync('scratch/slot_raw_data.json', 'utf8'));

const slots = ['weapons', 'helmets', 'armor', 'shields', 'shoulders', 'pants', 'boots'];

const tierMapping = {
    weapons: {
        stick: 1,
        sling_leather: 1,
        stick_oak: 2,
        pan_master: 2,
        sword_broken: 3,
        dagger_rusty: 3,
        dagger_bone: 4,
        staff_willow: 4,
        dagger_ritual: 4,
        bow_composite: 5,
        axe_iron: 5,
        katana_shadow: 6,
        katana_steel: 6,
        katana_blood: 7,
        mace_justice: 6,
        staff_shadow: 7,
        daggers_assassin: 7,
        axe_executioner: 7,
        flail_guardian: 7,
        sword_silver: 7,
        axe_veteran: 7,
        weapon_moon_sword: 7,
        bow_griffin: 8,
        staff_celestial: 8,
        hammer_phoenix: 9,
        staff_gold: 9,
        daggers_emerald: 9,
        claws_ice_fire: 10,
        staff_sun_burst: 10,
        staff_galaxy: 10,
        sword_moon_glow: 10,
        axe_ice: 11,
        staff_skull_green: 11,
        sword_hell: 11,
        axe_chaos: 11
    },
    helmets: {
        bandana: 1,
        starter_helm: 2,
        h_forest: 3,
        helm_ranger: 3,
        h9: 3,
        h2: 5,
        h6: 4,
        h11: 5,
        helm_skull: 5,
        iron_helm: 5,
        helm_steampunk: 6,
        h1: 7,
        h3: 6,
        h5: 7,
        h7: 6,
        h10: 7,
        h12: 8,
        h16: 9,
        h4: 8,
        h_dark: 10,
        h14: 9,
        h15: 11
    },
    armor: {
        ragged_tunic: 1,
        starter_armor: 1,
        tunika_lesnogo_uchenika: 2,
        steganyy_dospeh_opolchenca: 2,
        armor_ranger: 3,
        kirasa_mednogo_straja: 3,
        armor_forest: 4,
        dospeh_rechnogo_pirata: 4,
        armor_ice: 5,
        pancir_bolotnogo_trollya: 5,
        bronya_pepelnogo_maga: 6,
        armor_iron: 6,
        laty_kamennogo_straja: 6,
        dospeh_grozovogo_titana: 7,
        armor_steam: 7,
        bronya_kostyanogo_jneca: 7,
        armor_fire: 8,
        armor_void: 9,
        armor_bone: 10,
        kirasa_vechnogo_plameni: 11
    },
    shields: {
        starter_shield: 1,
        shield_plank: 2,
        shield_lesnogo_strazha: 2,
        shield_iron: 3,
        bronzovyy_target: 3,
        shield_ohotnika_na_trolley: 4,
        runicheskiy_shield_gor: 5,
        shield_kamennogo_golema: 6,
        shield_steel: 6,
        barier_grozovogo_maga: 7,
        shield_pepelnogo_rycarya: 7,
        shield_krovavoy_luny: 7,
        shield_dragon: 8,
        oplot_ledyanogo_korolya: 9,
        royal_shield: 11
    },
    shoulders: {
        sh_frost_shards: 3,
        sh_nature_spirit: 4,
        sh_acid_spikes: 6,
        sh_bone_lord: 7,
        sh_steam_gear: 7,
        sh_void_walker: 8,
        sh_golden_lion: 9,
        sh_fire_lion: 11
    },
    pants: {
        pants_mythic: 1,
        pants_void: 1,
        pants_storm: 2,
        pants_spiked: 2,
        pants_mercenary: 3,
        pants_iron: 5,
        pants_steel: 6,
        pants_forest: 7,
        pants_titan: 7,
        pants_royal: 8,
        pants_shadow: 9,
        pants_bone: 9,
        pants_ragged: 10,
        pants_dark: 11,
        pants_hunter: 11
    },
    boots: {
        kozhanye_porshni: 1,
        boots_wanderer: 1,
        boots_bolotnogo_sledopyta: 2,
        boots_iron: 3,
        boots_hunter: 3,
        sabatony_zheleznogo_legiona: 4,
        boots_chain: 5,
        boots_grozovogo_vestnika: 6,
        boots_rune: 6,
        botforty_pustotnogo_ohotnika: 7,
        boots_nekromanta: 7,
        sabatony_drakoney_cheshui: 8,
        boots_paladin: 9,
        postup_zvezdnogo_skitalca: 10,
        boots_bone: 11
    }
};

const tierLevels = {
    1: 1,
    2: 5,
    3: 10,
    4: 15,
    5: 20,
    6: 30,
    7: 40,
    8: 50,
    9: 60,
    10: 70,
    11: 80
};

let out = '# Проект распределения предметов по 11 глобальным тирам\n\n';

slots.forEach(slot => {
    out += `\n### Слот: ${slot.toUpperCase()}\n`;
    out += `| Тир | Уровень | Редкость | ID | Название | Лор / Визуал |\n`;
    out += `| :---: | :---: | :---: | :--- | :--- | :--- |\n`;
    
    const items = rawData[slot];
    
    items.sort((a, b) => {
        const tA = tierMapping[slot][a.id] || 99;
        const tB = tierMapping[slot][b.id] || 99;
        if (tA !== tB) return tA - tB;
        return a.id.localeCompare(b.id);
    });
    
    items.forEach(item => {
        const t = tierMapping[slot][item.id] || 1;
        const lvl = tierLevels[t];
        out += `| T${t} | **${lvl}** | **${item.rarity}** | \`${item.id}\` | ${item.name} | *${item.desc}* |\n`;
    });
});

fs.writeFileSync('scratch/proposed_tiers.md', out);
console.log("Proposal saved to scratch/proposed_tiers.md");
