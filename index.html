// ===== 一级：交易区配置 =====
const TRADE_AREAS = {
  "u-perp": {
    name: "U 本位合约",
    desc: "以 USDT 结算的合约：支持开仓均价、合约收益、保证金、资金费、强平价等多种计算。"
  },
  "coin-perp": {
    name: "币本位合约",
    desc: "以合约标的币种结算的永续 / 交割合约，面值除价格形式的计算。当前示例主要展示 U 本位逻辑，其他交易区后续补充。"
  },
  "spot-margin": {
    name: "现货杠杆",
    desc: "支持初始保证金、维持保证金、保证金率等计算。当前为占位说明，可先参考 U 本位合约的计算方式。"
  },
  "spot-avg": {
    name: "现货开仓均价",
    desc: "多次买入 / 卖出后，用于重新计算整体持仓的均价。逻辑与开仓均价类似。"
  },
  "options": {
    name: "期权",
    desc: "包含期权费、手续费、盈亏平衡点、收益率等。此版本暂未完全接入。"
  }
};

// ===== 二级：计算项配置 =====
// 这里只把「开仓均价」的计算公式写完整；其他项先标记为开发中。
const CALC_CONFIGS = {
  "open-price": {
    key: "open-price",
    title: "输入区 · 开仓均价",
    subtitle: "输入合约面值、原持仓张数和均价、新增张数和成交均价，计算新的总体开仓均价。",
    fields: [
      { id: "faceValue", label: "合约面值", placeholder: "例如 0.01", unit: "" },
      { id: "oldSize",   label: "原持仓张数", placeholder: "整数，例如 100", unit: "张" },
      { id: "oldPrice",  label: "原持仓均价", placeholder: "例如 1000", unit: "USDT" },
      { id: "newSize",   label: "新开仓张数", placeholder: "整数，例如 50", unit: "张" },
      { id: "newPrice",  label: "新成交均价", placeholder: "例如 2000", unit: "USDT" }
    ],
    calc: function (values) {
      const fv = Number(values.faceValue || 0);
      const oldSize = Number(values.oldSize || 0);
      const oldPrice = Number(values.oldPrice || 0);
      const newSize = Number(values.newSize || 0);
      const newPrice = Number(values.newPrice || 0);

      const numerator = fv * oldSize * oldPrice + fv * newSize * newPrice;
      const denominator = fv * (oldSize + newSize);

      if (!denominator || !isFinite(denominator)) {
        return {
          resultText: "请确认：合约面值、原持仓张数、新开仓张数等输入是否正确。",
          plain: "开仓均价 = （合约面值 × 原持仓张数 × 原持仓均价 + 合约面值 × 新开仓张数 × 新成交均价）÷（合约面值 ×（原持仓张数 + 新开仓张数））。",
          withNumbers: "代入数字后：分母为 0 或无效，无法计算，请重新检查输入。"
        };
      }

      const avg = numerator / denominator;
      const avgStr = avg.toFixed(4);

      const plainFormula =
        "开仓均价 = （合约面值 × 原持仓张数 × 原持仓均价 + 合约面值 × 新开仓张数 × 新成交均价）" +
        "÷（合约面值 ×（原持仓张数 + 新开仓张数））。";

      const withNumbers =
        `代入数字：\n` +
        `开仓均价 = (${fv} × ${oldSize} × ${oldPrice} + ${fv} × ${newSize} × ${newPrice}) ` +
        `÷ (${fv} × (${oldSize} + ${newSize})) ≈ ${avgStr} USDT。`;

      const resultText =
        `新的开仓均价 ≈ ${avgStr} USDT\n\n` +
        `提示：结果仅供参考，请再结合系统实际持仓信息确认。`;

      return {
        resultText,
        plain: plainFormula,
        withNumbers
      };
    }
  },

  // 其他计算项占位
  "fee":          { dev: true, name: "手续费" },
  "pnl":          { dev: true, name: "合约收益" },
  "roe":          { dev: true, name: "收益率" },
  "init-margin":  { dev: true, name: "开仓保证金（初始）" },
  "mm-margin":    { dev: true, name: "维持保证金" },
  "position-value": { dev: true, name: "仓位价值" },
  "funding":      { dev: true, name: "资金费用" },
  "strong-price": { dev: true, name: "预估强平价" }
};

// ===== DOM 获取 =====
const areaListEl = document.getElementById("areaList");
const areaButtons = areaListEl.querySelectorAll(".area-item");

const currentAreaNameEl = document.getElementById("currentAreaName");
const currentAreaDescEl = document.getElementById("currentAreaDesc");

const calcTabsEl = document.getElementById("calcTabs");
const calcTabButtons = calcTabsEl.querySelectorAll(".calc-tab");

const inputTitleEl = document.getElementById("inputTitle");
const inputSubtitleEl = document.getElementById("inputSubtitle");
const inputFieldsEl = document.getElementById("inputFields");

