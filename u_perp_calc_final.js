/*
 * 永续合约与期权计算器 - V2.0.0
 * 目的：引入合约类型选择 (U本位/币本位/期权)，并细化项目。
 * 更新历史：
 * - V1.0.8 拆分永续合约计算项目为盈亏、强平价、所需保证金。
 * - V2.0.0 引入合约类型选择，为 U本位/币本位/期权 公式计算建立框架。
 */

const VERSION = 'V2.0.0 - 基础框架已建立';

// --- 配置常量 ---
const MAX_LEVERAGE = 125;
const FEE_RATE = 0.0004; // 交易费率 0.04% (用于 U 本位简化计算)
const MAINT_MARGIN_RATE = 0.004; // 维持保证金率 (简化模型)

// 当前模式变量
let currentContractType = 'u_perp'; // 'u_perp', 'coin_perp', 'option'
let currentCalcMode = 'pnl';        // 'pnl', 'liq', 'margin', 'avg_price', 'fee' (动态)

// --- 工具函数 (保持不变) ---
function formatNum(num, fixed = 2) {
    if (isNaN(num) || !isFinite(num)) {
        return 'N/A';
    }
    return num.toFixed(fixed);
}

function createResultBlock(label, result, unit, formulaTex, substituteTex, fixed = 2) {
    // 强制使用 MathJax 渲染
    const block = `
        <div class="result-block">
            <p><strong>${label}: ${formatNum(result, fixed)} ${unit}</strong></p>
            <div class="formula-details">
                <p>原公式：</p>
                $$${formulaTex}$$
                <p>代入值：</p>
                $$${substituteTex}$$
                <p>结果：</p>
                $$= ${formatNum(result, fixed)}$$
            </div>
        </div>
    `;
    return block;
}

function checkRequired(inputs, keys) {
    const missing = keys.filter(key => {
        const value = inputs[key];
        if (key.includes('leverage') && (isNaN(value) || value <= 0)) return true;
        if ((key.includes('Price') || key.includes('Value') || key.includes('quantity')) && (isNaN(value) || value <= 0)) return true;
        if (key.includes('fundFeeRate') && isNaN(value)) return true;
        if (key.includes('initialMargin') && isNaN(value)) return true;
        return false;
    });
    return missing.filter(Boolean); 
}


// --- 核心计算逻辑：U本位合约 (基于您的 U本位公式) ---

