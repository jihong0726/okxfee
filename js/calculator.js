/* ======================================================
   U 本位合约工具配置区：所有计算逻辑都写这里
====================================================== */
const uTools = [
  {
    id: "fee",
    name: "手续费",
    subTitle: "输入合约面值、张数、开/平仓均价、手续费率，计算单次交易手续费。",
    tip: "手续费率单位：请输入百分比，例如 0.006% → 输入 0.006",

    fields: [
      { key: "face", label: "合约面值", placeholder: "例如 0.01" },
      { key: "qty", label: "张数", placeholder: "整数，例如 100" },
      { key: "price", label: "开/平仓均价", placeholder: "例如 1000" },
      { key: "feeRate", label: "手续费率（%）", placeholder: "例如 0.006" }
    ],

    calc(data) {
      const rate = data.feeRate / 100;
      const result = data.face * data.qty * data.price * rate;
      return {
        main: `本次手续费 ≈ ${result.toFixed(6)} U`,
        formula: `手续费 = 合约面值 × 张数 × 开/平仓均价 × 手续费率`,
        withVal: `= ${data.face} × ${data.qty} × ${data.price} × ${rate}`
      };
    }
  },

  {
    id: "openMargin",
    name: "开仓保证金（初始）",
    subTitle: "输入合约面值、价格、张数、杠杆倍数，计算开仓所需初始保证金。",
    tip: "结果单位为 U",

    fields: [
      { key: "face", label: "合约面值", placeholder: "例如 0.01" },
      { key: "price", label: "开仓价格", placeholder: "例如 1200" },
      { key: "qty", label: "张数", placeholder: "整数，例如 100" },
      { key: "lever", label: "杠杆倍数", placeholder: "例如 20" }
    ],

    calc(data) {
      const result = data.face * data.price * data.qty / data.lever;
      return {
        main: `开仓需要的初始保证金 ≈ ${result.toFixed(4)} U`,
        formula: `开仓保证金 = 合约面值 × 开仓价格 × 张数 ÷ 杠杆倍数`,
        withVal: `= ${data.face} × ${data.price} × ${data.qty} ÷ ${data.lever}`
      };
    }
  }
];

/* ======================================================
  以下为通用逻辑，不需要你再改
====================================================== */

const toolSelectEl = document.getElementById("toolSelect");
const fieldListEl = document.getElementById("fieldList");
const previewMainEl = document.getElementById("previewMain");
const previewExtraEl = document.getElementById("previewExtra");
const inputCardTitleEl = document.getElementById("inputCardTitle");
const inputCardSubEl = document.getElementById("inputCardSub");
const inputTipEl = document.getElementById("inputTip");
const btnCalc = document.getElementById("btnCalc");
const btnClear = document.getElementById("btnClear");
const inputStatusEl = document.getElementById("inputStatus");
const btnCopy = document.getElementById("btnCopy");
const historyListEl = document.getElementById("historyList");

let currentToolId = uTools[0].id;
const history = [];
const MAX_HISTORY = 10;

/* 渲染下拉菜单 */
function renderToolSelect() {
  toolSelectEl.innerHTML = "";
  uTools.forEach((tool) => {
    const opt = document.createElement("option");
    opt.value = tool.id;
    opt.textContent = tool.name;
    toolSelectEl.appendChild(opt);
  });
}

/* 渲染输入项 */
function renderFields(tool) {
  fieldListEl.innerHTML = "";
  tool.fields.forEach((f) => {
    const row = document.createElement("div");
    row.className = "field-row";
    row.innerHTML = `
      <label>${f.label}</label>
      <input type="text" placeholder="${f.placeholder}" data-key="${f.key}" />
    `;
    fieldListEl.appendChild(row);
  });
}

/* 获取数据 + 检查数值 */
function getCurrentData() {
  const inputs = fieldListEl.querySelectorAll("input");
  const obj = {};
  inputs.forEach((el) => {
    obj[el.dataset.key] = Number(el.value);
  });
  return obj;
}
function checkNumbers(data) {
  for (const k in data) {
    if (!data[k] || isNaN(data[k])) throw new Error("有必填项为空或不是数字，请检查输入。");
  }
}

/* 更新 UI */
function updateToolUI() {
  const tool = uTools.find((t) => t.id === currentToolId);
  toolSelectEl.value = tool.id;
  inputCardTitleEl.textContent = "输入区：" + tool.name;
  inputCardSubEl.textContent = tool.subTitle;
  inputTipEl.textContent = tool.tip;
  previewMainEl.textContent = `这里会显示：${tool.name} 的计算结果。`;
  previewExtraEl.innerHTML = `<strong>公式说明：</strong>点击“开始计算”后，这里会展示对应公式及代入数值。`;
  inputStatusEl.textContent = "";
  renderFields(tool);
}

/* 渲染历史 */
function renderHistory() {
  if (!history.length) {
    historyListEl.textContent = "暂无记录。";
    return;
  }
  historyListEl.innerHTML = "";
  history.forEach((item) => {
    const div = document.createElement("div");
    div.className = "history-item";
    div.textContent = `[${item.time}] ${item.toolName}：${item.main}`;
    historyListEl.appendChild(div);
  });
}

/* 按钮：开始计算 */
btnCalc.onclick = () => {
  try {
    const tool = uTools.find((t) => t.id === currentToolId);
    const data = getCurrentData();
    checkNumbers(data);

    const { main, formula, withVal } = tool.calc(data);
    previewMainEl.textContent = main;
    previewExtraEl.innerHTML = `<strong>公式：</strong>${formula}<br><strong>代入数值：</strong><br>${withVal}`;
    inputStatusEl.textContent = "计算完成。结果仅供参考。";
    inputStatusEl.classList.remove("status-error");

    history.unshift({ toolName: tool.name, main, time: new Date().toLocaleString() });
    if (history.length > MAX_HISTORY) history.pop();
    renderHistory();
  } catch (err) {
    inputStatusEl.textContent = err.message;
    inputStatusEl.classList.add("status-error");
  }
};

/* 按钮：清空 */
btnClear.onclick = () => {
  fieldListEl.querySelectorAll("input").forEach((el) => (el.value = ""));
  inputStatusEl.textContent = "";
};

/* 复制结果 */
btnCopy.onclick = () => {
  const text = previewMainEl.textContent + "\n" + previewExtraEl.innerText;
  navigator.clipboard.writeText(text);
  btnCopy.textContent = "已复制";
  setTimeout(() => (btnCopy.textContent = "复制结果"), 1000);
};

/* 监听下拉选择 */
toolSelectEl.onchange = () => {
  currentToolId = toolSelectEl.value;
  updateToolUI();
};

/* 初始化 */
renderToolSelect();
updateToolUI();
renderHistory();
