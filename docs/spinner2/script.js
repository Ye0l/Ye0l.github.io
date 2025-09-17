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
            const item = document.createElement('div');
            item.className = 'spinner-item';
            
            const icon = document.createElement('span');
            icon.className = 'job-icon';
            icon.style.setProperty('--bg-pos', job.imagePos);
            
            item.appendChild(icon);
            item.style.transform = `rotate(${sliceAngle * i}deg)`;
            spinner.appendChild(item);
        });
    };

    const spin = () => {
        if (isSpinning || jobs.length === 0) return;
        isSpinning = true;
        spinButton.disabled = true;
        resultDisplay.classList.remove('visible');
        
        // 이스터에그: 1% 확률로 RDM 파티
        if (Math.random() < 0.01) {
             console.log('YEAH');
             const rdm = jobs_source.find(j => j.name === 'RDM');
             jobs = Array(jobs_source.length).fill(rdm);
             drawSpinner();
        }

        const sliceAngle = 360 / jobs.length;
        const winnerIndex = Math.floor(Math.random() * jobs.length);
        const winner = jobs[winnerIndex];

        // 목표 각도 계산 (포인터가 3시 방향이므로 90도를 빼줌)
        const targetRotation = 360 - (winnerIndex * sliceAngle) - (sliceAngle / 2);
        
        // 추가 회전 (최소 5바퀴 ~ 10바퀴)
        const extraRotations = 360 * (5 + Math.floor(Math.random() * 5));
        
        currentRotation += extraRotations + targetRotation;
        spinner.style.transform = `rotate(${currentRotation}deg)`;

        setTimeout(() => {
            isSpinning = false;
            spinButton.disabled = false;
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
