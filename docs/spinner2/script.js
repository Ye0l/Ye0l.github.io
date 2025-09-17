document.addEventListener('DOMContentLoaded', () => {
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
    };

    const populateReels = (winner) => {
        reels.forEach((reel, index) => {
            reel.innerHTML = '';
            // 릴 목록 생성 (더 길게 만들어 스크롤 효과 보장)
            const jobPool = shuffleArray([...availableJobs, ...availableJobs, ...availableJobs]);
            const reelItems = [];
            
            // 릴 중앙에 올 아이템 설정
            const targetItem = (index === 1) ? winner : jobPool[Math.floor(Math.random() * jobPool.length)];

            // 릴 목록 채우기
            for (let i = 0; i < 30; i++) { // 총 30개 아이템으로 릴 구성
                const item = document.createElement('div');
                if (i === 15) { // 중앙 위치
                    item.textContent = targetItem.name;
                } else {
                    item.textContent = jobPool[i % jobPool.length].name;
                }
                reelItems.push(item);
            }
            reel.append(...reelItems);
        });
    };

    const selectJob = () => {
        if (isSpinning || availableJobs.length === 0) return;
        isSpinning = true;
        selectButton.disabled = true;

        // 기존 winner 효과 제거
        document.querySelectorAll('.winner').forEach(el => el.classList.remove('winner'));
        
        const winner = availableJobs[Math.floor(Math.random() * availableJobs.length)];
        populateReels(winner);

        reels.forEach((reel, index) => {
            // 초기 위치로 리셋
            reel.style.transition = 'none';
            reel.style.transform = 'translateY(0)';
            
            // 강제 리플로우
            reel.offsetHeight; 

            // 애니메이션 시작
            const delay = index * 100; // 릴마다 약간의 시간차
            setTimeout(() => {
                reel.style.transition = `transform 3s cubic-bezier(0.25, 1, 0.5, 1)`;
                const targetPosition = -15 * 50 + 50; // 중앙(15번째) 아이템 위치로 이동 (50px = 아이템 높이)
                reel.style.transform = `translateY(${targetPosition}px)`;
            }, delay);
        });

        setTimeout(() => {
            isSpinning = false;
            selectButton.disabled = false;
            // 중앙 릴의 당첨 아이템에 하이라이트 효과 추가
            reels[1].children[15].classList.add('winner');
        }, 3500); // 전체 애니메이션 시간
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
