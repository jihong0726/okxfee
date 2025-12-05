/*
 * 永续合约与期权计算器 - V2.0.1
 * 目的：实现 U本位/币本位 所有盈亏、强平价、保证金、开仓均价计算。
 * 更新历史：
 * - V2.0.0 引入合约类型选择框架。
 * - V2.0.1 实现 U本位/币本位 永续合约全部核心计算逻辑。
 */

const VERSION = 'V2.0.1 - 合约核心功能实现';

// --- 配置常量 ---
const MAX_LEVERAGE = 125;
const FEE_RATE = 0.0004; // 交易费率 0.04% (用于简化手续费计算)
const MAINT_MARGIN_RATE_DEFAULT = 0.004; // 维持保证金率 (简化模型)

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
        // 核心价格、数量、杠杆必须大于0
        if (key.includes('Price') || key.includes('Value') || key.includes('quantity') || key.includes('leverage')) {
            return isNaN(value) || value <= 0;
        }
        // 其他参数（如保证金、费率）只需要是数字
        if (isNaN(value)) return true;
        return false;
    });
    return missing.filter(Boolean); 
}

// --- 核心计算逻辑：通用功能 - 开仓均价合并 ---

function calculateAveragePrice() {
    const contractValue = parseFloat(document.getElementById('contractValue_avg').value);
    const oldQuantity = parseFloat(document.getElementById('oldQuantity').value);
    const oldAvgPrice = parseFloat(document.getElementById('oldAvgPrice').value);
    const newQuantity = parseFloat(document.getElementById('newQuantity').value);
    const newAvgPrice = parseFloat(document.getElementById('newAvgPrice').value);

    const calcResultDiv = document.getElementById('calcResult');
    calcResultDiv.innerHTML = '';
    
    const inputs = { contractValue, oldQuantity, oldAvgPrice, newQuantity, newAvgPrice };
    const required = checkRequired(inputs, ['contractValue', 'oldQuantity', 'oldAvgPrice', 'newQuantity', 'newAvgPrice']);

    if (required.length > 0) {
        calcResultDiv.innerHTML = `<p class="error-msg">请填写开仓均价计算所有必需参数。</p>`;
        return;
    }
    
    let html = '<h3>开仓均价合并计算结果</h3>';

    // 1. U本位开仓均价合并公式 (您提供的公式)
    // P_avg_U = ( V*N_old*P_old + V*N_new*P_new ) / ( V * (N_old + N_new) ) 
    const numeratorU = contractValue * oldQuantity * oldAvgPrice + contractValue * newQuantity * newAvgPrice;
    const denominatorU = contractValue * (oldQuantity + newQuantity);
    const avgPriceU = numeratorU / denominatorU;

    const formulaTexU = `P_{avg,U} = \\frac{V \\cdot N_{old} \\cdot P_{old} + V \\cdot N_{new} \\cdot P_{new}}{V \\cdot (N_{old} + N_{new})}`;
    const substituteTexU = `\\frac{${contractValue} \\cdot ${oldQuantity} \\cdot ${oldAvgPrice} + ${contractValue} \\cdot ${newQuantity} \\cdot ${newAvgPrice}}{${contractValue} \\cdot (${oldQuantity} + ${newQuantity})}`;
    html += createResultBlock('U本位开仓均价 (P_avg,U)', avgPriceU, 'USDT', formulaTexU, substituteTexU, 4);

    // 2. 币本位开仓均价合并公式 (您提供的公式)
    // P_avg_Coin = V * (N_old + N_new) / ( V*N_old/P_old + V*N_new/P_new )
    const numeratorCoin = contractValue * (oldQuantity + newQuantity);
    const denominatorCoin = contractValue * oldQuantity / oldAvgPrice + contractValue * newQuantity / newAvgPrice;
    const avgPriceCoin = numeratorCoin / denominatorCoin;

    const formulaTexCoin = `P_{avg,C} = \\frac{V \\cdot (N_{old} + N_{new})}{\\frac{V \\cdot N_{old}}{P_{old}} + \\frac{V \\cdot N_{new}}{P_{new}}}`;
    const substituteTexCoin = `\\frac{${contractValue} \\cdot (${oldQuantity} + ${newQuantity})}{\\frac{${contractValue} \\cdot ${oldQuantity}}{${oldAvgPrice}} + \\frac{${contractValue} \\cdot ${newQuantity}}{${newAvgPrice}}}`;
    html += createResultBlock('币本位开仓均价 (P_avg,C)', avgPriceCoin, 'USDT/USD', formulaTexCoin, substituteTexCoin, 4);

    calcResultDiv.innerHTML = html;
    if (window.MathJax) {
        window.MathJax.typesetPromise([calcResultDiv]).catch(err => console.error("MathJax typesetting failed: ", err));
    }
}


// --- 核心计算逻辑：U本位合约 (USDT) ---

