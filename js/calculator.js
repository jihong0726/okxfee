/* ===============================
   U 本位合约：功能配置
   =============================== */

const uTools = [
  {
    id: "openAvg",
    name: "开仓均价",
    subTitle: "输入合约面值、原持仓张数和均价、新开仓张数和成交均价，计算新的整体开仓均价。",
    tip: "示例：合约面值 0.01，原持仓 100 张、均价 1000，新开仓 50 张、成交均价 2000。",
    fields: [
      { key: "face", label: "合约面值", placeholder: "例如 0.01" },
      { key: "oldQty", label: "原持仓张数（张）", placeholder: "整数，例如 100" },
      { key: "oldPrice", label: "原持仓均价（U）", placeholder: "例如 1000" },
      { key: "newQty", label: "新开仓张数（张）", placeholder: "整数，例如 50" },
      { key: "newPrice", label: "新成交均价（U）", placeholder: "例如 2000" }
    ],
    calc(d) {
      const { face, oldQty, oldPrice, newQty, newPrice } = d;
      if (oldQty + newQty === 0) {
        throw new Error("原持仓张数 + 新开仓张数 不能为 0。");
      }
      const num = face * oldQty * oldPrice + face * newQty * newPrice;
      const den = face * (oldQty + newQty);
      const avg = num / den;
      return {
        main: `新的开仓均价 ≈ ${avg.toFixed(4)} U`,
        formula:
          "开仓均价 = (合约面值 × 原持仓张数 × 原持仓均价 + 合约面值 × 新开仓张数 × 新成交均价) ÷ [合约面值 × (原持仓张数 + 新开仓张数)]",
        withVal:
          `= (${face} × ${oldQty} × ${oldPrice} + ${face} × ${newQty} × ${newPrice}) ÷ ` +
          `[${face} × (${oldQty} + ${newQty})]`
      };
    }
  },

  {
    id: "fee",
    name: "手续费",
    subTitle: "输入合约面值、张数、开/平仓均价、手续费率，计算单次交易手续费。",
    tip: "手续费率按“百分比”输入，例如 0.006% → 输入 0.006。",
    fields: [
      { key: "face",    label: "合约面值",           placeholder: "例如 0.01" },
      { key: "qty",     label: "张数（张）",          placeholder: "整数，例如 100" },
      { key: "price",   label: "开/平仓均价（U）",    placeholder: "例如 1000" },
      { key: "feePct",  label: "手续费率（%）",       placeholder: "例如 0.006" }
    ],
    calc(d) {
      const rate = d.feePct / 100;   // 百分比转小数
      const fee  = d.face * d.qty * d.price * rate;
      return {
        main: `本次手续费 ≈ ${fee.toFixed(6)} U`,
        formula: "手续费 = 合约面值 × 张数 × 开/平仓均价 × 手续费率",
        withVal: `= ${d.face} × ${d.qty} × ${d.price} × ${rate}（手续费率 = ${d.feePct}%）`
      };
    }
  },

  {
    id: "pnl",
    name: "合约收益",
    subTitle: "选择多仓或空仓，输入合约面值、张数、开仓均价和平仓均价，计算本次平仓收益。",
    tip: "多仓：收益 = 面值 × 张数 × (平 - 开)；空仓：收益 = 面值 × 张数 × (开 - 平)。",
    fields: [
      {
        key: "side",
        label: "持仓方向",
        type: "select",
        options: [
          { value: "long",  label: "多仓" },
          { value: "short", label: "空仓" }
        ]
      },
      { key: "face",       label: "合约面值",         placeholder: "例如 0.01" },
      { key: "qty",        label: "张数（张）",        placeholder: "整数，例如 100" },
      { key: "openPrice",  label: "开仓均价（U）",     placeholder: "例如 1000" },
      { key: "closePrice", label: "平仓均价（U）",     placeholder: "例如 1200" }
    ],
    calc(d) {
      const { face, qty, openPrice, closePrice, side } = d;
      let pnl, formula, withVal;

      if (side === "long") {
        pnl = face * qty * (closePrice - openPrice);
        formula = "多仓：合约收益 = 合约面值 × 张数 × (平仓均价 - 开仓均价)";
        withVal = `= ${face} × ${qty} × (${closePrice} - ${openPrice})`;
      } else {
        pnl = face * qty * (openPrice - closePrice);
        formula = "空仓：合约收益 = 合约面值 × 张数 × (开仓均价 - 平仓均价)";
        withVal = `= ${face} × ${qty} × (${openPrice} - ${closePrice})`;
      }

      return {
        main: `本次平仓收益 ≈ ${pnl.toFixed(4)} U（可能为负）`,
        formula,
        withVal
      };
    }
  },

  {
    id: "roi",
    name: "收益率",
    subTitle: "输入收益金额和开仓固定保证金，计算收益率（%）。",
    tip: "收益率 = 收益 ÷ 开仓固定保证金 × 100%。",
    fields: [
      { key: "pnl",    label: "收益金额（U）",           placeholder: "可以为负，例如 -50" },
      { key: "margin", label: "开仓固定保证金（U）",     placeholder: "例如 200" }
    ],
    calc(d) {
      if (d.margin === 0) throw new Error("开仓固定保证金不能为 0。");
      const roi = (d.pnl / d.margin) * 100;
      return {
        main: `收益率 ≈ ${roi.toFixed(2)} %`,
        formula: "收益率 = 收益 ÷ 开仓固定保证金 × 100%",
        withVal: `= ${d.pnl} ÷ ${d.margin} × 100%`
      };
    }
  },

  {
    id: "openMargin",
    name: "开仓保证金（初始）",
    subTitle: "输入合约面值、开仓价格、张数和杠杆倍数，计算开仓所需初始保证金。",
    tip: "结果单位为 U。",
    fields: [
      { key: "face",   label: "合约面值",           placeholder: "例如 0.01" },
      { key: "price",  label: "开仓价格（U）",       placeholder: "例如 3036.39" },
      { key: "qty",    label: "张数（张）",          placeholder: "整数，例如 1" },
      { key: "lever",  label: "杠杆倍数",           placeholder: "例如 20" }
    ],
    calc(d) {
      if (d.lever === 0) throw new Error("杠杆倍数不能为 0。");
      const margin = d.face * d.price * d.qty / d.lever;
      return {
        main: `开仓需要的初始保证金 ≈ ${margin.toFixed(4)} U`,
        formula: "开仓保证金 = 合约面值 × 开仓价格 × 张数 ÷ 杠杆倍数",
        withVal: `= ${d.face} × ${d.price} × ${d.qty} ÷ ${d.lever}`
      };
    }
  },

  {
    id: "maintMargin",
    name: "维持保证金",
    subTitle: "输入合约面值、仓位张数、维持保证金率和标记价格，计算当前需要的维持保证金。",
    tip: "维持保证金率按百分比输入，例如 0.5% → 输入 0.5。",
    fields: [
      { key: "face",      label: "合约面值",             placeholder: "例如 0.01" },
      { key: "qty",       label: "仓位张数（可正可负）",   placeholder: "例如 100 或 -100" },
      { key: "maintPct",  label: "维持保证金率（%）",     placeholder: "例如 0.5" },
      { key: "markPrice", label: "标记价格（U）",         placeholder: "例如 1000" }
    ],
    calc(d) {
      const absQty = Math.abs(d.qty);
      const rate   = d.maintPct / 100;
      const mm     = d.face * absQty * rate * d.markPrice;
      return {
        main: `当前维持保证金 ≈ ${mm.toFixed(4)} U`,
        formula: "维持保证金 = 合约面值 × |张数| × 维持保证金率 × 标记价格",
        withVal:
          `= ${d.face} × ${absQty} × ${rate} × ${d.markPrice}` +
          `（维持保证金率 = ${d.maintPct}%）`
      };
    }
  },

  {
    id: "marginRatio",
    name: "当前保证金率",
    subTitle: "输入保证金余额、未实现收益、合约面值、张数、标记价格、维持保证金率和手续费率，估算当前保证金率。",
    tip: "维持保证金率、手续费率均按百分比输入，例如 0.5% → 输入 0.5。",
    fields: [
      { key: "balance",  label: "保证金余额（U）",           placeholder: "例如 100" },
      { key: "pnl",      label: "未实现收益（U）",           placeholder: "亏损用负数，例如 -10" },
      { key: "face",     label: "合约面值",                 placeholder: "例如 0.01" },
      { key: "qty",      label: "仓位张数（可正可负）",       placeholder: "例如 100 或 -100" },
      { key: "markPrice",label: "标记价格（U）",             placeholder: "例如 1000" },
      { key: "maintPct", label: "维持保证金率（%）",         placeholder: "例如 0.5" },
      { key: "feePct",   label: "手续费率（%）",             placeholder: "例如 0.006" }
    ],
    calc(d) {
      const absQty  = Math.abs(d.qty);
      const mRate   = d.maintPct / 100;
      const fRate   = d.feePct   / 100;
      const denom   = d.face * absQty * d.markPrice * (mRate + fRate);
      if (denom === 0) {
        throw new Error("分母为 0，请检查面值 / 张数 / 标记价格 / 维持保证金率 / 手续费率。");
      }
      const ratio = (d.balance + d.pnl) / denom;
      return {
        main: `当前保证金率 ≈ ${(ratio * 100).toFixed(2)} %`,
        formula:
          "保证金率 = (保证金余额 + 收益) ÷ [合约面值 × |张数| × 标记价格 × (维持保证金率 + 手续费率)]",
        withVal:
          `= (${d.balance} + ${d.pnl}) ÷ [` +
          `${d.face} × ${absQty} × ${d.markPrice} × (${mRate} + ${fRate})]` +
          `（维持保证金率 = ${d.maintPct}%，手续费率 = ${d.feePct}%）`
      };
    }
  },

  {
    id: "crossRatio",
    name: "跨币种全仓维持保证金率",
    subTitle: "输入有效保证金、维持保证金和减仓手续费，计算跨币种全仓模式下的维持保证金率。",
    tip: "维持保证金率 = 有效保证金 ÷ (维持保证金 + 减仓手续费)。",
    fields: [
      { key: "effectiveMargin", label: "有效保证金（U）",       placeholder: "例如 100" },
      { key: "maintMargin",     label: "维持保证金（U）",       placeholder: "例如 80" },
      { key: "closeFee",        label: "减仓手续费（U）",       placeholder: "例如 2" }
    ],
    calc(d) {
      const denom = d.maintMargin + d.closeFee;
      if (denom === 0) throw new Error("维持保证金 + 减仓手续费 不能为 0。");
      const ratio = d.effectiveMargin / denom;
      return {
        main: `跨币种全仓维持保证金率 ≈ ${(ratio * 100).toFixed(2)} %`,
        formula: "维持保证金率 = 有效保证金 ÷ (维持保证金 + 减仓手续费)",
        withVal: `= ${d.effectiveMargin} ÷ (${d.maintMargin} + ${d.closeFee})`
      };
    }
  },

  {
    id: "positionValue",
    name: "仓位价值",
    subTitle: "输入合约面值、张数和标记价格，计算当前仓位价值。",
    tip: "仓位价值 = 合约面值 × 张数 × 标记价格。",
    fields: [
      { key: "face",      label: "合约面值",       placeholder: "例如 0.01" },
      { key: "qty",       label: "张数（张）",      placeholder: "整数，例如 100" },
      { key: "markPrice", label: "标记价格（U）",  placeholder: "例如 1000" }
    ],
    calc(d) {
      const value = d.face * d.qty * d.markPrice;
      return {
        main: `当前仓位价值 ≈ ${value.toFixed(4)} U`,
        formula: "仓位价值 = 合约面值 × 张数 × 标记价格",
        withVal: `= ${d.face} × ${d.qty} × ${d.markPrice}`
      };
    }
  },

  {
    id: "funding",
    name: "资金费用",
    subTitle: "输入仓位价值和资金费率，计算当前资金费用。",
    tip: "资金费率按百分比输入，例如 0.01% → 输入 0.01。",
    fields: [
      { key: "positionValue", label: "仓位价值（U）",     placeholder: "例如 1000" },
      { key: "fundingPct",    label: "资金费率（%）",     placeholder: "例如 0.01" }
    ],
    calc(d) {
      const rate = d.fundingPct / 100;
      const fee  = d.positionValue * rate;
      return {
        main: `本次资金费用 ≈ ${fee.toFixed(6)} U`,
        formula: "资金费用 = 仓位价值 × 资金费率",
        withVal: `= ${d.positionValue} × ${rate}（资金费率 = ${d.fundingPct}%）`
      };
    }
  },

  {
    id: "liqPrice",
    name: "预估强平价",
    subTitle: "选择多仓或空仓，并输入保证金余额、合约面值、张数、开仓均价、维持保证金率和手续费率，估算预估强平价（简化模型，仅供参考）。",
    tip: "维持保证金率、手续费率按百分比输入，例如 0.5% → 输入 0.5。",
    fields: [
      {
        key: "side",
        label: "持仓方向",
        type: "select",
        options: [
          { value: "long",  label: "多仓" },
          { value: "short", label: "空仓" }
        ]
      },
      { key: "balance",  label: "保证金余额（U）",       placeholder: "例如 100" },
      { key: "face",     label: "合约面值",             placeholder: "例如 0.01" },
      { key: "qty",      label: "张数（张）",            placeholder: "整数，例如 100" },
      { key: "openPrice",label: "开仓均价（U）",         placeholder: "例如 1000" },
      { key: "maintPct", label: "维持保证金率（%）",     placeholder: "例如 0.5" },
      { key: "feePct",   label: "手续费率（%）",         placeholder: "例如 0.006" }
    ],
    calc(d) {
      const { side, balance, face, qty, openPrice } = d;
      if (qty === 0) throw new Error("张数不能为 0。");

      const mRate = d.maintPct / 100;
      const fRate = d.feePct   / 100;
      let price, formula, withVal;

      if (side === "long") {
        const denom = face * qty * (mRate + fRate - 1);
        if (denom === 0) throw new Error("分母为 0，请检查维持保证金率 + 手续费率 - 1。");
        price  = (balance - face * qty * openPrice) / denom;
        formula =
          "多仓预估强平价 = [保证金余额 - 合约面值 × 张数 × 开仓均价] ÷ [合约面值 × 张数 × (维持保证金率 + 手续费率 - 1)]";
        withVal =
          `= (${balance} - ${face} × ${qty} × ${openPrice}) ÷ ` +
          `[${face} × ${qty} × (${mRate} + ${fRate} - 1)]`;
      } else {
        const denom = face * qty * (mRate + fRate + 1);
        if (denom === 0) throw new Error("分母为 0，请检查维持保证金率 + 手续费率 + 1。");
        price  = (balance + face * qty * openPrice) / denom;
        formula =
          "空仓预估强平价 = [保证金余额 + 合约面值 × 张数 × 开仓均价] ÷ [合约面值 × 张数 × (维持保证金率 + 手续费率 + 1)]";
        withVal =
          `= (${balance} + ${face} × ${qty} × ${openPrice}) ÷ ` +
          `[${face} × ${qty} × (${mRate} + ${fRate} + 1)]`;
      }

      return {
        main: `预估强平价 ≈ ${price.toFixed(4)} U（仅供参考）`,
        formula,
        withVal
      };
    }
  }
];

