let simulator;
function main() {
    let canvas = document.querySelector("#main");
    simulator = new Simulator(canvas);
    let controller_tab = document.querySelector("#controller-tab");
    let inputs = document.querySelector("#inputs").children;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    simulator.updateIBAW();
    simulator.simulate();
    window.onresize = () => {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        simulator.updateIBAW();
    };
    document.querySelector("#controller-button").onclick = () => {
        if (controller_tab.style.display === "block") {
            controller_tab.style.display = "none";
            simulator.pause();
            simulator.next();
        } else {
            for (let i = 0; i < inputs.length; i++) {
                let input = inputs[i].querySelector("input");
                input.value = simulator[input.id];
                if (input.id === "hospResTime") {
                    input.value /= 60;
                } else if (input.id === "virusLatentTime") {
                    input.value /= 60 * 24;
                }
            }
            controller_tab.style.display = "block";
            simulator.pause();
        }
    };
    document.querySelector("#continue").onclick = () => {
        for (let i = 0; i < inputs.length; i++) {
            let input = inputs[i].querySelector("input");
            let raw = simulator[input.id];
            if (transNum(input.value) === null) simulator[input.id] = simulator[input.id];
            else {
                simulator[input.id] = transNum(input.value);
                if (input.id === "hospResTime") {
                    simulator[input.id] *= 60;
                } else if (input.id === "virusLatentTime") {
                    simulator[input.id] *= 60 * 24;
                }
            }
            if (input.id === "ALL_BEDS") {
                simulator.beds += simulator.ALL_BEDS - raw;
            }
        }
        simulator.next();
        controller_tab.style.display = "none";
    };
    document.querySelector("#back").onclick = () => {
        simulator.next();
        controller_tab.style.display = "none";
    };
    document.querySelector("#restart").onclick = () => {
        simulator.backInitSettings();
        for (let i = 0; i < inputs.length; i++) {
            let input = inputs[i].querySelector("input");
            let raw = simulator[input.id];
            if (transNum(input.value) === null) simulator[input.id] = simulator[input.id];
            else {
                simulator[input.id] = transNum(input.value);
                if (input.id === "hospResTime") {
                    simulator[input.id] *= 60;
                } else if (input.id === "virusLatentTime") {
                    simulator[input.id] *= 60 * 24;
                }
            }
            if (input.id === "ALL_BEDS") {
                simulator.beds += simulator.ALL_BEDS - raw;
            }
        }
        simulator.simulate();
        controller_tab.style.display = "none";
    };
}
function isNumber(str) {
    if (!str) return false;
    let haveDot = false;
    for (let i = 0; i < str.length; i++) {
        if (str[i] === '.') {
            if (haveDot) return false;
            haveDot = true;
        } else if (str[i] === '%' || str[i] === 's') {
            if (i !== str.length - 1) return false;
        } else if (str.charCodeAt(i) < '0'.charCodeAt(0) || str.charCodeAt(i) > '9'.charCodeAt(0)) return false;
    }
    return true;
}
function transNum(str) {
    if (!isNumber(str)) return null;
    let isPercentage = false;
    if (str[str.length - 1] === '%' || str[str.length - 1] === 's') {
        str = str.substring(0, str.length - 1);
        isPercentage = true;
    }
    return Number(str) * (isPercentage ? 0.01 : 1);
}

window.onload = main;
