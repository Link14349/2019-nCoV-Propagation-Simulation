const PEOPLE_STATE_FREEZE = -1;
const PEOPLE_STATE_HEALTH = 0;
const PEOPLE_STATE_LATENT = 1;
const PEOPLE_STATE_SICK = 2;
const PEOPLE_STATE_DIE = 3;
const INFINITESIMAL = 1e-5;
let FRAME_TO_REAL = 60 * 60;// 对应的现实单位为秒, 一帧对应一小时
const PEOPLE_COUNT_BASE = 2000;
const PEOPLE_COUNT_RAND_MAX = 0;

class Simulator {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext("2d");
        this.backInitSettings();
    }
    backInitSettings() {
        this.hospResTime = 6 * 60;// 单位为分钟
        this.ALL_BEDS = this.beds = 500;
        this.virusLatentTime = 14 * 24 * 60;// 潜伏期十四天, 单位为分钟
        this.colors = ["#fff", "#ff0", "#f00", "#f0f"];
        this.freezeColor = "#fa0";
        this.people = [];
        this.turnover = 1;
        this.now = 0;
        this.level = 0;
        this.cureCount = 0;
        this.broadRate = .8;
        this.sickCounts = [];
        this.haveIndex = NaN;
        this.discover = false;
        this.deathCount = 0;
        this.deathCounts = [];
        this.recoveryCounts = [];
        this.cureRate = .00002;
        this.levelColor = ["#0f0", "#fa0", "#f0f", "#f00"];
        this.recoveryCount = 0;
        this.stop = false;
        this.updateIBAW();
    }
    updateIBAW() {// update isolated bed area width
        this.isolatedBedAreaWidth_px = Math.abs(this.canvas.width - this.canvas.height) * 0.75 * 0.5;
        this.isolatedBedAreaWidth_count = Math.floor(this.isolatedBedAreaWidth_px / 5) - 1;
        this.isolatedBedAreaWidth_px = this.isolatedBedAreaWidth_count * 5 + 5;
    }
    pause() {
        this.stop = true;
    }
    next() {
        this.stop = false;
        window.requestAnimationFrame((function cb() {
            if (this.stop) return;
            this.update();
            window.requestAnimationFrame(cb.bind(this));
        }).bind(this));
    }
    drawChart() {
        let HEIGHT_RATIO = .2;
        let height = this.canvas.height * HEIGHT_RATIO;
        const TOP_POS = this.canvas.height * (1 - HEIGHT_RATIO);
        const MAX = PEOPLE_COUNT_BASE + PEOPLE_COUNT_RAND_MAX;
        const TOP_HEIGHT = 30;
        const BOTTOM_HEIGHT = 10;
        let chartHeight = height - TOP_HEIGHT - BOTTOM_HEIGHT;
        const ONE_HEIGHT = chartHeight / MAX;
        const SINGLE_WIDTH = 75;
        this.ctx.fillStyle = "rgba(150, 150, 150, .8)";
        this.ctx.fillRect(0, TOP_POS, this.canvas.width, height);
        this.ctx.beginPath();
        this.ctx.moveTo(50, TOP_POS + TOP_HEIGHT);
        this.ctx.lineTo(50, this.canvas.height - BOTTOM_HEIGHT);
        this.ctx.lineTo(this.canvas.width - 50, this.canvas.height - BOTTOM_HEIGHT);
        this.ctx.strokeStyle = "#fa0";
        this.ctx.stroke();
        this.ctx.closePath();
        this.ctx.beginPath();
        this.ctx.textBaseline = "middle";
        this.ctx.textAlign = "right";
        this.ctx.font = "10px SimHei";
        this.ctx.fillStyle = "#ff0";
        this.ctx.fillText("0", 45, this.canvas.height - BOTTOM_HEIGHT);
        this.ctx.fillText("500", 45, this.canvas.height - BOTTOM_HEIGHT - 500 * ONE_HEIGHT);
        this.ctx.fillText("1000", 45, this.canvas.height - BOTTOM_HEIGHT - 1000 * ONE_HEIGHT);
        this.ctx.fillText("1500", 45, this.canvas.height - BOTTOM_HEIGHT - 1500 * ONE_HEIGHT);
        this.ctx.fillText("2000", 45, this.canvas.height - BOTTOM_HEIGHT - 2000 * ONE_HEIGHT);
        this.ctx.textBaseline = "top";
        this.ctx.textAlign = "left";
        this.ctx.fillStyle = "#fff";
        this.ctx.font = "15px SimHei";
        this.ctx.fillText("图例: ", 5, TOP_POS + 5);
        this.ctx.font = "12px SimHei";
        this.ctx.fillStyle = "#f00";
        this.ctx.fillText("—— 发病", 50, TOP_POS + 8);
        this.ctx.fillStyle = "#f0f";
        this.ctx.fillText("—— 死亡", 105, TOP_POS + 8);
        this.ctx.fillStyle = "#0f0";
        this.ctx.fillText("—— 治愈", 160, TOP_POS + 8);
        this.ctx.closePath();
        this.ctx.beginPath();
        this.ctx.textBaseline = "top";
        this.ctx.textAlign = "center";
        this.ctx.font = "10px SimHei";
        this.ctx.fillStyle = "#fff";
        const ROW_COUNT = Math.floor((this.canvas.width - 50 - 10) / SINGLE_WIDTH);
        let SPACE = ROW_COUNT > this.sickCounts.length ? 1 : Math.floor(this.sickCounts.length / ROW_COUNT);
        if ((this.sickCounts.length - 1) * SINGLE_WIDTH / SPACE > (this.canvas.width - 50 - 10)) {
            SPACE++;
        }
        let dateIndex = 0;
        this.ctx.beginPath();
        this.ctx.moveTo(50, this.canvas.height - BOTTOM_HEIGHT);
        let startIndex = NaN;
        let endIndex = NaN;
        for (let i = 0; i < this.sickCounts.length; i += SPACE) {
            if (!this.sickCounts[i]) continue;
            if (isNaN(startIndex)) startIndex = i;
            if (i + SPACE - 1 >= this.sickCounts.length) {
                endIndex = i;
                break;
            }
            let dateS = new Date(this.start + i * 24 * 60 * 60 * 1000);
            let dateE = new Date(this.start + (i + SPACE - 1) * 24 * 60 * 60 * 1000);
            let pointHeight = this.sickCounts[i + SPACE - 1] * ONE_HEIGHT;
            // this.ctx.arc(dateIndex * SINGLE_WIDTH + SINGLE_WIDTH + 10, this.canvas.height - BOTTOM_HEIGHT - pointHeight, 1, 0, Math.PI * 2);
            this.ctx.lineTo(dateIndex * SINGLE_WIDTH + SINGLE_WIDTH + 10, this.canvas.height - BOTTOM_HEIGHT - pointHeight);
            // this.ctx.fill();
            this.ctx.fillStyle = "#f00";
            this.ctx.fillText("*", dateIndex * SINGLE_WIDTH + SINGLE_WIDTH + 10, this.canvas.height - BOTTOM_HEIGHT - pointHeight - 5);
            this.ctx.fillStyle = "#fff";
            this.ctx.fillText(dateS.getMonth() + 1 + "/" + dateS.getDate() + "~" + (dateE.getMonth() + 1) + "/" + dateE.getDate(), dateIndex * SINGLE_WIDTH + SINGLE_WIDTH + 10, this.canvas.height - BOTTOM_HEIGHT);
            this.ctx.fillStyle = "#fa0";
            this.ctx.fillText(this.sickCounts[i + SPACE - 1], dateIndex * SINGLE_WIDTH + SINGLE_WIDTH + 10, this.canvas.height - BOTTOM_HEIGHT - pointHeight - 15);
            dateIndex++;
        }
        this.ctx.strokeStyle = "#f00";
        this.ctx.stroke();
        this.ctx.closePath();
        this.ctx.beginPath();
        this.ctx.moveTo(50, this.canvas.height - BOTTOM_HEIGHT);
        dateIndex = 0;
        for (let i = startIndex; i < this.deathCounts.length; i += SPACE) {
            if (i >= endIndex) break;
            let pointHeight = this.deathCounts[i + SPACE - 1] * ONE_HEIGHT;
            // this.ctx.arc(dateIndex * SINGLE_WIDTH + SINGLE_WIDTH + 10, this.canvas.height - BOTTOM_HEIGHT - pointHeight, 1, 0, Math.PI * 2);
            this.ctx.lineTo(dateIndex * SINGLE_WIDTH + SINGLE_WIDTH + 10, this.canvas.height - BOTTOM_HEIGHT - pointHeight);
            this.ctx.fillStyle = "#f0f";
            let y = this.canvas.height - BOTTOM_HEIGHT - pointHeight - 10;
            // let offset = this.sickCounts[i + SPACE - 1] * ONE_HEIGHT - pointHeight;
            if (Math.abs(this.sickCounts[i + SPACE - 1] * ONE_HEIGHT - pointHeight) < 10) {
                y = this.canvas.height - BOTTOM_HEIGHT - this.sickCounts[i + SPACE - 1] * ONE_HEIGHT - 15 + 10;
            }
            this.ctx.fillText("*", dateIndex * SINGLE_WIDTH + SINGLE_WIDTH + 10, this.canvas.height - BOTTOM_HEIGHT - pointHeight - 5);
            this.ctx.fillStyle = "#faa";
            this.ctx.fillText(this.deathCounts[i + SPACE - 1], dateIndex * SINGLE_WIDTH + SINGLE_WIDTH + 10, y);
            dateIndex++;
        }
        this.ctx.strokeStyle = "#f0f";
        this.ctx.stroke();
        this.ctx.closePath();
        this.ctx.beginPath();
        this.ctx.moveTo(50, this.canvas.height - BOTTOM_HEIGHT);
        dateIndex = 0;
        for (let i = startIndex; i < this.recoveryCounts.length; i += SPACE) {
            if (i >= endIndex) break;
            let pointHeight = this.recoveryCounts[i + SPACE - 1] * ONE_HEIGHT;
            // this.ctx.arc(dateIndex * SINGLE_WIDTH + SINGLE_WIDTH + 10, this.canvas.height - BOTTOM_HEIGHT - pointHeight, 1, 0, Math.PI * 2);
            this.ctx.lineTo(dateIndex * SINGLE_WIDTH + SINGLE_WIDTH + 10, this.canvas.height - BOTTOM_HEIGHT - pointHeight);
            this.ctx.fillStyle = "#0f0";
            let y = this.canvas.height - BOTTOM_HEIGHT - pointHeight - 10;
            if (Math.abs(this.deathCounts[i + SPACE - 1] * ONE_HEIGHT - pointHeight) < 10) {
                y = this.canvas.height - BOTTOM_HEIGHT - this.deathCounts[i + SPACE - 1] * ONE_HEIGHT - 15 + 10;
            }
            this.ctx.fillText("*", dateIndex * SINGLE_WIDTH + SINGLE_WIDTH + 10, this.canvas.height - BOTTOM_HEIGHT - pointHeight - 5);
            this.ctx.fillStyle = "#0ff";
            this.ctx.fillText(this.recoveryCounts[i + SPACE - 1], dateIndex * SINGLE_WIDTH + SINGLE_WIDTH + 10, y);
            dateIndex++;
        }
        this.ctx.strokeStyle = "#0f0";
        this.ctx.stroke();
        this.ctx.closePath();
    }
    simulate() {
        this.start = this.now = (new Date((new Date("2020/1/1")).toDateString())).getTime();
        let MAX_L = Math.max(this.canvas.width, this.canvas.height);
        let count = Math.floor(Math.random() * PEOPLE_COUNT_RAND_MAX) + PEOPLE_COUNT_BASE;
        let firstPerson = Math.floor(Math.random() * count);
        for (let i = 0; i < count; i++) {
            this.people.push(new Person());
            this.people[i].setPosition(MAX_L);
        }
        this.people[firstPerson].infect();
        this.next();
    }
    update() {
        this.ctx.beginPath();
        this.ctx.fillStyle = "#333";
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.closePath();
        this.ctx.save();
        this.ctx.translate(this.canvas.width / 2, this.canvas.height / 2);
        let allSickCount = 0;
        let latentCount = 0;
        let sickCount = 0;
        let freezeCount = 0;
        if (this.cureRate === .00002 && this.people[0].age > 1000 / 3600 * FRAME_TO_REAL && Math.random() < .001) {
            this.cureRate *= 30;
        } else if (this.cureRate === .00002 * 30 && this.people[0].age > 1500 / 3600 * FRAME_TO_REAL && Math.random() < .001) {
            this.cureRate *= 30;
        }
        for (let i = 0; i < this.people.length; i++) {
            let person = this.people[i];
            if (person.state === PEOPLE_STATE_DIE) continue;
            else if (!~person.state) {// 已隔离
                person.age++;
                if (Math.random() < this.cureRate) {
                    person.recovery();
                    this.cureCount++;
                    this.beds++;
                    this.recoveryCount++;
                } else if (Math.random() < .000002) {
                    person.die();
                    this.deathCount++;
                    this.beds++;
                } else {
                    allSickCount++;
                    freezeCount++;
                }
                continue;
            }
            if (person.state) {// 患病
                if (person.state === PEOPLE_STATE_LATENT) latentCount++;
                else if (person.state === PEOPLE_STATE_SICK) {
                    if (this.discover && this.beds && person.age - person.infectedAge >= (this.virusLatentTime + this.hospResTime) / FRAME_TO_REAL * 60) {
                        person.state = PEOPLE_STATE_FREEZE;
                        this.beds--;
                        freezeCount++;
                        continue;
                    } else if (Math.random() < .00005) {
                        person.die();
                        this.deathCount++;
                    } else {
                        sickCount++;
                    }
                }
                allSickCount++;
                person.ICP(this, this.people);
            }
            // 更新数据
            if (person.state === PEOPLE_STATE_LATENT && person.age - person.infectedAge >= this.virusLatentTime / FRAME_TO_REAL * 60) {
                person.state = PEOPLE_STATE_SICK;
            }
            if (!person.death()) person.move(this);
            // 渲染
            this.ctx.beginPath();
            this.ctx.arc(person.x, -person.y, 2, 0, Math.PI * 2);
            this.ctx.fillStyle = this.colors[person.state];
            this.ctx.fill();
            this.ctx.closePath();
            person.age++;
        }
        if (sickCount > .05 * (PEOPLE_COUNT_RAND_MAX + PEOPLE_COUNT_BASE)) this.discover = true;
        this.ctx.restore();
        this.ctx.beginPath();
        this.ctx.textBaseline = "top";
        this.ctx.textAlign = "center";
        this.ctx.font = "25px SimHei";
        this.ctx.fillStyle = "#fff";
        this.ctx.fillText("2019-nCoV接触传染模型", this.canvas.width / 2, 2);
        this.ctx.font = "15px SimHei";
        this.ctx.fillText("by 郑元昊", this.canvas.width / 2, 27);
        this.ctx.textAlign = "left";
        this.ctx.font = "20px SimHei";
        let date = (new Date(this.now));
        this.ctx.fillText(date.getFullYear() + "/" + (date.getMonth() + 1) + "/" + date.getDate() + " " + date.getHours() + ":" + date.getMinutes(), 5, 45);
        this.ctx.fillText("样本数量: " + this.people.length, 5, 65);
        this.ctx.fillText("健康人数: " + (this.people.length - allSickCount), 5, 85);
        this.ctx.fillText("总患病人数: " + allSickCount, 5, 105);
        this.ctx.fillText("潜伏期人数: " + latentCount, 5, 125);
        this.ctx.fillText("发病人数: " + sickCount, 5, 145);
        this.ctx.fillText("累计治愈人数: " + this.cureCount, 5, 165);
        this.ctx.font = "30px SimHei";
        this.ctx.fillText("图例", 5, 210);
        this.ctx.font = "20px SimHei";
        this.ctx.fillStyle = "#fff";
        this.ctx.fillText("█: 健康", 5, 245);
        this.ctx.fillStyle = "#ff0";
        this.ctx.fillText("█: 潜伏期中", 5, 265);
        this.ctx.fillStyle = "#f00";
        this.ctx.fillText("█: 已发病", 5, 285);
        this.ctx.fillStyle = this.levelColor[this.level];
        this.ctx.fillText("城市危险等级: " + this.level, 5, 315);
        this.ctx.closePath();
        this.ctx.beginPath();
        this.ctx.strokeStyle = "#fff";
        this.ctx.textBaseline = "top";
        this.ctx.textAlign = "right";
        this.ctx.font = "25px SimHei";
        this.ctx.fillStyle = "#fff";
        this.ctx.fillText("医院床位", this.canvas.width - 5, 32);
        let textWidth = this.ctx.measureText("医院床位").width;
        this.ctx.font = "15px SimHei";
        this.ctx.fillText(this.beds + "/" + this.ALL_BEDS, this.canvas.width - 5 - textWidth, 42);
        let areaHeight = Math.ceil(this.ALL_BEDS / this.isolatedBedAreaWidth_count) * 5 + 5;
        this.ctx.strokeRect(this.canvas.width - this.isolatedBedAreaWidth_px, 60, this.isolatedBedAreaWidth_px, areaHeight);
        this.ctx.closePath();
        let row = 0, col = 0;
        for (let i = 0; i < freezeCount; i++) {
            this.ctx.beginPath();
            this.ctx.arc(this.canvas.width - this.isolatedBedAreaWidth_px + row * 5 + 5, col * 5 + 65, 2, 0, Math.PI * 2);
            this.ctx.fillStyle = this.freezeColor;
            this.ctx.fill();
            this.ctx.closePath();
            row++;
            if (row >= this.isolatedBedAreaWidth_count) {
                row = 0;
                col++;
            }
        }
        row = 0;
        col = 0;
        this.ctx.fillStyle = "#fff";
        this.ctx.font = "25px SimHei";
        this.ctx.fillText("太平间", this.canvas.width - 5, 62 + areaHeight);
        textWidth = this.ctx.measureText("太平间").width;
        this.ctx.font = "15px SimHei";
        this.ctx.fillText(this.deathCount + "/" + this.people.length, this.canvas.width - 5 - textWidth, 72 + areaHeight);
        this.ctx.strokeRect(this.canvas.width - this.isolatedBedAreaWidth_px, areaHeight + 90, this.isolatedBedAreaWidth_px, Math.ceil(this.deathCount / this.isolatedBedAreaWidth_count) * 5 + 5);
        for (let i = 0; i < this.deathCount; i++) {
            this.ctx.beginPath();
            this.ctx.arc(this.canvas.width - this.isolatedBedAreaWidth_px + row * 5 + 5, col * 5 + 5 + areaHeight + 90, 2, 0, Math.PI * 2);
            this.ctx.fillStyle = this.colors[PEOPLE_STATE_DIE];
            this.ctx.fill();
            this.ctx.closePath();
            row++;
            if (row >= this.isolatedBedAreaWidth_count) {
                row = 0;
                col++;
            }
        }
        let lastDay = (new Date(this.now)).getDay();
        this.now += 1000 * FRAME_TO_REAL;
        this.sickCount = sickCount;
        if (sickCount > 800) {
            this.level = 3;
        } else if (sickCount > 500) {
            this.level = 2;
        } else if (sickCount > 200) {
            if (this.level === 2) {
                if (sickCount < 10) this.level = 1;
            } else this.level = 1;
        } else {
            if (this.level === 1 && sickCount === 0) return 0;
        }
        let nowDay = (new Date(this.now)).getDay();
        if (lastDay !== nowDay) {
            if (isNaN(this.haveIndex) && sickCount) this.haveIndex = this.sickCounts.length;
            this.sickCounts.push(sickCount + freezeCount);
            this.deathCounts.push(this.deathCount);
            this.recoveryCounts.push(this.recoveryCount);
        }
        this.drawChart();
    }
}

