document.addEventListener('DOMContentLoaded', () => {
    // 이미지 경로(imagePos) 속성 제거
    const jobs_source = [
        { name: 'PLD', class: 'tank' }, { name: 'WAR', class: 'tank' },
        { name: 'DRK', class: 'tank' }, { name: 'GNB', class: 'tank' },
        { name: 'WHM', class: 'heal' }, { name: 'SCH', class: 'heal' },
        { name: 'AST', class: 'heal' }, { name: 'SGE', class: 'heal' },
        { name: 'MNK', class: 'melee' }, { name: 'DRG', class: 'melee' },
        { name: 'NIN', class: 'melee' }, { name: 'SAM', class: 'melee' },
        { name: 'RPR', class: 'melee' },
        { name: 'BRD', class: 'range' }, { name: 'MCH', class: 'range' },
        { name: 'DNC', class: 'range' },
        { name: 'BLM', class: 'magic' }, { name: 'SMN', class: 'magic' },
        { name: 'RDM', class: 'magic' },
    ];

    let availableJobs = [];
    let isSpinning = false;
    
    const reels = document.querySelectorAll('.reel');
    const filters = document.querySelectorAll('.filter-btn');
    const selectButton = document.getElementById('select-button');
    const reelItemHeight = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--reel-item-height'));
    
    const WINNER_INDEX = 25;
    const REEL_ITEM_COUNT = 50;

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
    
    // createReelItem 함수에서 아이콘 생성 로직 제거
    const createReelItem = (job) => {
        const itemDiv = document.createElement('div');
        itemDiv.className = 'reel-item';
        itemDiv.textContent = job.name;
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
            reel.style.transform = `translateY(${reelItemHeight}px)`;
            reel.offsetHeight; 

            const delay = index * 200;
            setTimeout(() => {
                reel.style.transition = `transform 4s cubic-bezier(0.23, 1, 0.32, 1)`;
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