function calculateUPNL() {
    const contractValue = parseFloat(document.getElementById('contractValue').value);
    const quantity = parseFloat(document.getElementById('quantity').value);
    const entryPrice = parseFloat(document.getElementById('entryPrice').value);
    const exitPrice = parseFloat(document.getElementById('exitPrice').value);
    const leverage = parseFloat(document.getElementById('leverage').value);
    const fundFeeRate = parseFloat(document.getElementById('fundFeeRate').value) / 10000;
    
    const calcResultDiv = document.getElementById('calcResult');
    calcResultDiv.innerHTML = '';
    
    // 1. 输入检查 (使用简化检查)
    const inputs = { contractValue, quantity, entryPrice, exitPrice, leverage, fundFeeRate };
    const required = checkRequired(inputs, ['contractValue', 'quantity', 'entryPrice', 'exitPrice', 'leverage', 'fundFeeRate']);

    if (required.length > 0) {
        calcResultDiv.innerHTML = `<p class="error-msg">请填写 U 本位盈亏计算所有必需参数。</p>`;
        return;
    }

    // 2. 基础保证金 (Initial Margin) - 您的公式: 面值/开仓价格*张数/杠杆 (应为 U 本位公式: 面值*张数/开仓价/杠杆)
    // 根据您的 U本位开仓保证金（初始）: 面值*开仓价格*张数/杠杆，但 U本位应该是 V*N/(P_entry*L) 或 V*N/P_entry * (1/L)
    // 采用 V1.0.8 的公式 (与 U本位原理更接近): 
    const totalContractValueUSDT = (contractValue * quantity) / entryPrice; // 仓位价值(USDT)
    const initialMargin = totalContractValueUSDT / leverage;

    // 3. 盈亏计算 (PNL) - 您的 U本位公式 (多/空): (1/P_entry - 1/P_exit) * V * N
    const pnlUSDT = (1 / entryPrice - 1 / exitPrice) * contractValue * quantity;
    const pnlAbs = Math.abs(pnlUSDT); 

    // 4. 手续费 - 您的 U本位手续费: 手续费 = 面值*张数*开或平仓均价*手续费率 (币本位公式)，U本位通常是 名义价值*费率
    // 采用 V1.0.8 的公式:
    const entryFee = totalContractValueUSDT * FEE_RATE;
    const exitFee = (contractValue * quantity / exitPrice) * FEE_RATE;
    const totalFee = entryFee + exitFee;

    // 5. 资金费用
    const fundingFee = Math.abs(totalContractValueUSDT * fundFeeRate);

    // 6. 净盈亏
    const netPnlUSDT = pnlAbs - totalFee - fundingFee; 

    // 7. 回报率 (ROE) - 您的公式: 收益/开仓固定保证金*100%
    const roe = (netPnlUSDT / initialMargin) * 100;


    // 8. 结果展示 (仅展示几个关键项作为示例)
    let html = '<h3>U本位盈亏计算结果</h3>';

    // 初始保证金
    const imFormulaTex = `IM = \\frac{V \\times N}{P_{entry} \\times L}`;
    const imSubstituteTex = `\\frac{${contractValue} \\times ${quantity}}{${entryPrice} \\times ${leverage}}`;
    html += createResultBlock('初始保证金', initialMargin, 'USDT', imFormulaTex, imSubstituteTex);

    // 原始盈亏 (P&L - 仅价格变动)
    const pnlFormulaTex = `P_{pnl} = |(\\frac{1}{P_{entry}} - \\frac{1}{P_{exit}}) \\times V \\times N|`;
    const pnlSubstituteTex = `|(\\frac{1}{${entryPrice}} - \\frac{1}{${exitPrice}}) \\times ${contractValue} \\times ${quantity}|`;
    html += createResultBlock('价格变动盈亏', pnlAbs, 'USDT', pnlFormulaTex, pnlSubstituteTex);
    
    // 净盈亏
    const netPnlFormulaTex = `P_{net} = P_{pnl} - Fee_{total} - FundFee`;
    const netPnlSubstituteTex = `${formatNum(pnlAbs, 2)} - ${formatNum(totalFee, 2)} - ${formatNum(fundingFee, 2)}`;
    html += createResultBlock('净盈亏', netPnlUSDT, 'USDT', netPnlFormulaTex, netPnlSubstituteTex);

    calcResultDiv.innerHTML = html;
    if (window.MathJax) {
        window.MathJax.typesetPromise([calcResultDiv]).catch(err => console.error("MathJax typesetting failed: ", err));
    }
}

function calculateULiq() {
    // U本位 预估强平价 (根据您的公式实现) - 计价货币做保证金多仓示例
    const calcResultDiv = document.getElementById('calcResult');
    calcResultDiv.innerHTML = '<h3>U本位强平价计算（待实现）</h3><p>此功能将根据您提供的复杂公式实现。</p>';
}

function calculateUMargin() {
    // U本位 初始/维持保证金 (根据您的公式实现)
    const calcResultDiv = document.getElementById('calcResult');
    calcResultDiv.innerHTML = '<h3>U本位所需保证金计算（待实现）</h3><p>此功能将根据您提供的复杂公式实现。</p>';
}


// --- 核心计算逻辑：币本位合约 (基于您的币本位公式) ---

