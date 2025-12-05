/*
 * 永续合约盈亏与保证金计算器 - V1.0.5
 * 目的：提供准确的U本位永续合约盈亏、回报率、保证金等计算功能。
 * 修复历史：
 * - V1.0.4 修复了 'missing.gfilter is not a function' 错误 (将 gfilter 修正为 filter)。
 * - V1.0.5 增加了公式展示功能，提高计算透明度。
 */

const VERSION = 'V1.0.5';

// --- 配置常量 ---
const MAX_LEVERAGE = 125;
const FEE_RATE = 0.0004; // 交易费率 0.04%

// --- 工具函数 ---

/**
 * 格式化数字为固定小数位数，并处理 NaN 或 Infinity
 * @param {number} num - 要格式化的数字
 * @param {number} fixed - 保留的小数位数
 * @returns {string} 格式化后的字符串
 */
function formatNum(num, fixed = 2) {
    if (isNaN(num) || !isFinite(num)) {
        return 'N/A';
    }
    return num.toFixed(fixed);
}

/**
 * 创建用于展示公式、代入值和结果的 HTML 结构
 * @param {string} label - 结果的标签 (如: "净盈亏")
 * @param {number} result - 计算结果
 * @param {string} unit - 结果的单位 (如: "USDT")
 * @param {string} formulaTex - LaTeX 格式的原始公式
 * @param {string} substituteTex - LaTeX 格式的代入值表达式
 * @returns {string} 包含公式和结果的 HTML 字符串
 */
function createResultBlock(label, result, unit, formulaTex, substituteTex) {
    // 强制使用 MathJax 渲染
    const block = `
        <div class="result-block">
            <p><strong>${label}: ${formatNum(result, 2)} ${unit}</strong></p>
            <div class="formula-details">
                <p>原公式：</p>
                $$${formulaTex}$$
                <p>代入值：</p>
                $$${substituteTex}$$
                <p>结果：</p>
                $$= ${formatNum(result, 2)}$$
            </div>
        </div>
    `;
    return block;
}


// --- 核心计算逻辑 ---