// 1. U本位 盈亏计算 (基于您提供的公式)
function calculateUPNL() {
    const contractValue = parseFloat(document.getElementById('contractValue').value);
    const quantity = parseFloat(document.getElementById('quantity').value);
    const entryPrice = parseFloat(document.getElementById('entryPrice').value);
    const exitPrice = parseFloat(document.getElementById('exitPrice').value);
    const leverage = parseFloat(document.getElementById('leverage').value);
    const fundFeeRate = parseFloat(document.getElementById('fundFeeRate').value) / 10000;
    
    const calcResultDiv = document.getElementById('calcResult');
    calcResultDiv.innerHTML = '';
    
    const inputs = { contractValue, quantity, entryPrice, exitPrice, leverage, fundFeeRate };
    const required = checkRequired(inputs, ['contractValue', 'quantity', 'entryPrice', 'exitPrice', 'leverage', 'fundFeeRate']);

    if (required.length > 0) {
        calcResultDiv.innerHTML = `<p class="error-msg">请填写 U 本位盈亏计算所有必需参数。</p>`;
        return;
    }

    // 交易方向
    const isLong = exitPrice > entryPrice;

    // 1. 原始盈亏 (您的币本位公式，但用于 U本位)
    // 多仓：收益 = V*N*(P_exit - P_entry)
    // 空仓：收益 = V*N*(P_entry - P_exit)
    const pnlGross = contractValue * quantity * (exitPrice - entryPrice); 
    const pnlAbs = Math.abs(pnlGross); 
    
    // 2. 初始保证金 (IM) - 您的 U本位初始保证金公式 (计价货币做保证金做多/空)
    // IM = 负债 / 杠杆倍数 (简化为: 名义价值/杠杆)
    const notionalValue = contractValue * quantity * entryPrice; // 估算名义价值 (USDT)
    const initialMargin = notionalValue / leverage;

    // 3. 手续费 - 简化计算 (名义价值 * 费率)
    const entryFee = notionalValue * FEE_RATE;
    const exitNotionalValue = contractValue * quantity * exitPrice;
    const exitFee = exitNotionalValue * FEE_RATE;
    const totalFee = entryFee + exitFee;

    // 4. 资金费用
    const fundingFee = notionalValue * fundFeeRate;

    // 5. 净盈亏
    const netPnlUSDT = pnlGross - totalFee - fundingFee; 

    // 6. 回报率 (ROE)
    const roe = (netPnlUSDT / initialMargin) * 100;

    // 7. 未实现盈亏 (计价货币做保证金多仓/空仓)
    // 多仓收益 = 仓位资产 * 标记价格 - 负债 
    // 空仓收益 = 仓位资产 - 负债 * 标记价格
    // 这里使用简化盈亏 PnlGross 作为未实现盈亏的基数
    const unrealizedPnl = pnlGross;


    let html = '<h3>U本位盈亏计算结果 (采用您的币本位/简化公式)</h3>';

    // 初始保证金
    const imFormulaTex = `IM = \\frac{V \\cdot N \\cdot P_{entry}}{L}`;
    const imSubstituteTex = `\\frac{${contractValue} \\cdot ${quantity} \\cdot ${entryPrice}}{${leverage}}`;
    html += createResultBlock('初始保证金 (IM)', initialMargin, 'USDT', imFormulaTex, imSubstituteTex);

    // 原始盈亏 (P&L - 仅价格变动)
    const pnlFormulaTex = `P_{pnl} = V \\cdot N \\cdot (P_{exit} - P_{entry})`; // 假设多仓
    const pnlSubstituteTex = `${contractValue} \\cdot ${quantity} \\cdot (${exitPrice} - ${entryPrice})`;
    html += createResultBlock('原始盈亏 (多仓)', pnlGross, 'USDT', pnlFormulaTex, pnlSubstituteTex);
    
    // 净盈亏
    const netPnlFormulaTex = `P_{net} = P_{pnl} - Fee_{total} - FundFee`;
    const netPnlSubstituteTex = `${formatNum(pnlGross, 2)} - ${formatNum(totalFee, 2)} - ${formatNum(fundingFee, 2)}`;
    html += createResultBlock('净盈亏 (P_net)', netPnlUSDT, 'USDT', netPnlFormulaTex, netPnlSubstituteTex);

    // 回报率 (ROE)
    const roeFormulaTex = `ROE = \\frac{P_{net}}{IM} \\times 100\\%`;
    const roeSubstituteTex = `\\frac{${formatNum(netPnlUSDT, 2)}}{${formatNum(initialMargin, 2)}} \\times 100\\%`;
    html += createResultBlock('回报率 (ROE)', roe, '%', roeFormulaTex, roeSubstituteTex);


    calcResultDiv.innerHTML = html;
    if (window.MathJax) {
        window.MathJax.typesetPromise([calcResultDiv]).catch(err => console.error("MathJax typesetting failed: ", err));
    }
}


