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
// const bgMusic = document.getElementById('bg-music');

// 开始按钮事件监听
startButton.addEventListener('click', () => {
    // 播放背景音乐（如果有）
    // bgMusic.play();

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
    constructor(x, y, size, speedX, speedY, angle) {
        this.x = x;
        this.y = y;
        this.size = size;
        this.speedX = speedX;
        this.speedY = speedY;
        this.angle = angle;
        this.angularSpeed = Math.random() * 0.2 - 0.1;
        this.alpha = 1;
    }

    update() {
        this.x += this.speedX;
        this.y += this.speedY;
        this.angle += this.angularSpeed;
        this.alpha -= 0.003;
    }

    draw() {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);
        ctx.globalAlpha = this.alpha;

        // 绘制蒲公英种子
        ctx.beginPath();
        // 绘制种子的“种子”部分
        ctx.fillStyle = '#A6795F';
        ctx.ellipse(0, 0, this.size * 0.2, this.size * 0.4, 0, 0, Math.PI * 2);
        ctx.fill();

        // 绘制种子的“绒毛”部分
        ctx.strokeStyle = '#FFFFFF';
        for (let i = 0; i < 10; i++) {
            ctx.beginPath();
            ctx.moveTo(0, 0);
            const angle = (Math.PI * 2 / 10) * i;
            const x = Math.cos(angle) * this.size;
            const y = Math.sin(angle) * this.size;
            ctx.lineTo(x, y);
            ctx.stroke();
        }

        ctx.restore();
    }
}

// 绘制蒲公英花朵
function drawDandelion() {
    // 绘制茎
    ctx.strokeStyle = '#88b04b';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(dandelion.x, dandelion.y);
    ctx.lineTo(dandelion.x, canvas.height);
    ctx.stroke();

    // 绘制蒲公英花盘
    ctx.save();
    ctx.translate(dandelion.x, dandelion.y);

    // 绘制花盘中心
    ctx.fillStyle = '#A6795F';
    ctx.beginPath();
    ctx.arc(0, 0, 8, 0, Math.PI * 2);
    ctx.fill();

    // 绘制花瓣（绒毛）
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 2;
    for (let i = 0; i < 60; i++) {
        ctx.save();
        ctx.rotate((Math.PI * 2 / 60) * i);
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(0, -30);
        ctx.stroke();
        ctx.restore();
    }

    ctx.restore();
}

// 动画循环
function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 绘制背景（如果需要，可以在这里绘制动态背景元素）

    // 获取音量数据
    analyser.getByteTimeDomainData(dataArray);
    let sum = 0;
    for (let i = 0; i < dataArray.length; i++) {
        sum += Math.abs(dataArray[i] - 128);
    }
    let volume = sum / dataArray.length;

    // 根据音量生成粒子
    if (volume > 10) {
        for (let i = 0; i < volume / 3; i++) {
            const size = Math.random() * 15 + 10;
            const speedX = (Math.random() - 0.5) * 2;
            const speedY = -Math.random() * 3 - 2;
            const angle = Math.random() * Math.PI * 2;
            particles.push(new Particle(dandelion.x, dandelion.y, size, speedX, speedY, angle));
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
