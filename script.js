// 获取Canvas和Context
const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');

// 调整Canvas尺寸
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// 定义蒲公英花朵的位置
const dandelion = {
    x: canvas.width / 2,
    y: canvas.height * 0.75
};

// 存储种子粒子
let particles = [];

// 声音相关变量
let audioContext;
let analyser;
let dataArray;
let source;

// 获取DOM元素
const prompt = document.getElementById('prompt');
const startButton = document.getElementById('start-button');

// 开始按钮事件监听
startButton.addEventListener('click', () => {
    // 请求麦克风权限
    navigator.mediaDevices.getUserMedia({ audio: true })
        .then(stream => {
            // 初始化音频上下文
            audioContext = new (window.AudioContext || window.webkitAudioContext)();
            analyser = audioContext.createAnalyser();
            source = audioContext.createMediaStreamSource(stream);
            source.connect(analyser);
            analyser.fftSize = 256;
            dataArray = new Uint8Array(analyser.frequencyBinCount);

            // 隐藏提示界面，开始动画
            prompt.style.display = 'none';
            animate();
        })
        .catch(err => {
            alert('需要麦克风权限才能体验游戏。');
            console.error(err);
        });
});

// 粒子类
class Particle {
    constructor(x, y, size, speedX, speedY) {
        this.x = x;
        this.y = y;
        this.size = size;
        this.speedX = speedX;
        this.speedY = speedY;
        this.alpha = 1;
    }

    update() {
        this.x += this.speedX;
        this.y += this.speedY;
        this.alpha -= 0.005;
    }

    draw() {
        ctx.save();
        ctx.globalAlpha = this.alpha;
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
}

// 绘制蒲公英花朵
function drawDandelion() {
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(dandelion.x, dandelion.y, 10, 0, Math.PI * 2);
    ctx.fill();
    // 绘制茎
    ctx.strokeStyle = '#88b04b';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(dandelion.x, dandelion.y);
    ctx.lineTo(dandelion.x, canvas.height);
    ctx.stroke();
}

// 动画循环
function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 获取音量数据
    analyser.getByteTimeDomainData(dataArray);
    let sum = 0;
    for (let i = 0; i < dataArray.length; i++) {
        sum += Math.abs(dataArray[i] - 128);
    }
    let volume = sum / dataArray.length;

    // 根据音量生成粒子
    if (volume > 10) {
        for (let i = 0; i < volume / 5; i++) {
            const size = Math.random() * 2 + 1;
            const speedX = (Math.random() - 0.5) * 2;
            const speedY = -Math.random() * 3 - 1;
            particles.push(new Particle(dandelion.x, dandelion.y, size, speedX, speedY));
        }
    }

    // 更新和绘制粒子
    particles.forEach((particle, index) => {
        if (particle.alpha <= 0) {
            particles.splice(index, 1);
        } else {
            particle.update();
            particle.draw();
        }
    });

    // 绘制蒲公英
    drawDandelion();

    requestAnimationFrame(animate);
}

// 窗口尺寸调整
window.addEventListener('resize', () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    dandelion.x = canvas.width / 2;
    dandelion.y = canvas.height * 0.75;
});