// 2. U本位 强平价计算 (基于您提供的公式)
function calculateULiq() {
    const contractValue = parseFloat(document.getElementById('contractValue_liq').value);
    const quantity = parseFloat(document.getElementById('quantity_liq').value);
    const entryPrice = parseFloat(document.getElementById('entryPrice_liq').value);
    const margin = parseFloat(document.getElementById('initialMargin_liq').value);
    const maintMarginRate = parseFloat(document.getElementById('maintMarginRate').value) / 100; // 转换为小数
    const feeRate = parseFloat(document.getElementById('feeRate').value) / 10000; // 转换为小数
    const side = document.getElementById('side').value; // 'long' or 'short'

    const calcResultDiv = document.getElementById('calcResult');
    calcResultDiv.innerHTML = '';
    
    const inputs = { contractValue, quantity, entryPrice, margin, maintMarginRate, feeRate };
    const required = checkRequired(inputs, ['contractValue', 'quantity', 'entryPrice', 'margin', 'maintMarginRate', 'feeRate']);

    if (required.length > 0) {
        calcResultDiv.innerHTML = `<p class="error-msg">请填写 U 本位强平价计算所有必需参数。</p>`;
        return;
    }

    // 负债 (您的公式参数)
    const liability = contractValue * quantity * entryPrice; // U本位，负债通常是计价货币（USDT）
    // 仓位资产 (您的公式参数)
    const positionAsset = contractValue * quantity; 

    let liqPrice = NaN;
    let formulaTex = '';
    let substituteTex = '';
    
    // 采用您提供的公式（计价货币做保证金多/空仓，这是 U 本位最常见的情况）
    if (side === 'long') {
        // 多仓预估强平价 = 【负债 * (1 + 仓位维持保证金率) * (1 + 手续费率) - 保证金】 / 仓位资产
        const numerator = liability * (1 + maintMarginRate) * (1 + feeRate) - margin;
        const denominator = positionAsset;
        liqPrice = numerator / denominator;
        
        formulaTex = `P_{liq} = \\frac{L \\cdot (1 + MMR) \\cdot (1 + FeeRate) - Margin}{PosAsset}`;
        substituteTex = `\\frac{${formatNum(liability)} \\cdot (1 + ${maintMarginRate}) \\cdot (1 + ${feeRate}) - ${margin}}{${positionAsset}}`;

    } else if (side === 'short') {
        // 空仓预估强平价 = （仓位资产 + 保证金）/ 【负债 * (1 + 仓位维持保证金率) * (1 + 手续费率)】
        const numerator = positionAsset + margin;
        const denominator = liability * (1 + maintMarginRate) * (1 + feeRate);
        liqPrice = numerator / denominator;

        formulaTex = `P_{liq} = \\frac{PosAsset + Margin}{L \\cdot (1 + MMR) \\cdot (1 + FeeRate)}`;
        substituteTex = `\\frac{${positionAsset} + ${margin}}{${formatNum(liability)} \\cdot (1 + ${maintMarginRate}) \\cdot (1 + ${feeRate})}`;
    }

    let html = '<h3>U本位预估强平价计算结果</h3>';
    html += createResultBlock(`${side === 'long' ? '多仓' : '空仓'}预估强平价`, liqPrice, 'USDT', formulaTex, substituteTex, 4);
    
    // 辅助信息：未实现盈亏
    const unrealizedPNL = positionAsset * liqPrice - liability;
    html += createResultBlock(`(辅助) 强平点位未实现盈亏`, unrealizedPNL, 'USDT', 'P_{unrealized} = PosAsset \\cdot P_{liq} - L', `${positionAsset} \\cdot ${formatNum(liqPrice, 4)} - ${formatNum(liability)}`);


    calcResultDiv.innerHTML = html;
    if (window.MathJax) {
        window.MathJax.typesetPromise([calcResultDiv]).catch(err => console.error("MathJax typesetting failed: ", err));
    }
}