/* ===============================
   通用逻辑（下拉 + 表单 + 计算 + 历史）
   =============================== */

const toolSelectEl   = document.getElementById("toolSelect");
const fieldListEl    = document.getElementById("fieldList");
const previewMainEl  = document.getElementById("previewMain");
const previewExtraEl = document.getElementById("previewExtra");
const inputCardTitleEl = document.getElementById("inputCardTitle");
const inputCardSubEl   = document.getElementById("inputCardSub");
const inputTipEl       = document.getElementById("inputTip");
const btnCalc        = document.getElementById("btnCalc");
const btnClear       = document.getElementById("btnClear");
const inputStatusEl  = document.getElementById("inputStatus");
const btnCopy        = document.getElementById("btnCopy");
const historyListEl  = document.getElementById("historyList");

let currentToolId = uTools[0].id;
const history = [];
const MAX_HISTORY = 10;

/* 下拉菜单 */
function renderToolSelect() {
  toolSelectEl.innerHTML = "";
  uTools.forEach(tool => {
    const opt = document.createElement("option");
    opt.value = tool.id;
    opt.textContent = tool.name;
    toolSelectEl.appendChild(opt);
  });
}

/* 渲染输入项 */
function renderFields(tool) {
  fieldListEl.innerHTML = "";
  tool.fields.forEach(f => {
    const row = document.createElement("div");
    row.className = "field-row";

    const label = document.createElement("label");
    label.textContent = f.label;
    row.appendChild(label);

    if (f.type === "select") {
      const select = document.createElement("select");
      select.dataset.key = f.key;
      f.options.forEach(optCfg => {
        const opt = document.createElement("option");
        opt.value = optCfg.value;
        opt.textContent = optCfg.label;
        select.appendChild(opt);
      });
      row.appendChild(select);
    } else {
      const input = document.createElement("input");
      input.type = "text";
      input.placeholder = f.placeholder || "";
      input.dataset.key = f.key;
      row.appendChild(input);
    }

    fieldListEl.appendChild(row);
  });
}

