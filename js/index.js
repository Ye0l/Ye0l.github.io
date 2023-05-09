function showLoader() {
    const loader = document.getElementById("loader-bg");
    loader.style.display = "flex";
}

function hideLoader() {
    const loader = document.getElementById("loader-bg");
    loader.style.opacity = "0";
    setTimeout(() => {
        loader.style.display = "none";
    }, 1000);
}

function getRandomImage() {
    const url = "https://picsum.photos/1600/900/?blur";

    showLoader();
  
    fetch(url, {
      method: "GET",
      redirect: "follow"
    })
    .then(response => {
        if (response.ok) {
            const imageUrl = response.url;
            const bgMask = document.getElementById('main-bg');
            bgMask.style.backgroundImage = `url(${imageUrl})`;

            hideLoader();
        } else {
            console.error("이미지를 불러오는 데 실패했습니다.");
            hideLoader();
        }
    })
    .catch(error => {
        console.error("이미지를 불러오는 도중 오류가 발생했습니다:", error);
        hideLoader();
    });
}

document.addEventListener("DOMContentLoaded", () => {
    getRandomImage();
})