// 3. U本位 保证金计算 (基于您提供的公式)
function calculateUMargin() {
    const contractValue = parseFloat(document.getElementById('contractValue_margin').value);
    const quantity = parseFloat(document.getElementById('quantity_margin').value);
    const entryPrice = parseFloat(document.getElementById('entryPrice_margin').value);
    const leverage = parseFloat(document.getElementById('leverage_margin').value);
    const markPrice = parseFloat(document.getElementById('markPrice_margin').value);
    const maintMarginRate = parseFloat(document.getElementById('maintMarginRate_margin').value) / 100;
    
    const calcResultDiv = document.getElementById('calcResult');
    calcResultDiv.innerHTML = '';

    const inputs = { contractValue, quantity, entryPrice, leverage, markPrice, maintMarginRate };
    const required = checkRequired(inputs, ['contractValue', 'quantity', 'entryPrice', 'leverage', 'markPrice', 'maintMarginRate']);

    if (required.length > 0) {
        calcResultDiv.innerHTML = `<p class="error-msg">请填写 U 本位保证金计算所有必需参数。</p>`;
        return;
    }

    // 负债 (计价货币做保证金多/空仓)
    const liability = contractValue * quantity * entryPrice; // 假设负债为 USDT
    const positionAsset = contractValue * quantity; 

    let html = '<h3>U本位所需保证金计算结果</h3>';

    // 1. 初始保证金 (IM) - 计价货币做保证金多仓/空仓
    // IM = 负债 / 杠杆倍数
    const initialMargin = liability / leverage;
    const imFormulaTex = `IM = \\frac{L}{L_{rate}}`;
    const imSubstituteTex = `\\frac{${formatNum(liability, 2)}}{${leverage}}`;
    html += createResultBlock('初始保证金', initialMargin, 'USDT', imFormulaTex, imSubstituteTex);

    // 2. 维持保证金 (MM) - 计价货币做保证金多仓/空仓
    // MM = 负债 * 仓位维持保证金率
    const maintMargin = liability * maintMarginRate;
    const mmFormulaTex = `MM = L \\cdot MMR`;
    const mmSubstituteTex = `${formatNum(liability, 2)} \\cdot ${maintMarginRate}`;
    html += createResultBlock('维持保证金 (MM)', maintMargin, 'USDT', mmFormulaTex, mmSubstituteTex);

    // 3. 仓位价值
    // 仓位价值 = V*N*P_mark
    const positionValue = contractValue * quantity * markPrice;
    const pvFormulaTex = `PV = V \\cdot N \\cdot P_{mark}`;
    const pvSubstituteTex = `${contractValue} \\cdot ${quantity} \\cdot ${markPrice}`;
    html += createResultBlock('仓位价值', positionValue, 'USDT', pvFormulaTex, pvSubstituteTex);
    
    calcResultDiv.innerHTML = html;
    if (window.MathJax) {
        window.MathJax.typesetPromise([calcResultDiv]).catch(err => console.error("MathJax typesetting failed: ", err));
    }
}


// --- 核心计算逻辑：币本位合约 (BTC/ETH) ---

// 1. 币本位 盈亏计算
function calculateCoinPNL() {
    const contractValue = parseFloat(document.getElementById('contractValue').value);
    const quantity = parseFloat(document.getElementById('quantity').value);
    const entryPrice = parseFloat(document.getElementById('entryPrice').value);
    const exitPrice = parseFloat(document.getElementById('exitPrice').value);
    const leverage = parseFloat(document.getElementById('leverage').value);
    const fundFeeRate = parseFloat(document.getElementById('fundFeeRate').value) / 10000;

    const calcResultDiv = document.getElementById('calcResult');
    calcResultDiv.innerHTML = '';
    
    const inputs = { contractValue, quantity, entryPrice, exitPrice, leverage, fundFeeRate };
    const required = checkRequired(inputs, ['contractValue', 'quantity', 'entryPrice', 'exitPrice', 'leverage', 'fundFeeRate']);

    if (required.length > 0) {
        calcResultDiv.innerHTML = `<p class="error-msg">请填写 币本位盈亏计算所有必需参数。</p>`;
        return;
    }

    // 1. 原始盈亏 (您的币本位/U本位公式)
    // 多仓：收益 = (V/P_entry – V/P_exit) * N
    // 空仓：收益 = (V/P_exit - V/P_entry) * N
    const pnlGross = contractValue * quantity * (1 / entryPrice - 1 / exitPrice);
    const pnlAbs = Math.abs(pnlGross); // 以交易币 (如 BTC) 计价

    // 2. 初始保证金 (IM) - 交易货币做保证金
    // IM = (负债) / 杠杆倍数。币本位负债是交易币
    const notionalValueBTC = contractValue * quantity / entryPrice; // 负债 (交易币，如 BTC)
    const initialMarginBTC = notionalValueBTC / leverage;

    // 3. 手续费 (以交易币计价) - 简化计算
    const entryFeeBTC = notionalValueBTC * FEE_RATE;
    const exitNotionalValueBTC = contractValue * quantity / exitPrice;
    const exitFeeBTC = exitNotionalValueBTC * FEE_RATE;
    const totalFeeBTC = entryFeeBTC + exitFeeBTC;

    // 4. 资金费用
    const fundingFeeBTC = notionalValueBTC * fundFeeRate;

    // 5. 净盈亏
    const netPnlBTC = pnlGross - totalFeeBTC - fundingFeeBTC; 

    // 6. 回报率 (ROE)
    const roe = (netPnlBTC / initialMarginBTC) * 100;

    let html = '<h3>币本位盈亏计算结果 (以交易币计价)</h3>';
    const coinUnit = 'BTC/ETH'; // 示例单位

    // 初始保证金
    const imFormulaTex = `IM = \\frac{V \\cdot N / P_{entry}}{L}`;
    const imSubstituteTex = `\\frac{${contractValue} \\cdot ${quantity} / ${entryPrice}}{${leverage}}`;
    html += createResultBlock('初始保证金 (IM)', initialMarginBTC, coinUnit, imFormulaTex, imSubstituteTex, 6);

    // 原始盈亏 
    const pnlFormulaTex = `P_{pnl} = V \\cdot N \\cdot (\\frac{1}{P_{entry}} - \\frac{1}{P_{exit}})`; // 假设多仓
    const pnlSubstituteTex = `${contractValue} \\cdot ${quantity} \\cdot (\\frac{1}{${entryPrice}} - \\frac{1}{${exitPrice}})`;
    html += createResultBlock('原始盈亏 (多仓)', pnlGross, coinUnit, pnlFormulaTex, pnlSubstituteTex, 6);
    
    // 净盈亏
    const netPnlFormulaTex = `P_{net} = P_{pnl} - Fee_{total} - FundFee`;
    const netPnlSubstituteTex = `${formatNum(pnlGross, 6)} - ${formatNum(totalFeeBTC, 6)} - ${formatNum(fundingFeeBTC, 6)}`;
    html += createResultBlock('净盈亏 (P_net)', netPnlBTC, coinUnit, netPnlFormulaTex, netPnlSubstituteTex, 6);

    // 回报率 (ROE)
    const roeFormulaTex = `ROE = \\frac{P_{net}}{IM} \\times 100\\%`;
    const roeSubstituteTex = `\\frac{${formatNum(netPnlBTC, 6)}}{${formatNum(initialMarginBTC, 6)}} \\times 100\\%`;
    html += createResultBlock('回报率 (ROE)', roe, '%', roeFormulaTex, roeSubstituteTex, 2);


    calcResultDiv.innerHTML = html;
    if (window.MathJax) {
        window.MathJax.typesetPromise([calcResultDiv]).catch(err => console.error("MathJax typesetting failed: ", err));
    }
}

