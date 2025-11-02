
export const sampleData = [
    {
        "name": "YOU",
        "duration": "10:47",
        "damage": "14012737",
        "damage%": "19%",
        "encdps": "21586.65",
        "swings": "753",
        "crithits": "245",
        "DirectHitCount": "249",
        "CritDirectHitCount": "86",
        "maxhit": "천도설월화-193978",
        "deaths": "0",
        "healed": "108475",
        "healed%": "0%",
        "enchps": "167.11",
        "overHeal": "96594",
        "Job": "Sam"
    },
    {
        "name": "미니폴",
        "duration": "10:47",
        "damage": "11610238",
        "damage%": "16%",
        "encdps": "17885.60",
        "swings": "640",
        "crithits": "151",
        "DirectHitCount": "113",
        "CritDirectHitCount": "29",
        "maxhit": "조상령의 큰송곳니-114681",
        "deaths": "0",
        "healed": "27488",
        "healed%": "0%",
        "enchps": "42.35",
        "overHeal": "6876",
        "Job": "Vpr"
    },
    {
        "name": "뚜벅거리는걔임",
        "duration": "10:47",
        "damage": "10894623",
        "damage%": "15%",
        "encdps": "16783.19",
        "swings": "447",
        "crithits": "106",
        "DirectHitCount": "146",
        "CritDirectHitCount": "31",
        "maxhit": "적색 광채-114439",
        "deaths": "0",
        "healed": "0",
        "healed%": "0%",
        "enchps": "0.00",
        "overHeal": "0",
        "Job": "Rdm"
    },
    {
        "name": "홍은",
        "duration": "10:54",
        "damage": "8921026",
        "damage%": "12%",
        "encdps": "13742.86",
        "swings": "431",
        "crithits": "114",
        "DirectHitCount": "132",
        "CritDirectHitCount": "41",
        "maxhit": "기교 마무리 4단계-130755",
        "deaths": "0",
        "healed": "284022",
        "healed%": "1%",
        "enchps": "437.54",
        "overHeal": "0",
        "Job": "Dnc"
    },
    {
        "name": "꿈빛",
        "duration": "10:48",
        "damage": "8126804",
        "damage%": "11%",
        "encdps": "12519.36",
        "swings": "439",
        "crithits": "140",
        "DirectHitCount": "66",
        "CritDirectHitCount": "66",
        "maxhit": "원초적 파멸-86702",
        "deaths": "0",
        "healed": "3663346",
        "healed%": "15%",
        "enchps": "5643.39",
        "overHeal": "1447669",
        "Job": "War"
    },
    {
        "name": "수비니",
        "duration": "10:48",
        "damage": "7113842",
        "damage%": "9%",
        "encdps": "10958.89",
        "swings": "488",
        "crithits": "105",
        "DirectHitCount": "0",
        "CritDirectHitCount": "0",
        "maxhit": "경멸-87346",
        "deaths": "0",
        "healed": "1476489",
        "healed%": "6%",
        "enchps": "2274.53",
        "overHeal": "57347",
        "Job": "Drk"
    },
    {
        "name": "꼬르",
        "duration": "10:49",
        "damage": "5038812",
        "damage%": "6%",
        "encdps": "7762.30",
        "swings": "409",
        "crithits": "103",
        "DirectHitCount": "0",
        "CritDirectHitCount": "0",
        "maxhit": "극염법-36424",
        "deaths": "0",
        "healed": "2686584",
        "healed%": "11%",
        "enchps": "4138.69",
        "overHeal": "1226882",
        "Job": "Sch"
    },
    {
        "name": "조은",
        "duration": "10:54",
        "damage": "4571647",
        "damage%": "6%",
        "encdps": "7042.63",
        "swings": "405",
        "crithits": "75",
        "DirectHitCount": "0",
        "CritDirectHitCount": "0",
        "maxhit": "신탁-93834",
        "deaths": "0",
        "healed": "8550326",
        "healed%": "37%",
        "enchps": "13171.80",
        "overHeal": "4439175",
        "Job": "Ast"
    }
];

export function mergePetData(combatants, encounterDuration) {
    const owners = {};
    const pets = [];

    function extractNickname(inputString) {
        if (!inputString || typeof inputString !== 'string') {
            return { name: inputString, isPet: false };
        }
        
        // Check for pet pattern: "PetName (OwnerName)"
        const petMatch = inputString.match(/^(.+?)\s*\(([^)]+)\)$/);
        if (petMatch) {
            const petName = petMatch[1].trim();
            const ownerName = petMatch[2].trim();
            return { name: petName, owner: ownerName, isPet: true };
        }
        
        return { name: inputString, isPet: false };
    }

    for (const c of combatants) {
        const petInfo = extractNickname(c.name);
        if (petInfo.isPet) {
            pets.push({ ...c, ownerName: petInfo.owner });
        } else {
            owners[c.name] = { ...c };
        }
    }

    // Merge pet stats into owner stats
    for (const pet of pets) {
        const owner = owners[pet.ownerName];
        if (owner) {
            const statsToMerge = ['damage', 'healed', 'overHeal', 'swings', 'DirectHitCount', 'CritDirectHitCount', 'crithits'];
            for (const stat of statsToMerge) {
                owner[stat] = (parseFloat(owner[stat]) || 0) + (parseFloat(pet[stat]) || 0);
            }
            
            // Recalculate DPS and HPS
            const duration = encounterDuration > 0 ? encounterDuration : 647; // Use sample duration
            owner.encdps = (owner.damage / duration).toFixed(1);
            owner.enchps = (owner.healed / duration).toFixed(1);
        }
    }

    // Filter out Limit Break and return only owners
    return Object.values(owners).filter(c => c.name !== 'Limit Break');
}