/* 读取当前数据 */
function getCurrentTool() {
  return uTools.find(t => t.id === currentToolId);
}

function getCurrentData() {
  const tool = getCurrentTool();
  const data = {};
  tool.fields.forEach(f => {
    const el = fieldListEl.querySelector(`[data-key="${f.key}"]`);
    if (!el) return;
    if (f.type === "select") {
      data[f.key] = el.value;
    } else {
      const v = el.value.trim();
      data[f.key] = v === "" ? NaN : Number(v);
    }
  });
  return data;
}

/* 校验数字项 */
function checkNumbers(tool, data) {
  for (const f of tool.fields) {
    if (f.type === "select") continue;
    const v = data[f.key];
    if (typeof v === "number" && Number.isNaN(v)) {
      throw new Error("有必填项为空或不是数字，请检查输入。");
    }
  }
}

/* 更新 UI */
function updateToolUI() {
  const tool = getCurrentTool();
  toolSelectEl.value = tool.id;

  inputCardTitleEl.textContent = "输入区：" + tool.name;
  inputCardSubEl.textContent   = tool.subTitle;
  inputTipEl.textContent       = tool.tip;

  renderFields(tool);

  previewMainEl.textContent = `这里会显示：${tool.name} 的计算结果。`;
  previewExtraEl.innerHTML =
    "<strong>公式说明：</strong>点击“开始计算”后，这里会展示该功能的公式及代入数值。";
  inputStatusEl.textContent = "";
}