function calculateCoinPNL() {
    const calcResultDiv = document.getElementById('calcResult');
    calcResultDiv.innerHTML = '<h3>币本位盈亏计算（待实现）</h3><p>币本位计算逻辑（收益/手续费/保证金）将基于您提供的第二组公式。</p>';
}

function calculateCoinLiq() {
    const calcResultDiv = document.getElementById('calcResult');
    calcResultDiv.innerHTML = '<h3>币本位强平价计算（待实现）</h3><p>此功能将根据您提供的复杂公式实现。</p>';
}

function calculateCoinMargin() {
    const calcResultDiv = document.getElementById('calcResult');
    calcResultDiv.innerHTML = '<h3>币本位所需保证金计算（待实现）</h3><p>此功能将根据您提供的复杂公式实现。</p>';
}

// --- 核心计算逻辑：期权 ---

function calculateOptionFee() {
    // 期权费、交易手续费、减仓手续费等
    const calcResultDiv = document.getElementById('calcResult');
    calcResultDiv.innerHTML = '<h3>期权费用计算（待实现）</h3><p>此功能将计算期权费、交易手续费、减仓手续费等。</p>';
}

function calculateOptionLiq() {
    // 维持保证金、保证金率、强平清算费
    const calcResultDiv = document.getElementById('calcResult');
    calcResultDiv.innerHTML = '<h3>期权保证金/强平计算（待实现）</h3><p>此功能将计算维持保证金、保证金率和强平清算费。</p>';
}

function calculateOptionPNL() {
    // 期权收益率、买入/卖出盈亏平衡点、期权市值等
    const calcResultDiv = document.getElementById('calcResult');
    calcResultDiv.innerHTML = '<h3>期权收益与盈亏平衡点计算（待实现）</h3><p>此功能将计算期权收益率、盈亏平衡点等。</p>';
}


// --- 核心计算逻辑：通用功能 ---

function calculateAveragePrice() {
    // U本位和币本位的开仓均价合并计算
    const calcResultDiv = document.getElementById('calcResult');
    calcResultDiv.innerHTML = '<h3>开仓均价合并计算（待实现）</h3><p>此功能将处理 U 本位和币本位的开仓均价合并计算。</p>';
}


// --- 总调度函数 ---

function doCalc() {
    document.getElementById('calcResult').innerHTML = '计算中...';
    
    if (currentContractType === 'u_perp') {
        if (currentCalcMode === 'pnl') calculateUPNL();
        else if (currentCalcMode === 'liq') calculateULiq();
        else if (currentCalcMode === 'margin') calculateUMargin();
        else if (currentCalcMode === 'avg_price') calculateAveragePrice();
    } else if (currentContractType === 'coin_perp') {
        if (currentCalcMode === 'pnl') calculateCoinPNL();
        else if (currentCalcMode === 'liq') calculateCoinLiq();
        else if (currentCalcMode === 'margin') calculateCoinMargin();
        else if (currentCalcMode === 'avg_price') calculateAveragePrice();
    } else if (currentContractType === 'option') {
        if (currentCalcMode === 'fee') calculateOptionFee();
        else if (currentCalcMode === 'liq') calculateOptionLiq();
        else if (currentCalcMode === 'pnl') calculateOptionPNL();
    }
}


// --- 界面控制逻辑：主模式切换 ---

function changeContractType(type) {
    if (currentContractType === type) return;

    currentContractType = type;
    
    // 切换主按钮样式
    ['btn-u-perp', 'btn-coin-perp', 'btn-option'].forEach(id => {
        document.getElementById(id).classList.remove('nav-button-selected');
    });
    document.getElementById(`btn-${type}`).classList.add('nav-button-selected');

    // 根据类型重新渲染子计算项目
    renderCalcModes();
    
    // 默认选择第一个子项目并触发渲染
    if (type === 'u_perp' || type === 'coin_perp') {
        changeCalcMode(type, 'pnl');
    } else if (type === 'option') {
        changeCalcMode(type, 'fee');
    }
}

