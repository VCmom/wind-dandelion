// 获取Canvas和Context
const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');

// 调整Canvas尺寸
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// 定义蒲公英花朵的位置列表
const dandelions = [];
const numDandelions = 5; // 您可以根据需要调整蒲公英的数量

// 随机生成蒲公英的位置
for (let i = 0; i < numDandelions; i++) {
    dandelions.push({
        x: Math.random() * canvas.width * 0.8 + canvas.width * 0.1, // 保持在画布内
        y: canvas.height * (0.6 + Math.random() * 0.2) // 位于画布的下部
    });
}

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
// const bgMusic = document.getElementById('bg-music'); // 如果有背景音乐，可以取消注释

// 全局风力变量
let globalWind = 0;

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
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.size = Math.random() * 3 + 2; // 减小种子大小，更加轻盈
        this.speedX = (Math.random() - 0.5) * 0.2; // 水平速度更小
        this.speedY = -Math.random() * 1.5 - 1.5; // 增加初始向上速度
        this.gravity = 0.005; // 减小重力加速度
        this.wind = globalWind; // 初始风力
        this.angle = Math.random() * Math.PI * 2;
        this.angularSpeed = Math.random() * 0.01 - 0.005;
        this.alpha = 1;
    }

    update() {
        // 空气阻力
        this.speedX *= 0.998;
        this.speedY *= 0.998;

        // 更新风力
        this.wind = globalWind;

        this.speedX += this.wind; // 受全局风力影响的水平速度
        this.speedY += this.gravity; // 重力影响

        this.x += this.speedX;
        this.y += this.speedY;
        this.angle += this.angularSpeed;

        // 超出屏幕边界后逐渐消失
        if (this.y > canvas.height || this.x < 0 || this.x > canvas.width) {
            this.alpha -= 0.02;
        }
    }

    draw() {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);
        ctx.globalAlpha = this.alpha;

        // 绘制种子主体（棕色的椭圆）
        ctx.fillStyle = '#A6795F';
        ctx.beginPath();
        ctx.ellipse(0, 0, this.size * 0.1, this.size * 0.3, 0, 0, Math.PI * 2);
        ctx.fill();

        // 绘制冠毛（白色的放射线）
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 0.5;
        const pappusLength = this.size * 1.5;
        for (let i = 0; i < 12; i++) {
            const angle = (Math.PI * 2 / 12) * i;
            const x = Math.cos(angle) * pappusLength;
            const y = Math.sin(angle) * pappusLength;
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(x, y);
            ctx.stroke();
        }

        ctx.restore();
    }
}

// 绘制蒲公英花朵
function drawDandelions() {
    dandelions.forEach((dandelion) => {
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
        ctx.arc(0, 0, 5, 0, Math.PI * 2);
        ctx.fill();

        // 绘制剩余的花瓣（根据种子数量减少）
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 1;
        let remainingSeeds = Math.max(0, 20 - countParticlesFromDandelion(dandelion) / 2); // 调整剩余种子的计算方式
        for (let i = 0; i < remainingSeeds; i++) {
            ctx.save();
            ctx.rotate((Math.PI * 2 / 20) * i);
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(0, -20);
            ctx.stroke();
            ctx.restore();
        }

        ctx.restore();
    });
}

// 计算特定蒲公英已飘散的种子数量
function countParticlesFromDandelion(dandelion) {
    return particles.filter(p => distance(p.originX, p.originY, dandelion.x, dandelion.y) < 1).length;
}

// 计算两点之间的距离
function distance(x1, y1, x2, y2) {
    const dx = x1 - x2;
    const dy = y1 - y2;
    return Math.sqrt(dx * dx + dy * dy);
}

// 动画循环
function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 绘制背景（可在此处添加动态背景元素）

    // 获取音量数据
    analyser.getByteTimeDomainData(dataArray);
    let sum = 0;
    for (let i = 0; i < dataArray.length; i++) {
        sum += Math.abs(dataArray[i] - 128);
    }
    let volume = sum / dataArray.length;

    // 根据音量生成粒子
    if (volume > 5 && particles.length < 200) { // 调整音量阈值和最大粒子数量
        const numParticles = Math.min(volume / 15, 5); // 调整每次生成的粒子数量
        dandelions.forEach((dandelion) => {
            for (let i = 0; i < numParticles; i++) {
                const particle = new Particle(dandelion.x, dandelion.y);
                // 记录粒子的起始位置，用于计算剩余种子
                particle.originX = dandelion.x;
                particle.originY = dandelion.y;
                particles.push(particle);
            }
        });
    }

    // 更新和绘制粒子
    for (let i = particles.length - 1; i >= 0; i--) {
        let particle = particles[i];
        particle.update();
        if (particle.alpha <= 0) {
            particles.splice(i, 1);
        } else {
            particle.draw();
        }
    }

    // 绘制蒲公英花朵
    drawDandelions();

    requestAnimationFrame(animate);
}

// 窗口尺寸调整
window.addEventListener('resize', () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    // 更新蒲公英的位置（可选，如果需要让蒲公英的位置随窗口变化）
    for (let i = 0; i < numDandelions; i++) {
        dandelions[i].x = Math.random() * canvas.width * 0.8 + canvas.width * 0.1;
        dandelions[i].y = canvas.height * (0.6 + Math.random() * 0.2);
    }
});

// 鼠标移动事件监听，用于控制全局风力
canvas.addEventListener('mousemove', function(event) {
    const mouseX = event.clientX;
    // 计算风力，鼠标在屏幕中的位置决定风力大小和方向
    globalWind = (mouseX / canvas.width - 0.5) * 0.03; // 调整风力范围，-0.015 ~ 0.015
});