// 2. 币本位 强平价计算 (基于您提供的公式)
function calculateCoinLiq() {
    const contractValue = parseFloat(document.getElementById('contractValue_liq').value);
    const quantity = parseFloat(document.getElementById('quantity_liq').value);
    const entryPrice = parseFloat(document.getElementById('entryPrice_liq').value);
    const margin = parseFloat(document.getElementById('initialMargin_liq').value);
    const maintMarginRate = parseFloat(document.getElementById('maintMarginRate').value) / 100; // 转换为小数
    const feeRate = parseFloat(document.getElementById('feeRate').value) / 10000; // 转换为小数
    const side = document.getElementById('side').value; // 'long' or 'short'

    const calcResultDiv = document.getElementById('calcResult');
    calcResultDiv.innerHTML = '';
    
    const inputs = { contractValue, quantity, entryPrice, margin, maintMarginRate, feeRate };
    const required = checkRequired(inputs, ['contractValue', 'quantity', 'entryPrice', 'margin', 'maintMarginRate', 'feeRate']);

    if (required.length > 0) {
        calcResultDiv.innerHTML = `<p class="error-msg">请填写 币本位强平价计算所有必需参数。</p>`;
        return;
    }

    // 负债 (交易币做保证金多/空仓，负债是计价货币/交易货币)
    const liability = contractValue * quantity; // 币本位负债是计价货币（USD/USDT）
    const positionAsset = contractValue * quantity / entryPrice; // 仓位资产 (交易币，如 BTC)

    let liqPrice = NaN;
    let formulaTex = '';
    let substituteTex = '';
    
    // 采用您提供的公式 (交易币作为保证金做多/空仓)
    if (side === 'long') {
        // 多仓预估强平价 = 【负债 * (1 + 仓位维持保证金率) * (1 + 手续费率)】 / (仓位资产 + 保证金)
        const numerator = liability * (1 + maintMarginRate) * (1 + feeRate);
        const denominator = positionAsset + margin;
        liqPrice = numerator / denominator;

        formulaTex = `P_{liq} = \\frac{L \\cdot (1 + MMR) \\cdot (1 + FeeRate)}{PosAsset + Margin}`;
        substituteTex = `\\frac{${formatNum(liability)} \\cdot (1 + ${maintMarginRate}) \\cdot (1 + ${feeRate})}{${formatNum(positionAsset, 6)} + ${margin}}`;

    } else if (side === 'short') {
        // 空仓预估强平价 = 仓位资产 / 【负债 * (1 + 仓位维持保证金率) * (1 + 手续费率) - 保证金】
        const numerator = positionAsset;
        const denominator = liability * (1 + maintMarginRate) * (1 + feeRate) - margin;
        liqPrice = numerator / denominator;
        
        formulaTex = `P_{liq} = \\frac{PosAsset}{L \\cdot (1 + MMR) \\cdot (1 + FeeRate) - Margin}`;
        substituteTex = `\\frac{${formatNum(positionAsset, 6)}}{${formatNum(liability)} \\cdot (1 + ${maintMarginRate}) \\cdot (1 + ${feeRate}) - ${margin}}`;
    }

    let html = '<h3>币本位预估强平价计算结果</h3>';
    html += createResultBlock(`${side === 'long' ? '多仓' : '空仓'}预估强平价`, liqPrice, 'USDT/USD', formulaTex, substituteTex, 4);
    
    // 辅助信息：仓位价值
    const positionValue = positionAsset * liqPrice;
    html += createResultBlock(`(辅助) 强平点位仓位价值`, positionValue, 'USD/USDT', 'PV = PosAsset \\cdot P_{liq}', `${formatNum(positionAsset, 6)} \\cdot ${formatNum(liqPrice, 4)}`);

    calcResultDiv.innerHTML = html;
    if (window.MathJax) {
        window.MathJax.typesetPromise([calcResultDiv]).catch(err => console.error("MathJax typesetting failed: ", err));
    }
}

