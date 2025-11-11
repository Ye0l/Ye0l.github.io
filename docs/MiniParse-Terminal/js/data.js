
export const sampleData = {
    Encounter: { title: 'Sample Battle', duration: '01:34', ENCDPS: '150123.45' },
    Combatant: {
        'YOU': { name: 'YOU', Job: 'Sam', id: '101', ownerId: null, encdps: '25102.8', 'damage%': '16.7', damage: '4886789', swings: '300', DirectHitCount: '120', CritDirectHitCount: '40', CriticalHitCount: '90', maxhit: 'Midare Setsugekka-55123', deaths: '0', healed: '120345', OverHeal: '30100', enchps: '625.3', 'healed%': '15.2' },
        'Player 2': { name: 'Player 2', Job: 'Smn', id: '102', ownerId: null, encdps: '23888.1', 'damage%': '15.9', damage: '4643210', swings: '350', DirectHitCount: '110', CritDirectHitCount: '35', CriticalHitCount: '80', maxhit: 'Akh Morn-49876', deaths: '0', healed: '0', OverHeal: '0', enchps: '0', 'healed%': '0' },
        'Bahamut': { name: 'Bahamut', Job: '', id: '102-pet', ownerId: '102', encdps: '5000.0', 'damage%': '3.3', damage: '975000', swings: '50', DirectHitCount: '10', CritDirectHitCount: '5', CriticalHitCount: '15', maxhit: 'Akh Morn-15000', deaths: '0', healed: '0', OverHeal: '0', enchps: '0', 'healed%': '0' },
        'Player 3': { name: 'Player 3', Job: 'Drk', id: '103', ownerId: null, encdps: '18500.3', 'damage%': '12.3', damage: '3598765', swings: '250', DirectHitCount: '80', CritDirectHitCount: '20', CriticalHitCount: '60', maxhit: 'Bloodspiller-31456', deaths: '1', healed: '250000', OverHeal: '150000', enchps: '1291.9', 'healed%': '31.5' },
        'Player 4': { name: 'Player 4', Job: 'Whm', id: '104', ownerId: null, encdps: '8567.2', 'damage%': '5.7', damage: '1665432', swings: '150', DirectHitCount: '10', CritDirectHitCount: '5', CriticalHitCount: '30', maxhit: 'Glare III-12345', deaths: '0', healed: '890123', OverHeal: '450123', enchps: '4599.6', 'healed%': '100' },
        'Player 5': { name: 'Player 5', Job: 'Sch', id: '105', ownerId: null, encdps: '8201.9', 'damage%': '5.5', damage: '1598765', swings: '180', DirectHitCount: '15', CritDirectHitCount: '8', CriticalHitCount: '40', maxhit: 'Broil IV-11111', deaths: '0', healed: '950456', OverHeal: '300456', enchps: '4900.1', 'healed%': '94.9' },
        'Eos': { name: 'Eos', Job: '', id: '105-pet', ownerId: '105', encdps: '0', 'damage%': '0', damage: '0', swings: '0', DirectHitCount: '0', CritDirectHitCount: '0', CriticalHitCount: '0', maxhit: '-', deaths: '0', healed: '200000', OverHeal: '50000', enchps: '1033.6', 'healed%': '25.3' },
    }
};

export function mergePetData(combatants, encounterDuration) {
    const owners = {};
    const pets = [];

    function extractNickname(inputString) {
        if (!inputString || typeof inputString !== 'string') {
            return ''; // 유효하지 않은 입력 처리
        }
        const regex = /\s*\(([^()]+)\)$/;

        const match = inputString.match(regex);

        if (match) {
            // 소환수명 (닉네임) 형식인 경우
            // match[1]은 캡처 그룹(괄호 안의 내용, 즉 닉네임)을 담고 있습니다.
            const nickname = match[1].trim();
            return {name: nickname, isPet: true};
        } else {
            // 닉네임 형식인 경우 (또는 다른 형식인 경우 닉네임으로 간주)
            const nickname = inputString.trim();
            return {name: nickname, isPet: false};
        }
    }

    for (const c of combatants) {
        const isPet = extractNickname(c.name);
        if (isPet.isPet) {
            pets.push(c);
        } else {
            owners[c.name] = { ...c };
        }
    }

    for (const pet of pets) {
        const owner = owners[pet.ownerId];
        if (owner) {
            const statsToMerge = ['damage', 'healed', 'OverHeal', 'overheal', 'swings', 'DirectHitCount', 'CritDirectHitCount', 'CriticalHitCount'];
            for (const stat of statsToMerge) {
                owner[stat] = (parseFloat(owner[stat]) || 0) + (parseFloat(pet[stat]) || 0);
            }
            const duration = encounterDuration > 0 ? encounterDuration : 1;
            owner.encdps = (owner.damage / duration).toFixed(1);
            owner.enchps = (owner.healed / duration).toFixed(1);

            // Recalculate OverHealPct after pet data merge
            const totalHealing = Math.max(parseFloat(owner.healed) || 0, 1);
            const overHealing = parseFloat(owner.OverHeal) || parseFloat(owner.overHeal) || 0;
            owner.OverHealPct = ((overHealing / totalHealing) * 100).toFixed(1) + '%';
            // Ensure both field names have the same value
            owner.overHeal = overHealing;
            owner.OverHeal = overHealing;
        }
    }
    return Object.values(owners);
}