// --- 界面控制逻辑：子项目切换 ---

function changeCalcMode(type, mode) {
    currentCalcMode = mode;
    
    const calcModeGroup = document.getElementById('calcModeGroup');
    const inputFields = document.getElementById('inputFields');
    const calcResultDiv = document.getElementById('calcResult');
    const inputGroupTitle = document.querySelector('.input-group h3');

    // 切换子按钮样式
    const allModeButtons = calcModeGroup.querySelectorAll('.nav-button');
    allModeButtons.forEach(btn => btn.classList.remove('nav-button-selected'));
    const targetButton = document.getElementById(`btn-mode-${mode}`);
    if (targetButton) {
        targetButton.classList.add('nav-button-selected');
    }

    // 渲染输入字段和标题
    let html = '';
    let title = '';

    if (type === 'u_perp' || type === 'coin_perp') {
        // 永续合约模式
        if (mode === 'pnl') {
            title = `${type === 'u_perp' ? 'U本位' : '币本位'}盈亏计算参数填写`;
            html = getPerpPNLInputHTML(type);
        } else if (mode === 'liq') {
            title = `${type === 'u_perp' ? 'U本位' : '币本位'}强平价格计算参数填写`;
            html = getPerpLiqInputHTML(type);
        } else if (mode === 'margin') {
            title = `${type === 'u_perp' ? 'U本位' : '币本位'}所需保证金计算参数填写`;
            html = getPerpMarginInputHTML(type);
        } else if (mode === 'avg_price') {
            title = '开仓均价合并计算参数填写';
            html = getAvgPriceInputHTML(type);
        }
    } else if (type === 'option') {
        // 期权模式
        if (mode === 'fee') {
            title = '期权费用计算参数填写';
            html = getOptionFeeInputHTML();
        } else if (mode === 'liq') {
            title = '期权保证金/强平计算参数填写';
            html = getOptionLiqInputHTML();
        } else if (mode === 'pnl') {
            title = '期权收益与盈亏平衡点计算参数填写';
            html = getOptionPNLInputHTML();
        }
    }
    
    inputGroupTitle.textContent = title;
    inputFields.innerHTML = html;
    calcResultDiv.innerHTML = '<p>请填写参数并点击计算。</p>';
    
    // 重新绑定事件监听器
    setupEventListeners();
}


/**
 * 渲染子计算项目按钮
 */
function renderCalcModes() {
    const calcModeGroup = document.getElementById('calcModeGroup');
    let modes = [];
    let html = '';

    if (currentContractType === 'u_perp' || currentContractType === 'coin_perp') {
        modes = [
            { id: 'pnl', label: '盈亏计算' },
            { id: 'liq', label: '预估强平价' },
            { id: 'margin', label: '初始/维持保证金' },
            { id: 'avg_price', label: '开仓均价合并' }
        ];
    } else if (currentContractType === 'option') {
        modes = [
            { id: 'fee', label: '费用计算' },
            { id: 'liq', label: '保证金/强平' },
            { id: 'pnl', label: '收益/盈亏平衡点' }
        ];
    }

    modes.forEach(mode => {
        const selectedClass = (currentContractType === 'u_perp' && mode.id === 'pnl') ? ' nav-button-selected' : '';
        html += `<div class="nav-button${selectedClass}" id="btn-mode-${mode.id}" onclick="changeCalcMode('${currentContractType}', '${mode.id}')">${mode.label}</div>`;
    });

    calcModeGroup.innerHTML = html;
}

// --- 输入字段 HTML 生成函数 (占位，将根据您的公式实现) ---