function normalDistribution(o, y) {
    return Math.sqrt(Math.abs(1 - Math.log(y * (Math.sqrt(2 * Math.PI) + o))) * 2 * o * o);
}
function getPosition(maxL) {
    let r = Math.sign(Math.random() - 0.5) * normalDistribution(0.2, Math.random()) * maxL / 2.5;
    let angle = Math.random() * Math.PI * 2;
    this.x = r * Math.cos(angle);
    this.y = r * Math.sin(angle);
    return [r * Math.cos(angle), r * Math.sin(angle)];
}
function getMoveTarget(maxL, turnover) {
    let r = Math.sign(Math.random() - 0.5) * normalDistribution( 1 / turnover, Math.random()) * maxL / 2;
    let angle = Math.random() * Math.PI * 2;
    this.x = r * Math.cos(angle);
    this.y = r * Math.sin(angle);
    return [r * Math.cos(angle), r * Math.sin(angle)];
}

class Person {
    constructor() {
        this.state = PEOPLE_STATE_HEALTH;
        this.age = 0;
        this.infectedAge = NaN;
        this.x = 0;
        this.y = 0;
        this.maxL = 0;
        this.target = [];
        this.stop = false;
    }
    setPosition(maxL) {
        let pos = getPosition(maxL);
        this.x = pos[0];
        this.y = pos[1];
        this.maxL = maxL;
    }
    wait(simulator) {
        // if (this.state === PEOPLE_STATE_SICK) return normalDistribution(0.01, Math.random()) > 1 - simulator.turnover;
        // else return normalDistribution(0.2, Math.random()) > .5;
        // this.target = getMoveTarget(this.maxL, simulator.turnover);
        return eval(Person.waitVals[simulator.level]);
    }
    move(simulator) {
        let turnover = simulator.turnover * 0.1;
        if (this.wait(simulator)) {
            this.stop = true;
            return;
        } else {
            this.stop = false;
        }
        if (!(this.age % Math.max(Math.floor(20 / FRAME_TO_REAL * 3600), 2))) {
            this.target = getMoveTarget(this.maxL, turnover);
        }
        let target = this.target;
        let offsetX = target[0] - this.x;
        let offsetY = target[1] - this.y;
        const LEN = Math.sqrt(offsetX * offsetX + offsetY * offsetY);
        offsetX /= LEN;
        offsetY /= LEN;
        offsetX *= Math.max(turnover * 2, .7) / 3600 * FRAME_TO_REAL;
        offsetY *= Math.max(turnover * 2, .7) / 3600 * FRAME_TO_REAL;
        offsetX *= turnover * 5;
        offsetY *= turnover * 5;
        if (this.state === PEOPLE_STATE_SICK) {
            offsetX *= 0.2;
            offsetY *= 0.2;
        }
        if (isNaN(offsetX) || isNaN(offsetY)) {
            this.target = getMoveTarget(this.maxL, turnover);
            this.move(simulator);
            return;
        }
        this.x += offsetX;
        this.y += offsetY;
    }
    ICP(simulator, people) {// Infectious contact population
        for (let i = 0; i < people.length; i++) {
            if (people[i].healthy() && !people[i].stop && (people[i].x - this.x) ** 2 + (people[i].y - this.y) ** 2 < 9 && Math.random() < simulator.broadRate) {
                people[i].infect();
            }
        }
    }
    healthy() {
        return !this.state;
    }
    infect() {
        if (this.state) return;
        this.state = PEOPLE_STATE_LATENT;
        this.infectedAge = this.age;
    }
    die() {
        this.state = PEOPLE_STATE_DIE;
        this.infectedAge = NaN;
    }
    death() {
        return this.state === PEOPLE_STATE_DIE;
    }
    recovery() {
        this.state = PEOPLE_STATE_HEALTH;
        this.infectedAge = NaN;
    }
}
Person.waitVals = ["normalDistribution(0.1, Math.random()) > .9", "Math.random() > .7", "Math.random() > .5", "Math.random() > .8"];