// 3. 币本位 保证金计算 (基于您提供的公式)
function calculateCoinMargin() {
    const contractValue = parseFloat(document.getElementById('contractValue_margin').value);
    const quantity = parseFloat(document.getElementById('quantity_margin').value);
    const entryPrice = parseFloat(document.getElementById('entryPrice_margin').value);
    const leverage = parseFloat(document.getElementById('leverage_margin').value);
    const markPrice = parseFloat(document.getElementById('markPrice_margin').value);
    const maintMarginRate = parseFloat(document.getElementById('maintMarginRate_margin').value) / 100;
    
    const calcResultDiv = document.getElementById('calcResult');
    calcResultDiv.innerHTML = '';

    const inputs = { contractValue, quantity, entryPrice, leverage, markPrice, maintMarginRate };
    const required = checkRequired(inputs, ['contractValue', 'quantity', 'entryPrice', 'leverage', 'markPrice', 'maintMarginRate']);

    if (required.length > 0) {
        calcResultDiv.innerHTML = `<p class="error-msg">请填写 币本位保证金计算所有必需参数。</p>`;
        return;
    }

    // 负债 (计价货币)
    const liability = contractValue * quantity; 
    // 仓位资产 (交易币，如 BTC)
    const positionAsset = contractValue * quantity / entryPrice; 
    
    const coinUnit = 'BTC/ETH'; 
    let html = '<h3>币本位所需保证金计算结果 (以交易币计价)</h3>';

    // 1. 初始保证金 (IM) - 交易货币做保证金
    // IM = 负债 / 杠杆倍数 (负债是交易币)
    const liabilityCoin = contractValue * quantity / entryPrice;
    const initialMargin = liabilityCoin / leverage;

    const imFormulaTex = `IM = \\frac{L_{coin}}{L_{rate}} = \\frac{V \\cdot N / P_{entry}}{L_{rate}}`;
    const imSubstituteTex = `\\frac{${contractValue} \\cdot ${quantity} / ${entryPrice}}{${leverage}}`;
    html += createResultBlock('初始保证金', initialMargin, coinUnit, imFormulaTex, imSubstituteTex, 6);

    // 2. 维持保证金 (MM) - 交易货币做保证金多/空仓
    // MM = 负债 * 仓位维持保证金率 (负债是交易币)
    const maintMargin = liabilityCoin * maintMarginRate;
    const mmFormulaTex = `MM = L_{coin} \\cdot MMR`;
    const mmSubstituteTex = `${formatNum(liabilityCoin, 6)} \\cdot ${maintMarginRate}`;
    html += createResultBlock('维持保证金 (MM)', maintMargin, coinUnit, mmFormulaTex, mmSubstituteTex, 6);

    // 3. 仓位价值
    // 仓位价值 = V*N/P_mark
    const positionValue = contractValue * quantity / markPrice;
    const pvFormulaTex = `PV = \\frac{V \\cdot N}{P_{mark}}`;
    const pvSubstituteTex = `\\frac{${contractValue} \\cdot ${quantity}}{${markPrice}}`;
    html += createResultBlock('仓位价值', positionValue, coinUnit, pvFormulaTex, pvSubstituteTex, 6);
    
    calcResultDiv.innerHTML = html;
    if (window.MathJax) {
        window.MathJax.typesetPromise([calcResultDiv]).catch(err => console.error("MathJax typesetting failed: ", err));
    }
}


// --- 核心计算逻辑：期权 (占位，待 V2.0.2 实现) ---

function calculateOptionFee() {
    // 期权费、交易手续费、减仓手续费等
    const calcResultDiv = document.getElementById('calcResult');
    calcResultDiv.innerHTML = '<h3>期权费用计算（待 V2.0.2 实现）</h3><p>此功能将计算期权费、交易手续费、减仓手续费等。</p>';
}

function calculateOptionLiq() {
    // 维持保证金、保证金率、强平清算费
    const calcResultDiv = document.getElementById('calcResult');
    calcResultDiv.innerHTML = '<h3>期权保证金/强平计算（待 V2.0.2 实现）</h3><p>此功能将计算维持保证金、保证金率和强平清算费。</p>';
}

