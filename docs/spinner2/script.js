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
    
    let jobs = [];
    let currentRotation = 0;
    let isSpinning = false;

    const spinner = document.getElementById('spinner');
    const spinButton = document.getElementById('spin-button');
    const filters = document.querySelectorAll('.filter-btn');
    const resultDisplay = document.getElementById('result-display');

    const updateSpinner = () => {
        const selectedClasses = [...filters]
            .filter(btn => btn.classList.contains('selected'))
            .map(btn => btn.dataset.class);

        jobs = jobs_source.filter(job => selectedClasses.includes(job.class));
        drawSpinner();
    };

    const drawSpinner = () => {
        spinner.innerHTML = '';
        if (jobs.length === 0) {
            spinButton.disabled = true;
            return;
        }
        spinButton.disabled = false;

        const sliceAngle = 360 / jobs.length;

        jobs.forEach((job, i) => {
            const itemAngle = sliceAngle * i;
            const item = document.createElement('div');
            item.className = 'spinner-item';
            
            const icon = document.createElement('span');
            icon.className = 'job-icon';
            icon.style.setProperty('--bg-pos', job.imagePos);
            // 아이콘이 항상 정면을 보도록 역회전 각도를 변수로 전달
            icon.style.setProperty('--reverse-angle', `-${itemAngle}deg`);
            
            item.appendChild(icon);
            item.style.transform = `rotate(${itemAngle}deg)`;
            spinner.appendChild(item);
        });
    };
    
    // 이전에 당첨된 아이템의 하이라이트를 제거하는 함수
    const clearWinnerHighlight = () => {
        const previousWinner = spinner.querySelector('.winner');
        if (previousWinner) {
            previousWinner.classList.remove('winner');
        }
    };

    const spin = () => {
        if (isSpinning || jobs.length === 0) return;
        isSpinning = true;
        spinButton.disabled = true;
        resultDisplay.classList.remove('visible');
        clearWinnerHighlight();
        
        // 이스터에그: 1% 확률
        if (Math.random() < 0.01) {
             console.log('YEAH');
             const rdm = jobs_source.find(j => j.name === 'RDM');
             if(rdm) jobs = Array(jobs_source.length).fill(rdm);
             drawSpinner();
        }

        const sliceAngle = 360 / jobs.length;
        const winnerIndex = Math.floor(Math.random() * jobs.length);
        const winner = jobs[winnerIndex];

        // 목표 각도 계산 (포인터가 12시 방향 기준)
        const targetRotation = -(winnerIndex * sliceAngle);
        
        // 추가 회전 (최소 5바퀴 ~ 10바퀴)
        const extraRotations = 360 * (5 + Math.floor(Math.random() * 5));
        
        // 회전값 누적 방식 대신, 최종 각도를 계산하여 초기화 문제 방지
        const finalRotation = currentRotation - (currentRotation % 360) + extraRotations + targetRotation;
        currentRotation = finalRotation;
        
        spinner.style.transform = `rotate(${currentRotation}deg)`;

        setTimeout(() => {
            isSpinning = false;
            spinButton.disabled = false;
            
            // 당첨 아이템에 winner 클래스 추가
            const winnerElement = spinner.children[winnerIndex];
            if(winnerElement) {
                winnerElement.classList.add('winner');
            }
            
            showResult(winner);
        }, 5000); // CSS transition 시간과 동일하게 설정
    };
    
    const showResult = (job) => {
        const resultIcon = resultDisplay.querySelector('.job-icon');
        const resultName = resultDisplay.querySelector('.job-name');
        
        resultIcon.style.setProperty('--bg-pos', job.imagePos);
        resultName.textContent = job.name;
        resultDisplay.classList.add('visible');
    };

    filters.forEach(button => {
        button.addEventListener('click', () => {
            button.classList.toggle('selected');
            updateSpinner();
        });
    });

    spinButton.addEventListener('click', spin);

    // 초기화
    updateSpinner();
});
