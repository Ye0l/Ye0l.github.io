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
    
    const reels = document.querySelectorAll('.reel');
    const filters = document.querySelectorAll('.filter-btn');
    const selectButton = document.getElementById('select-button');
    const reelItemHeight = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--reel-item-height'));

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

        // 필터가 변경될 때마다 릴을 초기화하고 다시 채움
        reels.forEach(reel => {
            reel.innerHTML = '';
            if (availableJobs.length > 0) {
                const jobPool = shuffleArray([...availableJobs, ...availableJobs]); // 초기 화면용
                const initialItem = createReelItem(jobPool[0]);
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
        
        // 스크롤 시작 전 몇 개의 무작위 아이템
        for (let i = 0; i < 10; i++) {
            scrollItems.push(createReelItem(allJobs[Math.floor(Math.random() * allJobs.length)]));
        }

        // 중앙에 최종 당첨될 아이템 (winnerJob은 중앙 릴에서만 사용)
        scrollItems.push(createReelItem(winnerJob));

        // 스크롤 끝난 후 몇 개의 무작위 아이템
        for (let i = 0; i < 10; i++) {
            scrollItems.push(createReelItem(allJobs[Math.floor(Math.random() * allJobs.length)]));
        }
        
        reel.append(...scrollItems);
        return scrollItems.length; // 총 아이템 개수 반환
    };

    const selectJob = () => {
        if (isSpinning || availableJobs.length === 0) return;
        isSpinning = true;
        selectButton.disabled = true;

        document.querySelectorAll('.winner').forEach(el => el.classList.remove('winner'));
        
        // --- ▼▼▼ RDM 이스터에그 로직 (중앙 릴에만 적용) ▼▼▼ ---
        let mainWinnerJob;
        if (Math.random() < 0.01) { // 1% 확률
            console.log('SPECIAL ALLOCATION: RDM PROTOCOL ACTIVATED');
            const rdmJob = jobs_source.find(job => job.name === 'RDM');
            mainWinnerJob = rdmJob || availableJobs[Math.floor(Math.random() * availableJobs.length)];
        } else {
            mainWinnerJob = availableJobs[Math.floor(Math.random() * availableJobs.length)];
        }
        // --- ▲▲▲ RDM 이스터에그 로직 ▲▲▲ ---

        let maxItems = 0;

        reels.forEach((reel, index) => {
            let reelWinnerJob;
            if (index === 1) { // 중앙 릴은 RDM 이스터에그가 적용된 mainWinnerJob
                reelWinnerJob = mainWinnerJob;
            } else { // 나머지 릴은 해당 역할군 내에서 랜덤하게
                const classJobs = jobs_source.filter(job => job.class === availableJobs[0].class); // 일단 첫 필터 클래스로 제한
                reelWinnerJob = classJobs[Math.floor(Math.random() * classJobs.length)];
            }
            
            const numItems = populateReelWithScrollItems(reel, reelWinnerJob, availableJobs);
            maxItems = Math.max(maxItems, numItems);

            reel.style.transition = 'none';
            reel.style.transform = 'translateY(0)';
            reel.offsetHeight; // Force reflow

            const delay = index * 150; // 릴마다 약간의 시간차
            setTimeout(() => {
                reel.style.transition = `transform 3s cubic-bezier(0.25, 1, 0.5, 1)`;
                // 목표 위치: 10개의 프리 스크롤 아이템 + 최종 당첨 아이템이 중앙에 오도록 (인덱스 10)
                const targetPosition = -10 * reelItemHeight; 
                reel.style.transform = `translateY(${targetPosition}px)`;
            }, delay);
        });

        setTimeout(() => {
            isSpinning = false;
            selectButton.disabled = false;
            // 각 릴의 중앙 아이템에 winner 클래스 추가
            reels.forEach(reel => {
                // 중앙에 오는 아이템은 10번째 인덱스 (0부터 시작)
                const winnerItem = reel.children[10]; 
                if (winnerItem) {
                    winnerItem.classList.add('winner');
                }
            });
        }, 3500 + reels.length * 150); // 모든 릴의 애니메이션이 끝난 후
    };

    filters.forEach(button => {
        button.addEventListener('click', () => {
            button.classList.toggle('selected');
            updateAvailableJobs();
        });
    });

    selectButton.addEventListener('click', selectJob);

    // 초기화
    updateAvailableJobs();
});