function getPerpPNLInputHTML(type) {
    const unit = type === 'u_perp' ? '(USDT)' : '(交易币)';
    const formulaType = type === 'u_perp' ? 'U本位' : '币本位';
    return `
        <div class="field-item">
            <label for="contractValue">合约面值 (V):</label>
            <input type="number" id="contractValue" value="${type === 'u_perp' ? '0.1' : '10'}" placeholder="">
        </div>
        <div class="field-item">
            <label for="quantity">张数 (N):</label>
            <input type="number" id="quantity" value="1" placeholder="1">
        </div>
        <div class="field-item">
            <label for="entryPrice">开仓价格 ${unit}:</label>
            <input type="number" id="entryPrice" value="3081.33" placeholder="">
        </div>
        <div class="field-item">
            <label for="exitPrice">平仓价格 ${unit}:</label>
            <input type="number" id="exitPrice" value="3080.33" placeholder="">
        </div>
        <div class="field-item">
            <label for="leverage">杠杆倍数 (L):</label>
            <input type="number" id="leverage" value="20" max="${MAX_LEVERAGE}" placeholder="20">
        </div>
        <div class="field-item">
            <label for="fundFeeRate">资金费率 (万分之几):</label>
            <input type="number" id="fundFeeRate" value="10" placeholder="10">
            <p class="note">用于预估资金费用。${formulaType}公式已采用。</p>
        </div>
    `;
}

function getPerpLiqInputHTML(type) {
     const unit = type === 'u_perp' ? '(USDT)' : '(交易币)';
     return `
        <div class="field-item">
            <label for="contractValue_liq">合约面值 (V):</label>
            <input type="number" id="contractValue_liq" value="${type === 'u_perp' ? '0.1' : '10'}" placeholder="">
        </div>
        <div class="field-item">
            <label for="quantity_liq">张数 (N):</label>
            <input type="number" id="quantity_liq" value="1" placeholder="1">
        </div>
        <div class="field-item">
            <label for="entryPrice_liq">开仓价格 ${unit}:</label>
            <input type="number" id="entryPrice_liq" value="3081.33" placeholder="">
        </div>
        <div class="field-item">
            <label for="initialMargin_liq">保证金余额 ${unit}:</label>
            <input type="number" id="initialMargin_liq" value="1.54" placeholder="">
        </div>
        <div class="field-item">
            <label for="maintMarginRate">仓位维持保证金率 (%):</label>
            <input type="number" id="maintMarginRate" value="0.4" placeholder="0.4">
            <p class="note">例如：0.4% 填 0.4。</p>
        </div>
        <div class="field-item">
            <label for="feeRate">手续费率 (万分之几):</label>
            <input type="number" id="feeRate" value="4" placeholder="4">
            <p class="note">例如：0.04% 填 4。</p>
        </div>
        <div class="field-item">
            <label for="side">方向:</label>
            <select id="side">
                <option value="long">多仓</option>
                <option value="short">空仓</option>
            </select>
        </div>
    `;
}

function getPerpMarginInputHTML(type) {
    const unit = type === 'u_perp' ? '(USDT)' : '(交易币)';
    return `
        <div class="field-item">
            <label for="contractValue_margin">合约面值 (V):</label>
            <input type="number" id="contractValue_margin" value="${type === 'u_perp' ? '0.1' : '10'}" placeholder="">
        </div>
        <div class="field-item">
            <label for="quantity_margin">张数 (N):</label>
            <input type="number" id="quantity_margin" value="1" placeholder="1">
        </div>
        <div class="field-item">
            <label for="entryPrice_margin">开仓价格 (P_entry) ${unit}:</label>
            <input type="number" id="entryPrice_margin" value="3081.33" placeholder="">
        </div>
        <div class="field-item">
            <label for="leverage_margin">杠杆倍数 (L):</label>
            <input type="number" id="leverage_margin" value="20" max="${MAX_LEVERAGE}" placeholder="20">
        </div>
        <div class="field-item">
            <label for="markPrice_margin">标记价格 (P_mark) ${unit}:</label>
            <input type="number" id="markPrice_margin" value="3081.33" placeholder="">
        </div>
        <div class="field-item">
            <label for="maintMarginRate_margin">仓位维持保证金率 (%):</label>
            <input type="number" id="maintMarginRate_margin" value="0.4" placeholder="0.4">
            <p class="note">用于计算维持保证金，例如 0.4% 填 0.4</p>
        </div>
    `;
}