function doCalc() {
    const contractValue = parseFloat(document.getElementById('contractValue').value);
    const quantity = parseFloat(document.getElementById('quantity').value);
    const entryPrice = parseFloat(document.getElementById('entryPrice').value);
    const exitPrice = parseFloat(document.getElementById('exitPrice').value);
    const leverage = parseFloat(document.getElementById('leverage').value);
    const fundFeeRate = parseFloat(document.getElementById('fundFeeRate').value) / 10000; // 万分之几转为小数

    const calcResultDiv = document.getElementById('calcResult');
    calcResultDiv.innerHTML = '';

    // 1. 输入检查
    const inputs = { contractValue, quantity, entryPrice, exitPrice, leverage, fundFeeRate };
    const required = checkRequired(inputs);

    if (required.length > 0) {
        const requiredNames = {
            contractValue: '合约价值', quantity: '张数', entryPrice: '开仓价格',
            exitPrice: '平仓价格', leverage: '杠杆倍数', fundFeeRate: '红利指数'
        };
        const missingNames = required.map(key => requiredNames[key]);
        calcResultDiv.innerHTML = `<p class="error-msg">请填写所有必需参数: ${missingNames.join(', ')}。</p>`;
        return;
    }

    // 2. 基础保证金 (Initial Margin)
    const totalContractValueUSDT = (contractValue * quantity) / entryPrice;
    const initialMargin = totalContractValueUSDT / leverage;

    // 3. 盈亏计算 (P&L)
    const pnlUSDT = (1 / entryPrice - 1 / exitPrice) * contractValue * quantity;

    // 4. 交易手续费 (Trading Fee)
    // 初始手续费 = 合约价值 * 张数 / 开仓价 * 费率
    const entryFee = totalContractValueUSDT * FEE_RATE;
    // 平仓手续费 = 合约价值 * 张数 / 平仓价 * 费率
    const exitFee = (contractValue * quantity / exitPrice) * FEE_RATE;
    const totalFee = entryFee + exitFee;

    // 5. 资金费用 (Funding Fee) - 假设收取一次
    const fundingFee = Math.abs(totalContractValueUSDT * fundFeeRate);

    // 6. 净盈亏 (Net P&L)
    const netPnlUSDT = -pnlUSDT - totalFee - fundingFee; // 币安U本位公式：多头 (1/开-1/平)*张数*合约价值 -> 负值表示盈利

    // 7. 回报率 (ROE)
    const roe = (netPnlUSDT / initialMargin) * 100;

    // 8. 强平价格 (Liquidation Price) - 简化计算，假设 0 维持保证金
    // 强平价格 P_liq = P_entry / (1 - P_entry * (1/L*P_entry - F/P_entry + Fee) / 1)
    // 强平价格 (简化版，忽略手续费和资金费，假设维持保证金为0)
    // P_liq = 1 / (1/P_entry ± M / (V*N))  (M=初始保证金, V*N=总名义价值)
    const maintMarginRate = 0.004; // 假设维持保证金率为 0.4%

    let liqPrice = 0;
    let liqFormulaTex = '';
    let liqSubstituteTex = '';

    // 币安 U 本位永续合约：
    // 多头：P_liq = 1 / (1/P_entry - (1/L - Maint/1) / 1)
    // 维持保证金 = 总名义价值 * 维持保证金率 (MaintRate)
    // MaintMargin = (V * N / P_entry) * MaintRate
    // 多头强平：1/P_liq = 1/P_entry - (1/L - MaintRate)
    // 空头强平：1/P_liq = 1/P_entry + (1/L - MaintRate)

    const maintRateDiff = (1 / leverage) - maintMarginRate;
    
    // 假设是多头（平仓价高于开仓价盈利，P&L为负数，净盈亏为正数）
    if (netPnlUSDT >= 0) { 
        // 多头盈利，强平价在下方
        liqPrice = 1 / (1 / entryPrice - maintRateDiff);
        liqFormulaTex = `\\frac{1}{\\frac{1}{P_{entry}} - (\\frac{1}{L} - MaintRate)}`;
        liqSubstituteTex = `\\frac{1}{\\frac{1}{${entryPrice}} - (\\frac{1}{${leverage}} - ${maintMarginRate})}`;
    } else { 
        // 空头盈利，强平价在上方
        liqPrice = 1 / (1 / entryPrice + maintRateDiff);
        liqFormulaTex = `\\frac{1}{\\frac{1}{P_{entry}} + (\\frac{1}{L} - MaintRate)}`;
        liqSubstituteTex = `\\frac{1}{\\frac{1}{${entryPrice}} + (\\frac{1}{${leverage}} - ${maintMarginRate})}`;
    }


    // 9. 结果展示
    let html = '<h3>计算结果</h3>';

    // 9.1. 初始保证金 (IM)
    const imFormulaTex = `\\frac{V \\times N}{P_{entry} \\times L}`;
    const imSubstituteTex = `\\frac{${contractValue} \\times ${quantity}}{${entryPrice} \\times ${leverage}}`;
    html += createResultBlock('初始保证金', initialMargin, 'USDT', imFormulaTex, imSubstituteTex);

    // 9.2. 原始盈亏 (P&L - 仅价格变动)
    const pnlFormulaTex = `(\\frac{1}{P_{entry}} - \\frac{1}{P_{exit}}) \\times V \\times N`;
    const pnlSubstituteTex = `(\\frac{1}{${entryPrice}} - \\frac{1}{${exitPrice}}) \\times ${contractValue} \\times ${quantity}`;
    html += createResultBlock('价格变动盈亏', -pnlUSDT, 'USDT', pnlFormulaTex, pnlSubstituteTex);


    // 9.3. 总手续费 (Total Fee)
    const totalFeeFormulaTex = `(\\frac{V \\times N}{P_{entry}} + \\frac{V \\times N}{P_{exit}}) \\times FeeRate`;
    const totalFeeSubstituteTex = `(\\frac{${contractValue} \\times ${quantity}}{${entryPrice}} + \\frac{${contractValue} \\times ${quantity}}{${exitPrice}}) \\times ${FEE_RATE}`;
    html += createResultBlock('总交易手续费', totalFee, 'USDT', totalFeeFormulaTex, totalFeeSubstituteTex);

    // 9.4. 资金费用 (Funding Fee)
    const fundFeeFormulaTex = `|\\frac{V \\times N}{P_{entry}}| \\times FundingRate`;
    const fundFeeSubstituteTex = `|\\frac{${contractValue} \\times ${quantity}}{${entryPrice}}| \\times ${fundFeeRate}`;
    html += createResultBlock('资金费用 (预估)', fundingFee, 'USDT', fundFeeFormulaTex, fundFeeSubstituteTex);

    // 9.5. 净盈亏 (Net P&L)
    const netPnlFormulaTex = `原始盈亏 - 总手续费 - 资金费用`;
    const netPnlSubstituteTex = `${formatNum(-pnlUSDT, 2)} - ${formatNum(totalFee, 2)} - ${formatNum(fundingFee, 2)}`;
    html += createResultBlock('净盈亏', netPnlUSDT, 'USDT', netPnlFormulaTex, netPnlSubstituteTex);

    // 9.6. 回报率 (ROE)
    const roeFormulaTex = `\\frac{净盈亏}{初始保证金} \\times 100\\%`;
    const roeSubstituteTex = `\\frac{${formatNum(netPnlUSDT, 2)}}{${formatNum(initialMargin, 2)}} \\times 100\\%`;
    html += createResultBlock('回报率', roe, '%', roeFormulaTex, roeSubstituteTex);

    // 9.7. 强平价格 (Liquidation Price)
    // 注意：强平价公式复杂且交易所算法有差异，此处为简化版（忽略资金费和交易费，仅考虑维持保证金）
    html += createResultBlock('强平价格 (简化)', liqPrice, 'USDT', liqFormulaTex, liqSubstituteTex);
    html += `<p class="note"><strong>注意：</strong>强平价格计算基于 ${formatNum(maintMarginRate * 100, 1)}% 维持保证金率简化模型，实际强平价格可能因资金费用、分级维持保证金率而有所不同。</p>`;

    calcResultDiv.innerHTML = html;

    // 重新渲染 MathJax
    if (window.MathJax) {
        window.MathJax.typesetPromise([calcResultDiv]).catch(err => console.error("MathJax typesetting failed: ", err));
    }
}

