document.addEventListener('DOMContentLoaded', () => {
    const jobs_source = [
        { name: 'PLD', imagePos: '-90px 0', class: 'tank' },
        { name: 'WAR', imagePos: '-135px 0', class: 'tank' },
        { name: 'DRK', imagePos: '-180px 0', class: 'tank' },
        { name: 'GNB', imagePos: '-225px 0', class: 'tank' },
        { name: 'WHM', imagePos: '-90px -45px', class: 'heal' },
        { name: 'SCH', imagePos: '-135px -45px', class: 'heal' },
        { name: 'AST', imagePos: '-180px -45px', class: 'heal' },
        { name: 'SGE', imagePos: '-225px -45px', class: 'heal' },
        { name: 'MNK', imagePos: '-90px -90px', class: 'melee' },
        { name: 'DRG', imagePos: '-135px -90px', class: 'melee' },
        { name: 'NIN', imagePos: '-180px -90px', class: 'melee' },
        { name: 'SAM', imagePos: '-225px -90px', class: 'melee' },
        { name: 'RPR', imagePos: '-270px -90px', class: 'melee' },
        { name: 'BRD', imagePos: '-90px -135px', class: 'range' },
        { name: 'MCH', imagePos: '-135px -135px', class: 'range' },
        { name: 'DNC', imagePos: '-180px -135px', class: 'range' },
        { name: 'BLM', imagePos: '-90px -180px', class: 'magic' },
        { name: 'SMN', imagePos: '-135px -180px', class: 'magic' },
        { name: 'RDM', imagePos: '-180px -180px', class: 'magic' },
    ];

    let availableJobs = [];
    let isSpinning = false;
    
    const reelsContainer = document.querySelector('.reels');
    const reels = document.querySelectorAll('.reel');
    const filters = document.querySelectorAll('.filter-btn');
    const selectButton = document.getElementById('select-button');
    const reelItemHeight = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--reel-item-height'));
    
    // --- ▼▼▼ 수정 ▼▼▼ ---
    const WINNER_INDEX = 25; // 중앙에 위치할 아이템의 인덱스 (0부터 시작)
    const REEL_ITEM_COUNT = 50; // 각 릴에 생성할 총 아이템 수

    const shuffleArray = (array) => {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    };

    const updateAvailableJobs = () => {
        const selectedClasses = [...filters]
            .filter(btn => btn.classList.contains('selected'))
            .map(btn => btn.dataset.class);
        
        availableJobs = jobs_source.filter(job => selectedClasses.includes(job.class));
        selectButton.disabled = availableJobs.length === 0;

        reels.forEach(reel => {
            reel.innerHTML = '';
            if (availableJobs.length > 0) {
                const initialItem = createReelItem(availableJobs[Math.floor(Math.random() * availableJobs.length)]);
                reel.appendChild(initialItem);
            }
        });
    };

    const createReelItem = (job) => {
        const itemDiv = document.createElement('div');
        itemDiv.className = 'reel-item';
        
        const iconSpan = document.createElement('span');
        iconSpan.className = 'job-icon';
        iconSpan.style.setProperty('--bg-pos', job.imagePos);
        
        const nameSpan = document.createElement('span');
        nameSpan.textContent = job.name;

        itemDiv.appendChild(iconSpan);
        itemDiv.appendChild(nameSpan);
        return itemDiv;
    };

    const populateReelWithScrollItems = (reel, winnerJob, allJobs) => {
        reel.innerHTML = '';
        const scrollItems = [];
        
        for (let i = 0; i < REEL_ITEM_COUNT; i++) {
            if (i === WINNER_INDEX) {
                scrollItems.push(createReelItem(winnerJob));
            } else {
                scrollItems.push(createReelItem(allJobs[Math.floor(Math.random() * allJobs.length)]));
            }
        }
        
        reel.append(...scrollItems);
    };

    const selectJob = () => {
        if (isSpinning || availableJobs.length === 0) return;
        isSpinning = true;
        selectButton.disabled = true;

        document.querySelectorAll('.winner').forEach(el => el.classList.remove('winner'));
        
        let mainWinnerJob;
        if (Math.random() < 0.01) {
            console.log('SPECIAL ALLOCATION: RDM PROTOCOL ACTIVATED');
            mainWinnerJob = jobs_source.find(job => job.name === 'RDM') || availableJobs[0];
        } else {
            mainWinnerJob = availableJobs[Math.floor(Math.random() * availableJobs.length)];
        }

        reels.forEach((reel, index) => {
            const reelWinnerJob = (index === 1) ? mainWinnerJob : availableJobs[Math.floor(Math.random() * availableJobs.length)];
            
            populateReelWithScrollItems(reel, reelWinnerJob, availableJobs);

            reel.style.transition = 'none';
            // 시작 위치를 살짝 위로 조정하여 부드러운 출발 효과
            reel.style.transform = `translateY(${reelItemHeight}px)`;
            reel.offsetHeight; 

            const delay = index * 200;
            setTimeout(() => {
                reel.style.transition = `transform 4s cubic-bezier(0.23, 1, 0.32, 1)`;
                // --- ▼▼▼ 중앙 정렬 계산 수정 ▼▼▼ ---
                // 목표: WINNER_INDEX에 있는 아이템이 중앙에 오도록 함.
                // translateY 값은 (전체 아이템 높이 중 목표 아이템의 시작점)을 0으로 만드는 값.
                const targetPosition = -(WINNER_INDEX * reelItemHeight);
                reel.style.transform = `translateY(${targetPosition}px)`;
            }, delay);
        });

        setTimeout(() => {
            isSpinning = false;
            selectButton.disabled = false;
            reels.forEach(reel => {
                const winnerItem = reel.children[WINNER_INDEX]; 
                if (winnerItem) {
                    winnerItem.classList.add('winner');
                }
            });
        }, 4000 + reels.length * 200);
    };

    filters.forEach(button => {
        button.addEventListener('click', () => {
            button.classList.toggle('selected');
            updateAvailableJobs();
        });
    });

    selectButton.addEventListener('click', selectJob);

    updateAvailableJobs();
});