function getAvgPriceInputHTML(type) {
    const formulaType = type === 'u_perp' ? 'U本位' : '币本位';
    return `
        <div class="field-item">
            <label for="contractValue_avg">合约面值 (V):</label>
            <input type="number" id="contractValue_avg" value="${type === 'u_perp' ? '0.1' : '10'}" placeholder="">
        </div>
        <div class="field-item">
            <label for="oldQuantity">原持仓数 (N_old):</label>
            <input type="number" id="oldQuantity" value="10" placeholder="10">
        </div>
        <div class="field-item">
            <label for="oldAvgPrice">原持仓均价:</label>
            <input type="number" id="oldAvgPrice" value="3000" placeholder="3000">
        </div>
        <div class="field-item">
            <label for="newQuantity">新开仓数 (N_new):</label>
            <input type="number" id="newQuantity" value="5" placeholder="5">
        </div>
        <div class="field-item">
            <label for="newAvgPrice">新开仓成交均价:</label>
            <input type="number" id="newAvgPrice" value="3100" placeholder="3100">
        </div>
        <p class="note">将使用您提供的 ${formulaType} 开仓均价合并公式进行计算。</p>
    `;
}

function getOptionFeeInputHTML() {
    return `
        <div class="field-item">
            <label for="openPrice_opt">开仓均价/期权费:</label>
            <input type="number" id="openPrice_opt" value="0.05" placeholder="">
        </div>
        <div class="field-item">
            <label for="multiplier">合约乘数:</label>
            <input type="number" id="multiplier" value="0.01" placeholder="例如 BTC 0.01">
        </div>
        <div class="field-item">
            <label for="contractValue_opt">合约面值:</label>
            <input type="number" id="contractValue_opt" value="1" placeholder="例如 BTC 1">
        </div>
        <div class="field-item">
            <label for="quantity_opt">成交张数:</label>
            <input type="number" id="quantity_opt" value="100" placeholder="100">
        </div>
        <div class="field-item">
            <label for="feeRate_opt">手续费率:</label>
            <input type="number" id="feeRate_opt" value="0.0003" placeholder="例如 0.0003">
        </div>
        <div class="field-item">
            <label for="markPrice_opt">标记价格:</label>
            <input type="number" id="markPrice_opt" value="0.05" placeholder="用于减仓费">
        </div>
    `;
}

function getOptionLiqInputHTML() {
    return `
        <p class="note">期权维持保证金计算复杂，需要输入多个参数。</p>
        <div class="field-item">
            <label for="marginCoefficient">保证金系数:</label>
            <input type="number" id="marginCoefficient" value="1" placeholder="梯度系数">
        </div>
        <div class="field-item">
            <label for="markPrice_liq">期权标记价格:</label>
            <input type="number" id="markPrice_liq" value="0.0032666" placeholder="">
        </div>
        <div class="field-item">
            <label for="contractValue_liq_opt">合约面值:</label>
            <input type="number" id="contractValue_liq_opt" value="1" placeholder="例如 BTC 1">
        </div>
        <div class="field-item">
            <label for="multiplier_liq">合约乘数:</label>
            <input type="number" id="multiplier_liq" value="0.01" placeholder="例如 0.01">
        </div>
        <div class="field-item">
            <label for="quantity_liq_opt">持仓张数:</label>
            <input type="number" id="quantity_liq_opt" value="30" placeholder="30">
        </div>
        <div class="field-item">
            <label for="side_liq_opt">仓位方向:</label>
            <select id="side_liq_opt">
                <option value="call_sell">看涨卖方</option>
                <option value="put_sell">看跌卖方</option>
            </select>
        </div>
        <div class="field-item">
            <label for="baseAsset_liq_opt">基础资产:</label>
            <select id="baseAsset_liq_opt">
                <option value="BTC">BTC</option>
                <option value="ETH">ETH</option>
            </select>
        </div>
    `;
}