const btnClear = document.getElementById("btnClear");
const btnCalc = document.getElementById("btnCalc");

const resultBoxEl = document.getElementById("resultBox");
const formulaPlainEl = document.getElementById("formulaPlain");
const formulaWithNumbersEl = document.getElementById("formulaWithNumbers");

let currentAreaKey = "u-perp";
let currentCalcKey = "open-price";

// ===== 辅助函数 =====

// 渲染输入项（第三层）
function renderFields(calcKey) {
  const cfg = CALC_CONFIGS[calcKey];

  if (!cfg || cfg.dev) {
    inputTitleEl.textContent = "输入区 · 功能开发中";
    inputSubtitleEl.textContent =
      "该计算项尚在整理中，当前版本仅开通“开仓均价”作为示例。";
    inputFieldsEl.innerHTML = "";
    resultBoxEl.value = "";
    formulaPlainEl.textContent = "暂未开放该公式，后续版本会补充。";
    formulaWithNumbersEl.textContent = "";
    return;
  }

  inputTitleEl.textContent = cfg.title;
  inputSubtitleEl.textContent = cfg.subtitle;

  const rowsHtml = cfg.fields.map(field => {
    return `
      <div class="form-row">
        <div class="form-label">${field.label}</div>
        <input
          type="text"
          class="form-input"
          id="${field.id}"
          placeholder="${field.placeholder || ''}"
        />
        ${field.unit ? `<div class="form-unit">${field.unit}</div>` : ""}
      </div>
    `;
  }).join("");

  inputFieldsEl.innerHTML = rowsHtml;

  // 重置结果区说明
  resultBoxEl.value = "";
  formulaPlainEl.textContent = "这里会展示：通用的中文公式。";
  formulaWithNumbersEl.textContent = "这里会展示：代入你填写数字后的公式以及近似结果。";
}

// 从输入区读取数据
function collectValues(calcKey) {
  const cfg = CALC_CONFIGS[calcKey];
  if (!cfg || cfg.dev) return {};

  const values = {};
  cfg.fields.forEach(field => {
    const el = document.getElementById(field.id);
    values[field.id] = el ? el.value.trim() : "";
  });
  return values;
}

// 清空输入
function clearInputs(calcKey) {
  const cfg = CALC_CONFIGS[calcKey];
  if (!cfg || cfg.dev) {
    inputFieldsEl.querySelectorAll("input").forEach(i => i.value = "");
    resultBoxEl.value = "";
    formulaPlainEl.textContent = "这里会展示：通用的中文公式。";
    formulaWithNumbersEl.textContent = "这里会展示：代入你填写数字后的公式以及近似结果。";
    return;
  }

  cfg.fields.forEach(field => {
    const el = document.getElementById(field.id);
    if (el) el.value = "";
  });

  resultBoxEl.value = "";
  formulaPlainEl.textContent = "这里会展示：通用的中文公式。";
  formulaWithNumbersEl.textContent = "这里会展示：代入你填写数字后的公式以及近似结果。";
}

// ===== 事件绑定 =====

// 一级：交易区切换
areaButtons.forEach(btn => {
  btn.addEventListener("click", () => {
    const key = btn.getAttribute("data-area");
    if (!key || !TRADE_AREAS[key]) return;

    currentAreaKey = key;

    areaButtons.forEach(b => b.classList.remove("area-item-active"));
    btn.classList.add("area-item-active");

    const info = TRADE_AREAS[key];
    currentAreaNameEl.textContent = info.name;
    currentAreaDescEl.textContent = info.desc;
  });
});

// 二级：计算项目切换
calcTabButtons.forEach(btn => {
  btn.addEventListener("click", () => {
    const key = btn.getAttribute("data-calc");
    if (!key) return;

    currentCalcKey = key;

    calcTabButtons.forEach(b => b.classList.remove("calc-tab-active"));
    btn.classList.add("calc-tab-active");

    renderFields(key);
  });
});

// 按钮：清空
btnClear.addEventListener("click", () => {
  clearInputs(currentCalcKey);
});

// 按钮：开始计算
btnCalc.addEventListener("click", () => {
  const cfg = CALC_CONFIGS[currentCalcKey];

  if (!cfg || cfg.dev) {
    resultBoxEl.value =
      "当前计算项尚未开放。\n" +
      "本版本优先支持“开仓均价”的计算，其它功能整理完成后可以无缝接入同一界面。";
    formulaPlainEl.textContent = "";
    formulaWithNumbersEl.textContent = "";
    return;
  }

  const values = collectValues(currentCalcKey);
  const res = cfg.calc(values);

  resultBoxEl.value = res.resultText || "";
  formulaPlainEl.textContent = res.plain || "";
  formulaWithNumbersEl.textContent = res.withNumbers || "";
});

// ===== 页面初始化 =====
renderFields(currentCalcKey);