function calculateOptionPNL() {
    // 期权收益率、买入/卖出盈亏平衡点、期权市值等
    const calcResultDiv = document.getElementById('calcResult');
    calcResultDiv.innerHTML = '<h3>期权收益与盈亏平衡点计算（待 V2.0.2 实现）</h3><p>此功能将计算期权收益率、盈亏平衡点等。</p>';
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


// --- 界面控制逻辑 (保持不变) ---
// changeContractType, changeCalcMode, renderCalcModes, setupEventListeners, renderApp ... (省略，与 V2.0.0 相同)


function changeContractType(type) {
    if (currentContractType === type) return;

    currentContractType = type;
    
    ['btn-u-perp', 'btn-coin-perp', 'btn-option'].forEach(id => {
        document.getElementById(id).classList.remove('nav-button-selected');
    });
    document.getElementById(`btn-${type}`).classList.add('nav-button-selected');

    renderCalcModes();
    
    if (type === 'u_perp' || type === 'coin_perp') {
        changeCalcMode(type, 'pnl');
    } else if (type === 'option') {
        changeCalcMode(type, 'fee');
    }
}

function changeCalcMode(type, mode) {
    currentCalcMode = mode;
    
    const calcModeGroup = document.getElementById('calcModeGroup');
    const inputFields = document.getElementById('inputFields');
    const calcResultDiv = document.getElementById('calcResult');
    const inputGroupTitle = document.querySelector('.input-group h3');

    const allModeButtons = calcModeGroup.querySelectorAll('.nav-button');
    allModeButtons.forEach(btn => btn.classList.remove('nav-button-selected'));
    const targetButton = document.getElementById(`btn-mode-${mode}`);
    if (targetButton) {
        targetButton.classList.add('nav-button-selected');
    }

    let html = '';
    let title = '';

    if (type === 'u_perp' || type === 'coin_perp') {
        if (mode === 'pnl') {
            title = `${type === 'u_perp' ? 'U本位' : '币本位'}盈亏计算参数填写`;
            html = getPerpPNLInputHTML(type);
        } else if (mode === 'liq') {
            title = `${type === 'u_perp' ? 'U本位' : '币本位'}预估强平价参数填写`;
            html = getPerpLiqInputHTML(type);
        } else if (mode === 'margin') {
            title = `${type === 'u_perp' ? 'U本位' : '币本位'}所需保证金参数填写`;
            html = getPerpMarginInputHTML(type);
        } else if (mode === 'avg_price') {
            title = '开仓均价合并计算参数填写';
            html = getAvgPriceInputHTML(type);
        }
    } else if (type === 'option') {
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
    
    setupEventListeners();
}

function renderCalcModes() {
    const calcModeGroup = document.getElementById('calcModeGroup');
    let modes = [];
    let html = '';

    if (currentContractType === 'u_perp' || currentContractType === 'coin_perp') {
        modes = [
            { id: 'pnl', label: '盈亏/收益' },
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
        const selectedClass = (currentCalcMode === mode.id) ? ' nav-button-selected' : '';
        html += `<div class="nav-button${selectedClass}" id="btn-mode-${mode.id}" onclick="changeCalcMode('${currentContractType}', '${mode.id}')">${mode.label}</div>`;
    });

    calcModeGroup.innerHTML = html;
}

// --- 输入字段 HTML 生成函数 (U本位/币本位/期权) ---
// 保持与 V2.0.0 相同的输入字段，确保功能实现后可以直接使用

function getPerpPNLInputHTML(type) {
    const unit = type === 'u_perp' ? '(USDT)' : '(USD/交易币)';
    const formulaType = type === 'u_perp' ? 'U本位' : '币本位';
    return `
        <div class="field-item">
            <label for="contractValue">合约面值 (V):</label>
            <input type="number" id="contractValue" value="${type === 'u_perp' ? '1' : '10'}" placeholder="">
            <p class="note">例如：U本位1，币本位100/10</p>
        </div>
        <div class="field-item">
            <label for="quantity">张数 (N):</label>
            <input type="number" id="quantity" value="10" placeholder="10">
        </div>
        <div class="field-item">
            <label for="entryPrice">开仓价格 ${unit}:</label>
            <input type="number" id="entryPrice" value="50000" placeholder="">
        </div>
        <div class="field-item">
            <label for="exitPrice">平仓价格 ${unit}:</label>
            <input type="number" id="exitPrice" value="50500" placeholder="">
        </div>
        <div class="field-item">
            <label for="leverage">杠杆倍数 (L):</label>
            <input type="number" id="leverage" value="20" max="${MAX_LEVERAGE}" placeholder="20">
        </div>
        <div class="field-item">
            <label for="fundFeeRate">资金费率 (万分之几):</label>
            <input type="number" id="fundFeeRate" value="1" placeholder="例如 1 (0.01%)">
            <p class="note">用于预估资金费用。费率以万分之几填写。</p>
        </div>
    `;
}

function getPerpLiqInputHTML(type) {
     const unit = type === 'u_perp' ? '(USDT)' : '(USD/交易币)';
     return `
        <div class="field-item">
            <label for="contractValue_liq">合约面值 (V):</label>
            <input type="number" id="contractValue_liq" value="${type === 'u_perp' ? '1' : '10'}" placeholder="">
            <p class="note">例如：U本位1，币本位100/10</p>
        </div>
        <div class="field-item">
            <label for="quantity_liq">张数 (N):</label>
            <input type="number" id="quantity_liq" value="10" placeholder="10">
        </div>
        <div class="field-item">
            <label for="entryPrice_liq">开仓价格 (P_entry) ${unit}:</label>
            <input type="number" id="entryPrice_liq" value="50000" placeholder="">
        </div>
        <div class="field-item">
            <label for="initialMargin_liq">保证金余额 (Margin) ${type === 'u_perp' ? '(USDT)' : '(交易币)'}:</label>
            <input type="number" id="initialMargin_liq" value="250" placeholder="">
            <p class="note">（保证金金额）</p>
        </div>
        <div class="field-item">
            <label for="maintMarginRate">仓位维持保证金率 (MMR %):</label>
            <input type="number" id="maintMarginRate" value="0.4" placeholder="0.4">
            <p class="note">例如：0.4% 填 0.4。</p>
        </div>
        <div class="field-item">
            <label for="feeRate">减仓手续费率 (FeeRate 万分之几):</label>
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
        <p class="note">计算将使用您提供的针对不同保证金模式的强平价公式。</p>
    `;
}

function getPerpMarginInputHTML(type) {
    const unit = type === 'u_perp' ? '(USDT)' : '(USD/交易币)';
    return `
        <div class="field-item">
            <label for="contractValue_margin">合约面值 (V):</label>
            <input type="number" id="contractValue_margin" value="${type === 'u_perp' ? '1' : '10'}" placeholder="">
            <p class="note">例如：U本位1，币本位100/10</p>
        </div>
        <div class="field-item">
            <label for="quantity_margin">张数 (N):</label>
            <input type="number" id="quantity_margin" value="10" placeholder="10">
        </div>
        <div class="field-item">
            <label for="entryPrice_margin">开仓价格 (P_entry) ${unit}:</label>
            <input type="number" id="entryPrice_margin" value="50000" placeholder="">
        </div>
        <div class="field-item">
            <label for="leverage_margin">杠杆倍数 (L):</label>
            <input type="number" id="leverage_margin" value="20" max="${MAX_LEVERAGE}" placeholder="20">
        </div>
        <div class="field-item">
            <label for="markPrice_margin">标记价格 (P_mark) ${unit}:</label>
            <input type="number" id="markPrice_margin" value="50100" placeholder="">
        </div>
        <div class="field-item">
            <label for="maintMarginRate_margin">仓位维持保证金率 (MMR %):</label>
            <input type="number" id="maintMarginRate_margin" value="0.4" placeholder="0.4">
            <p class="note">例如：0.4% 填 0.4</p>
        </div>
    `;
}

function getAvgPriceInputHTML(type) {
    const formulaType = type === 'u_perp' ? 'U本位' : '币本位';
    return `
        <div class="field-item">
            <label for="contractValue_avg">合约面值 (V):</label>
            <input type="number" id="contractValue_avg" value="${type === 'u_perp' ? '1' : '10'}" placeholder="1">
        </div>
        <div class="field-item">
            <label for="oldQuantity">原持仓数 (N_old):</label>
            <input type="number" id="oldQuantity" value="10" placeholder="10">
        </div>
        <div class="field-item">
            <label for="oldAvgPrice">原持仓均价:</label>
            <input type="number" id="oldAvgPrice" value="50000" placeholder="50000">
        </div>
        <div class="field-item">
            <label for="newQuantity">新开仓数 (N_new):</label>
            <input type="number" id="newQuantity" value="5" placeholder="5">
        </div>
        <div class="field-item">
            <label for="newAvgPrice">新开仓成交均价:</label>
            <input type="number" id="newAvgPrice" value="50500" placeholder="50500">
        </div>
        <p class="note">计算将使用您提供的 ${formulaType} 开仓均价合并公式。</p>
    `;
}

function getOptionFeeInputHTML() {
    return `
        <div class="field-item">
            <label for="openPrice_opt">开仓均价 (期权费):</label>
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

    if (!window.MathJax) {
        const script = document.createElement('script');
        script.type = 'text/javascript';
        script.id = 'MathJax-script';
        script.src = 'https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js';
        script.async = true;
        document.head.appendChild(script);

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
             /* 样式保持不变 */
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
                gap: 10px; 
                margin-bottom: 15px;
            }
            .nav-button {
                flex: 1;
                text-align: center;
                padding: 10px 15px; 
                border-radius: 4px;
                cursor: pointer;
                font-size: 14px; 
                color: #d4d4d4;
                border: 1px solid #3c3c3c;
                background-color: #2d2d30;
                transition: all 0.2s;
                white-space: nowrap; 
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
    changeContractType('u_perp'); // 初始选择 U本位盈亏
}

// 应用启动
window.onload = renderApp;