function getOptionPNLInputHTML() {
    return `
        <p class="note">收益、盈亏平衡点计算</p>
        <div class="field-item">
            <label for="strikePrice">执行价格:</label>
            <input type="number" id="strikePrice" value="50000" placeholder="50000">
        </div>
        <div class="field-item">
            <label for="optionFee_pnl">期权费 (开仓均价):</label>
            <input type="number" id="optionFee_pnl" value="0.05" placeholder="">
        </div>
        <div class="field-item">
            <label for="pnl_result">收益:</label>
            <input type="number" id="pnl_result" value="0.01" placeholder="用于计算收益率">
        </div>
        <div class="field-item">
            <label for="deliveryPrice">交割/结算价格:</label>
            <input type="number" id="deliveryPrice" value="51000" placeholder="用于计算行权收益">
        </div>
        <div class="field-item">
            <label for="multiplier_pnl">合约乘数:</label>
            <input type="number" id="multiplier_pnl" value="0.01" placeholder="0.01">
        </div>
        <div class="field-item">
            <label for="quantity_pnl">持仓数量:</label>
            <input type="number" id="quantity_pnl" value="100" placeholder="100">
        </div>
    `;
}

function setupEventListeners() {
    // 重新绑定杠杆限制
     ['leverage', 'leverage_margin'].forEach(id => {
        const input = document.getElementById(id);
        if (input) {
            input.addEventListener('input', (e) => {
                const value = parseInt(e.target.value);
                if (value > MAX_LEVERAGE) {
                    e.target.value = MAX_LEVERAGE;
                }
                if (value < 1) {
                    e.target.value = 1;
                }
            });
        }
    });
}