/* 历史记录渲染 */
function renderHistory() {
  if (!history.length) {
    historyListEl.textContent = "暂无记录。";
    return;
  }
  historyListEl.innerHTML = "";
  history.forEach(item => {
    const div = document.createElement("div");
    div.className = "history-item";
    div.textContent = `[${item.time}] ${item.toolName}：${item.main}`;
    historyListEl.appendChild(div);
  });
}

/* 计算按钮 */
btnCalc.onclick = () => {
  try {
    const tool = getCurrentTool();
    const data = getCurrentData();
    checkNumbers(tool, data);

    const { main, formula, withVal } = tool.calc(data);
    previewMainEl.textContent = main;

    const withValHtml = (withVal || "")
      .toString()
      .replace(/\n/g, "<br>");

    previewExtraEl.innerHTML =
      `<strong>公式：</strong>${formula}<br>` +
      `<strong>代入数值：</strong><br>${withValHtml}`;

    inputStatusEl.textContent = "计算完成。结果仅供参考。";
    inputStatusEl.classList.remove("status-error");

    history.unshift({
      toolName: tool.name,
      main,
      time: new Date().toLocaleString()
    });
    if (history.length > MAX_HISTORY) history.pop();
    renderHistory();
  } catch (e) {
    inputStatusEl.textContent = e.message || "计算失败，请检查输入。";
    inputStatusEl.classList.add("status-error");
  }
};

/* 清空按钮 */
btnClear.onclick = () => {
  fieldListEl.querySelectorAll("input").forEach(el => (el.value = ""));
  inputStatusEl.textContent = "";
};

/* 复制结果（包含公式 + 代入数值） */
btnCopy.onclick = () => {
  const text = previewMainEl.textContent + "\n\n" + previewExtraEl.innerText;
  navigator.clipboard
    .writeText(text)
    .then(() => {
      btnCopy.textContent = "已复制";
      setTimeout(() => (btnCopy.textContent = "复制结果"), 1000);
    })
    .catch(() => {
      btnCopy.textContent = "复制失败";
      setTimeout(() => (btnCopy.textContent = "复制结果"), 1000);
    });
};

/* 下拉切换功能 */
toolSelectEl.onchange = () => {
  currentToolId = toolSelectEl.value;
  updateToolUI();
};

/* 初始化 */
renderToolSelect();
updateToolUI();
renderHistory();