/**
 * 检查必需的输入字段是否缺失
 * @param {object} inputs - 包含所有输入值的对象
 * @returns {Array<string>} 缺失的字段名称数组
 */
function checkRequired(inputs) {
    const requiredKeys = ['contractValue', 'quantity', 'entryPrice', 'exitPrice', 'leverage', 'fundFeeRate'];
    const missing = requiredKeys.filter(key => {
        const value = inputs[key];
        // 检查是否为 NaN, null, undefined, 或 0 (除杠杆外)
        if (key === 'leverage' && (isNaN(value) || value <= 0)) return true;
        if (key !== 'leverage' && (isNaN(value) || value === null || value === undefined)) return true;
        return false;
    });
    // 关键修复 V1.0.4: 将 gfilter 修正为 filter
    return missing.filter(Boolean); 
}

// --- 界面渲染逻辑 ---

function renderApp() {
    document.body.style.backgroundColor = '#1e1e1e';
    document.body.style.color = '#d4d4d4';
    document.body.style.fontFamily = 'Arial, sans-serif';
    document.body.style.margin = '0';
    document.body.style.padding = '20px';

    // 动态加载 MathJax 脚本 (用于渲染 LaTeX 公式)
    if (!window.MathJax) {
        const script = document.createElement('script');
        script.type = 'text/javascript';
        script.id = 'MathJax-script';
        script.src = 'https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js';
        script.async = true;
        document.head.appendChild(script);

        // 配置 MathJax (可选，但推荐)
        window.MathJax = {
            tex: {
                inlineMath: [['$', '$'], ['\\(', '\\)']],
                displayMath: [['$$', '$$'], ['\\[', '\\]']]
            },
            options: {
                renderActions: {
                    addMenu: [20, '', ''] // 禁用右键菜单
                }
            }
        };
    }

    const htmlContent = `
        <style>
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
            input[type="number"] {
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
                margin-top: 15px;
                padding-top: 10px;
                border-top: 1px solid #3c3c3c;
            }
            .version-info {
                text-align: center;
                color: #666666;
                font-size: 12px;
                margin-top: 30px;
            }
            
            /* Formula Display Styles for V1.0.5 */
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
            }

        </style>
        
        <div class="container">
            <h1>永续合约盈亏与保证金计算器</h1>
            <p class="header-info">选择币种类型和计算项目，并根据要求填写参数。计算结果会展示详细公式和代入值。</p>

            <div style="display:flex; gap: 20px; margin-bottom: 20px;">
                <button disabled style="background-color:#007acc; flex: 1;">合约类型: U本位合约</button>
                <button disabled style="background-color:#007acc; flex: 1;">要计算的项目: 盈亏计算</button>
            </div>
            
            <div class="input-group">
                <h3>参数填写</h3>
                <div class="input-field">
                    <div class="field-item">
                        <label for="contractValue">合约价值 (基础):</label>
                        <input type="number" id="contractValue" value="0.1" placeholder="BTC/USDT 0.1">
                    </div>
                    <div class="field-item">
                        <label for="quantity">张数 (实际数量):</label>
                        <input type="number" id="quantity" value="1" placeholder="1">
                    </div>
                    <div class="field-item">
                        <label for="entryPrice">开仓价格 (USDT):</label>
                        <input type="number" id="entryPrice" value="3081.33" placeholder="3081.33">
                    </div>
                    <div class="field-item">
                        <label for="exitPrice">平仓价格 (USDT):</label>
                        <input type="number" id="exitPrice" value="" placeholder="3080.33">
                    </div>
                    <div class="field-item">
                        <label for="leverage">杠杆倍数 (L):</label>
                        <input type="number" id="leverage" value="20" max="${MAX_LEVERAGE}" placeholder="20">
                    </div>
                    <div class="field-item">
                        <label for="fundFeeRate">红利指数 (万分之几):</label>
                        <input type="number" id="fundFeeRate" value="10" placeholder="10 (例如 0.0010 = 10)">
                        <p class="note">预估资金费用，以万分之几填写，例如 0.04% 填 4</p>
                    </div>
                </div>
                <button onclick="doCalc()">计算</button>
            </div>
            
            <div class="result-panel">
                <h3>计算结果</h3>
                <div id="calcResult">
                    <p>参数更新后，请点击计算。</p>
                </div>
            </div>

            <div class="version-info">版本号：${VERSION}</div>
        </div>
    `;

    document.body.innerHTML = htmlContent;

    // 绑定事件监听器
    document.getElementById('leverage').addEventListener('input', (e) => {
        const value = parseInt(e.target.value);
        if (value > MAX_LEVERAGE) {
            e.target.value = MAX_LEVERAGE;
        }
        if (value < 1) {
            e.target.value = 1;
        }
    });

    // 自动填充示例平仓价
    const entryPriceInput = document.getElementById('entryPrice');
    const exitPriceInput = document.getElementById('exitPrice');

    if (entryPriceInput.value && !exitPriceInput.value) {
        // 假设开仓价为 3081.33，预设一个平仓价 3080.33 方便测试
        exitPriceInput.value = (parseFloat(entryPriceInput.value) - 1.00).toFixed(2);
    }
}

// 应用启动
renderApp();