function renderApp() {
    document.body.style.backgroundColor = '#1e1e1e';
    document.body.style.color = '#d4d4d4';
    document.body.style.fontFamily = 'Arial, sans-serif';
    document.body.style.margin = '0';
    document.body.style.padding = '20px';

    // 动态加载 MathJax 脚本
    if (!window.MathJax) {
        const script = document.createElement('script');
        script.type = 'text/javascript';
        script.id = 'MathJax-script';
        script.src = 'https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js';
        script.async = true;
        document.head.appendChild(script);

        // 配置 MathJax 
        window.MathJax = {
            tex: {
                inlineMath: [['$', '$'], ['\\(', '\\)']],
                displayMath: [['$$', '$$'], ['\\[', '\\]']]
            },
            options: {
                renderActions: {
                    addMenu: [20, '', ''] 
                }
            }
        };
    }

    const htmlContent = `
        <style>
            /* 样式省略，使用 V1.0.8/V1.0.7 样式 */
            .container {
                max-width: 1200px;
                margin: 0 auto;
                padding: 20px;
                background-color: #252526;
                border-radius: 8px;
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);
            }
            h1 {
                color: #4EC9B0;
                border-bottom: 2px solid #3c3c3c;
                padding-bottom: 10px;
                margin-top: 0;
            }
            .header-info {
                color: #9cdcfe;
                margin-bottom: 20px;
            }
            .input-group, .result-panel {
                background-color: #2d2d30;
                padding: 20px;
                border-radius: 6px;
                margin-bottom: 20px;
            }
            .input-field {
                display: flex;
                flex-wrap: wrap;
                gap: 20px;
                margin-top: 15px;
            }
            .field-item {
                flex: 1 1 200px;
            }
            label {
                display: block;
                margin-bottom: 5px;
                color: #cccccc;
                font-size: 14px;
            }
            input[type="number"], select {
                width: 100%;
                padding: 10px;
                border: 1px solid #3c3c3c;
                border-radius: 4px;
                background-color: #3e3e42;
                color: #d4d4d4;
                box-sizing: border-box;
            }
            button {
                background-color: #007acc;
                color: white;
                padding: 12px 20px;
                border: none;
                border-radius: 4px;
                cursor: pointer;
                font-size: 16px;
                width: 100%;
                margin-top: 20px;
                transition: background-color 0.3s;
            }
            button:hover {
                background-color: #005f99;
            }
            .result-panel h3 {
                color: #569cd6;
                margin-top: 0;
            }
            .error-msg {
                color: #f44747;
                font-weight: bold;
            }
            .note {
                color: #888888;
                font-size: 12px;
                margin-top: 5px;
            }
            .version-info {
                text-align: center;
                color: #666666;
                font-size: 12px;
                margin-top: 30px;
            }
            .result-block {
                margin-bottom: 25px;
                border-left: 3px solid #4EC9B0;
                padding-left: 15px;
            }
            .result-block strong {
                font-size: 16px;
                color: #4EC9B0;
            }
            .formula-details {
                margin-top: 10px;
                background-color: #3e3e42;
                padding: 10px;
                border-radius: 4px;
                font-size: 12px;
            }
            .formula-details p {
                margin: 5px 0 2px 0;
                color: #cccccc;
            }
            .formula-details .MJX-TEX {
                font-size: 14px !important;
                color: #d4d4d4;
                display: block; 
                padding: 2px 0;
            }
            .nav-button-group {
                display: flex;
                gap: 10px; /* 减小间距 */
                margin-bottom: 15px;
            }
            .nav-button {
                flex: 1;
                text-align: center;
                padding: 10px 15px; /* 调整填充 */
                border-radius: 4px;
                cursor: pointer;
                font-size: 14px; /* 减小字体 */
                color: #d4d4d4;
                border: 1px solid #3c3c3c;
                background-color: #2d2d30;
                transition: all 0.2s;
                white-space: nowrap; /* 防止换行 */
            }
            .nav-button:hover {
                 background-color: #3e3e42;
            }
            .nav-button-selected {
                background-color: #007acc;
                border-color: #007acc;
                color: white;
                font-weight: bold;
            }
            .nav-group-label {
                color: #9cdcfe;
                font-weight: bold;
                margin-top: 15px;
                margin-bottom: 5px;
            }

        </style>
        
        <div class="container">
            <h1>全功能合约与期权计算器</h1>
            <p class="header-info">版本 ${VERSION}</p>

            <p class="nav-group-label">选择合约类型:</p>
            <div class="nav-button-group">
                <div class="nav-button nav-button-selected" id="btn-u-perp" onclick="changeContractType('u_perp')">U本位合约 (USDT)</div>
                <div class="nav-button" id="btn-coin-perp" onclick="changeContractType('coin_perp')">币本位合约 (BTC/ETH)</div>
                <div class="nav-button" id="btn-option" onclick="changeContractType('option')">期权</div>
            </div>
            
            <p class="nav-group-label">要计算的项目:</p>
            <div class="nav-button-group" id="calcModeGroup">
                </div>

            <div class="input-group">
                <h3>盈亏计算参数填写</h3>
                <div class="input-field" id="inputFields">
                    ${getPerpPNLInputHTML('u_perp')}
                </div>
                <button onclick="doCalc()">计算</button>
            </div>
            
            <div class="result-panel">
                <h3>计算结果</h3>
                <div id="calcResult">
                    <p>请填写参数并点击计算。</p>
                </div>
            </div>

            <div class="version-info">版本号：${VERSION}</div>
        </div>
    `;

    document.body.innerHTML = htmlContent;

    // 初始渲染
    renderCalcModes();
    setupEventListeners();
    
    // 确保页面加载后 MathJax 渲染一次 (如果需要)
    if (window.MathJax) {
        window.MathJax.typesetPromise();
    }
}

// 应用启动
window.onload = renderApp;
