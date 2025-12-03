// u_perp_calc.js
// 合约类型 + 计算项目二级选择版
// 所有公式来源：Excel《U本位合约》《币本位合约》《开仓均价 合约 U+币本》说明行

(function () {
  // ========== 样式 ==========
  const style = document.createElement("style");
  style.textContent = `
  *{box-sizing:border-box;}
  body{
    margin:0;
    font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;
    background:#0b0f19;
    color:#f5f5f7;
  }
  .wrap{
    max-width:1240px;
    margin:20px auto;
    padding:0 16px;
  }
  h1{
    margin:0 0 6px;
    font-size:22px;
    font-weight:700;
    color:#f8fafc;
  }
  .subtitle{
    font-size:12px;
    color:#9ca3af;
    margin-bottom:10px;
  }

  .top-row{
    display:flex;
    flex-wrap:wrap;
    gap:10px;
    margin-bottom:12px;
    align-items:center;
  }
  .top-row label{
    font-size:12px;
    color:#cbd5e1;
    margin-right:4px;
  }
  .top-row select{
    min-width:150px;
    padding:6px 10px;
    border-radius:999px;
    border:1px solid rgba(148,163,184,.5);
    background:#111827;
    color:#f9fafb;
    font-size:12px;
  }

  .row-2col{
    display:grid;
    grid-template-columns: 1fr 380px;
    gap:16px;
    align-items:flex-start;
  }

  .card{
    background:#111726;
    border-radius:12px;
    padding:14px 16px 16px;
    border:1px solid rgba(255,255,255,0.07);
  }
  .card-title{
    font-size:14px;
    font-weight:650;
    margin-bottom:6px;
    color:#fff;
  }
  .block-title{
    font-size:12px;
    font-weight:600;
    margin:8px 0 4px;
    color:#e5e7eb;
  }

  .grid{
    display:grid;
    grid-template-columns:repeat(auto-fit,minmax(160px,1fr));
    gap:8px 10px;
  }
  .field{
    display:flex;
    flex-direction:column;
  }
  .field label{
    font-size:11px;
    margin-bottom:3px;
    color:#cbd5e1;
  }
  input,select.param{
    width:100%;
    padding:6px 8px;
    border-radius:8px;
    border:1px solid rgba(148,163,184,.45);
    background:#0f172a;
    color:#f9fafb;
    font-size:12px;
  }
  input:focus,select.param:focus{
    border-color:#fbbf24;
    box-shadow:0 0 0 1px #f97316;
  }

  .calc-btn{
    width:100%;
    margin-top:10px;
    padding:8px 12px;
    border-radius:8px;
    border:none;
    cursor:pointer;
    font-size:13px;
    font-weight:700;
    background:linear-gradient(135deg,#fbbf24,#f97316);
    color:#111827;
  }

  #result{
    font-size:12px;
    color:#e5e7eb;
  }
  .sub-title{
    margin:8px 0 4px;
    font-size:12px;
    font-weight:650;
    border-left:3px solid #f97316;
    padding-left:6px;
    color:#fff;
  }
  .row-item{
    display:flex;
    justify-content:space-between;
    padding:2px 0;
  }
  .row-item span:first-child{color:#9ca3af;}
  .row-item span:last-child{font-weight:600;color:#f8fafc;}
  .row-item.big span:last-child{font-size:13px;color:#fef3c7;}

  .hint{
    font-size:11px;
    color:#9ca3af;
    margin-top:4px;
  }

  @media(max-width:900px){
    .row-2col{grid-template-columns:1fr;}
  }
  `;
  document.head.appendChild(style);

  // ========== 页面骨架 ==========
  document.body.innerHTML = `
    <div class="wrap">
      <h1>合约计算器（按 Excel 公式）</h1>
      <div class="subtitle">先选择合约类型，再选择要计算的项目，系统会根据 Excel 公式自动给出需要填写的参数。</div>

      <div class="top-row">
        <div>
          <label>合约类型</label>
          <select id="contractType">
            <option value="U本位合约">U本位合约</option>
            <option value="币本位合约">币本位合约</option>
            <option value="开仓均价 合约 U+币本">开仓均价 合约 U+币本</option>
            <option value="现货杠杆">现货杠杆（暂未实现）</option>
            <option value="现货开仓均价">现货开仓均价（暂未实现）</option>
            <option value="期权">期权（暂未实现）</option>
          </select>
        </div>
        <div>
          <label>要计算的项目</label>
          <select id="calcItem">
            <option value="开仓均价">开仓均价</option>
            <option value="手续费">手续费</option>
            <option value="合约收益">合约收益</option>
            <option value="收益率">收益率</option>
            <option value="开仓保证金（初始）">开仓保证金（初始）</option>
            <option value="维持保证金">维持保证金</option>
            <option value="维持保证金率">维持保证金率</option>
            <option value="跨币种全仓维持保证金率">跨币种全仓维持保证金率</option>
            <option value="仓位价值">仓位价值</option>
            <option value="资金费用">资金费用</option>
            <option value="预估强平价">预估强平价</option>
          </select>
        </div>
      </div>

      <div class="row-2col">
        <!-- 左：输入 -->
        <div class="card">
          <div class="card-title">参数填写</div>

          <div class="block-title" id="block-basic-title">基础参数</div>
          <div class="grid" id="block-basic">
            <div class="field" data-field="side">
              <label>方向</label>
              <select id="side" class="param">
                <option value="long">做多</option>
                <option value="short">做空</option>
              </select>
            </div>
            <div class="field" data-field="faceValue">
              <label>合约面值</label>
              <input id="faceValue" type="text">
            </div>
            <div class="field" data-field="contracts">
              <label>张数（或张数绝对值）</label>
              <input id="contracts" type="text">
            </div>
            <div class="field" data-field="openPx">
              <label>开仓价格</label>
              <input id="openPx" type="text">
            </div>
            <div class="field" data-field="closePx">
              <label>平仓价格</label>
              <input id="closePx" type="text">
            </div>
            <div class="field" data-field="leverage">
              <label>杠杆倍数</label>
              <input id="leverage" type="text">
            </div>
          </div>

          <div class="block-title" id="block-fee-title">手续费参数</div>
          <div class="grid" id="block-fee">
            <div class="field" data-field="makerFee">
              <label>挂单手续费率（%）</label>
              <input id="makerFee" type="text" placeholder="可为负，例如 -0.02">
            </div>
            <div class="field" data-field="takerFee">
              <label>吃单手续费率（%）</label>
              <input id="takerFee" type="text" placeholder="例如 0.05">
            </div>
            <div class="field" data-field="openRole">
              <label>开仓使用费率</label>
              <select id="openRole" class="param">
                <option value="maker">挂单费率</option>
                <option value="taker">吃单费率</option>
              </select>
            </div>
            <div class="field" data-field="closeRole">
              <label>平仓使用费率</label>
              <select id="closeRole" class="param">
                <option value="maker">挂单费率</option>
                <option value="taker">吃单费率</option>
              </select>
            </div>
            <div class="field" data-field="liqFeeRate">
              <label>强平/减仓手续费率（%）</label>
              <input id="liqFeeRate" type="text">
            </div>
          </div>

          <div class="block-title" id="block-mark-title">标记价格与资金费率</div>
          <div class="grid" id="block-mark">
            <div class="field" data-field="markPx">
              <label>标记价格</label>
              <input id="markPx" type="text">
            </div>
            <div class="field" data-field="fundingRate">
              <label>资金费率（%）</label>
              <input id="fundingRate" type="text">
            </div>
          </div>

          <div class="block-title" id="block-margin-title">保证金相关参数</div>
          <div class="grid" id="block-margin">
            <div class="field" data-field="mmRate">
              <label>维持保证金率（%）</label>
              <input id="mmRate" type="text">
            </div>
            <div class="field" data-field="marginBalance">
              <label>保证金余额</label>
              <input id="marginBalance" type="text">
            </div>
            <div class="field" data-field="effectiveMargin">
              <label>有效保证金（跨币种全仓）</label>
              <input id="effectiveMargin" type="text">
            </div>
            <div class="field" data-field="reduceFee">
              <label>减仓手续费（跨币种全仓）</label>
              <input id="reduceFee" type="text">
            </div>
          </div>

          <div class="block-title" id="block-openavg-title">开仓均价专用参数</div>
          <div class="grid" id="block-openavg">
            <div class="field" data-field="origQty">
              <label>原持仓数量</label>
              <input id="origQty" type="text">
            </div>
            <div class="field" data-field="origPrice">
              <label>原持仓均价</label>
              <input id="origPrice" type="text">
            </div>
            <div class="field" data-field="newQty">
              <label>新开仓数量</label>
              <input id="newQty" type="text">
            </div>
            <div class="field" data-field="newPrice">
              <label>新开仓成交均价</label>
              <input id="newPrice" type="text">
            </div>
          </div>

          <button class="calc-btn" id="btnCalc">计算</button>
          <div class="hint" id="hintText"></div>
        </div>

        <!-- 右：结果 -->
        <div class="card">
          <div class="card-title">计算结果</div>
          <div id="result">请先在左侧选择合约类型和计算项目，然后按提示填写参数并点击“计算”。</div>
        </div>
      </div>
    </div>
  `;

  // ========== 字段配置 ==========
  const FIELD_LABELS = {
    side: "方向",
    faceValue: "合约面值",
    contracts: "张数",
    openPx: "开仓价格",
    closePx: "平仓价格",
    leverage: "杠杆倍数",
    makerFee: "挂单手续费率（%）",
    takerFee: "吃单手续费率（%）",
    openRole: "开仓使用费率",
    closeRole: "平仓使用费率",
    liqFeeRate: "强平/减仓手续费率（%）",
    markPx: "标记价格",
    fundingRate: "资金费率（%）",
    mmRate: "维持保证金率（%）",
    marginBalance: "保证金余额",
    effectiveMargin: "有效保证金",
    reduceFee: "减仓手续费",
    origQty: "原持仓数量",
    origPrice: "原持仓均价",
    newQty: "新开仓数量",
    newPrice: "新开仓成交均价"
  };

  // 每个「合约类型 + 计算项目」需要哪些字段
  const REQUIRED = {
    "U本位合约": {
      "开仓均价": ["faceValue","origQty","origPrice","newQty","newPrice"],
      "手续费": ["faceValue","contracts","openPx","closePx","makerFee","takerFee","openRole","closeRole"],
      "合约收益": ["side","faceValue","contracts","openPx","closePx"],
      "收益率": ["side","faceValue","contracts","openPx","closePx","leverage"],
      "开仓保证金（初始）": ["faceValue","contracts","openPx","leverage"],
      "维持保证金": ["faceValue","contracts","markPx","mmRate"],
      "维持保证金率": ["side","faceValue","contracts","openPx","closePx","markPx","mmRate","makerFee","takerFee","openRole","closeRole","marginBalance"],
      "跨币种全仓维持保证金率": ["faceValue","contracts","markPx","mmRate","effectiveMargin","reduceFee"],
      "仓位价值": ["faceValue","contracts","markPx"],
      "资金费用": ["faceValue","contracts","markPx","fundingRate"],
      "预估强平价": ["faceValue","contracts","openPx","marginBalance","mmRate","liqFeeRate"]
    },
    "币本位合约": {
      "开仓均价": ["faceValue","origQty","origPrice","newQty","newPrice"],
      "手续费": ["faceValue","contracts","openPx","closePx","makerFee","takerFee","openRole","closeRole"],
      "合约收益": ["side","faceValue","contracts","openPx","closePx"],
      "收益率": ["side","faceValue","contracts","openPx","closePx","leverage"],
      "开仓保证金（初始）": ["faceValue","contracts","openPx","leverage"],
      "维持保证金": ["faceValue","contracts","markPx","mmRate"],
      "维持保证金率": ["side","faceValue","contracts","openPx","closePx","markPx","mmRate","makerFee","takerFee","openRole","closeRole","marginBalance"],
      "跨币种全仓维持保证金率": ["faceValue","contracts","markPx","mmRate","effectiveMargin","reduceFee"],
      "仓位价值": ["faceValue","contracts","markPx"],
      "资金费用": ["faceValue","contracts","markPx","fundingRate"],
      "预估强平价": ["faceValue","contracts","openPx","marginBalance","mmRate","liqFeeRate"]
    },
    "开仓均价 合约 U+币本": {
      "开仓均价": ["faceValue","origQty","origPrice","newQty","newPrice"]
    }
  };

  // ========== 工具函数 ==========
  const $ = id => document.getElementById(id);

  function getNum(id) {
    const el = $(id);
    if (!el) return null;
    let v = el.value.trim();
    if (!v) return null;
    v = v.replace(/,/g,"").replace(/，/g,"");
    const n = parseFloat(v);
    return Number.isFinite(n) ? n : null;
  }
  const pct = v => v / 100;

  function formatVal(v, d = 8) {
    if (!Number.isFinite(v)) return "-";
    return v.toFixed(d);
  }

  // 根据当前选择，控制显示哪些字段
  function refreshVisibleFields() {
    const cType = $("contractType").value;
    const item = $("calcItem").value;
    const needSet = new Set((REQUIRED[cType] && REQUIRED[cType][item]) || []);

    const allFieldDivs = document.querySelectorAll("[data-field]");
    allFieldDivs.forEach(div => {
      const id = div.getAttribute("data-field");
      if (needSet.size === 0) {
        // 未配置时全部隐藏
        div.style.display = "none";
      } else {
        div.style.display = needSet.has(id) ? "flex" : "none";
      }
    });

    // 没有字段的分组隐藏标题
    ["basic","fee","mark","margin","openavg"].forEach(name => {
      const block = $(`block-${name}`);
      const title = $(`block-${name}-title`);
      if (!block) return;
      const hasVisible = Array.from(block.querySelectorAll("[data-field]"))
        .some(div => div.style.display !== "none");
      block.style.display = hasVisible ? "grid" : "none";
      if (title) title.style.display = hasVisible ? "block" : "none";
    });

    // 提示文字
    const hint = $("hintText");
    if (!REQUIRED[cType] || !REQUIRED[cType][item]) {
      hint.textContent = "该合约类型下此项目暂未在网页中实现，请先使用 Excel 表。";
    } else {
      const needNames = (REQUIRED[cType][item] || []).map(id => FIELD_LABELS[id]).filter(Boolean);
      hint.textContent = needNames.length
        ? "当前项目需要填写的主要参数：" + needNames.join("、")
        : "";
    }

    $("result").textContent = "参数更新后，请点击“计算”。";
  }

  // 检查必填字段
  function checkRequired(contractType, item) {
    const req = (REQUIRED[contractType] && REQUIRED[contractType][item]) || [];
    const missing = [];
    req.forEach(id => {
      const el = $(id);
      if (!el) return;
      if (el.tagName === "SELECT") {
        // 选择框一般都有默认值，这里不校验
        return;
      }
      const v = el.value.trim();
      if (!v) missing.push(FIELD_LABELS[id] || id);
    });
    return missing;
  }

  // ========== 各类型计算公式（直接按 Excel 文字公式写） ==========

  // 开仓均价（U / 币本位通用，来自“开仓均价 合约 U+币本”sheet）
  function calcOpenAvg(face, origQty, origPrice, newQty, newPrice) {
    const totalQty = origQty + newQty;
    if (totalQty === 0) return null;
    // H6: (B6*C6*D6 + B6*E6*F6) / (B6*(C6+E6))，面值可约掉
    return (origQty * origPrice + newQty * newPrice) / totalQty;
  }

  // U 本位合约相关
  function calcU(item) {
    const side = $("side").value; // long / short
    const face = getNum("faceValue");
    const ctt = Math.abs(getNum("contracts") || 0);
    const open = getNum("openPx");
    const close = getNum("closePx");
    const lev = getNum("leverage");
    const makerPct = getNum("makerFee");
    const takerPct = getNum("takerFee");
    const openRole = $("openRole").value;
    const closeRole = $("closeRole").value;
    const mark = getNum("markPx");
    const fundPct = getNum("fundingRate");
    const mmPct = getNum("mmRate");
    const liqPct = getNum("liqFeeRate");
    const mb = getNum("marginBalance");
    const effMargin = getNum("effectiveMargin");
    const reduceFee = getNum("reduceFee");
    const origQty = getNum("origQty");
    const origPrice = getNum("origPrice");
    const newQty = getNum("newQty");
    const newPrice = getNum("newPrice");

    const maker = pct(makerPct || 0);
    const taker = pct(takerPct || 0);
    const feeOpenRate = openRole === "maker" ? maker : taker;
    const feeCloseRate = closeRole === "maker" ? maker : taker;

    let html = "";

    // 公共量
    const positionValue_open = face && ctt && open ? face * ctt * open : null; // 以开仓价计
    const positionValue_mark = face && ctt && mark ? face * ctt * mark : null; // 以标记价计
    const mmRate = pct(mmPct || 0);
    const liqRate = pct(liqPct || 0);

    // 合约收益（A3）
    let pnl = null;
    if (face != null && ctt && open != null && close != null) {
      if (side === "long") {
        pnl = face * ctt * (close - open);
      } else {
        pnl = face * ctt * (open - close);
      }
    }

    // 开仓保证金（初始）（A5）
    let initMargin = null;
    if (face != null && ctt && open != null && lev != null && lev !== 0) {
      initMargin = face * ctt * open / lev;
    }

    // 手续费（A2）
    let feeOpen = null, feeClose = null, feeTotal = null;
    if (face != null && ctt && open != null) {
      feeOpen = face * ctt * open * feeOpenRate;
    }
    if (face != null && ctt && close != null) {
      feeClose = face * ctt * close * feeCloseRate;
    }
    if (feeOpen != null || feeClose != null) {
      feeTotal = (feeOpen || 0) + (feeClose || 0);
    }

    // 维持保证金（A6）
    let maintMargin = null;
    if (positionValue_mark != null && mmPct != null) {
      maintMargin = positionValue_mark * mmRate;
    }

    // 单币种「保证金率」（A7：保证金率 = (保证金余额 + 收益) / (面值*|张数|*标记价格*(维持保证金率+手续费率))）
    let marginRatioSingle = null;
    if (mb != null && pnl != null && positionValue_mark != null && mmPct != null) {
      const closeFeeRate = feeCloseRate; // 视为“减仓手续费率”
      const denom = positionValue_mark * (mmRate + closeFeeRate);
      if (denom !== 0) {
        marginRatioSingle = (mb + pnl) / denom * 100;
      }
    }

    // 跨币种全仓维持保证金率（A8：维持保证金率 = 有效保证金 /（维持保证金 + 减仓手续费)）
    let marginRatioCross = null;
    if (effMargin != null && maintMargin != null) {
      const denom = maintMargin + (reduceFee || 0);
      if (denom !== 0) {
        marginRatioCross = effMargin / denom * 100;
      }
    }

    // 仓位价值（A9）
    let posValue = positionValue_mark;

    // 资金费用（A10）
    let fundingFee = null;
    if (posValue != null && fundPct != null) {
      fundingFee = posValue * pct(fundPct);
    }

    // 预估强平价（A11）
    let liqLong = null, liqShort = null;
    if (face != null && ctt && open != null && mb != null && mmPct != null && liqPct != null) {
      const pos = face * ctt;
      const denomLong = pos * (mmRate + liqRate - 1);
      if (denomLong !== 0) {
        liqLong = (mb - pos * open) / denomLong;
      }
      const denomShort = pos * (mmRate + liqRate + 1);
      if (denomShort !== 0) {
        liqShort = (mb + pos * open) / denomShort;
      }
    }

    // 开仓均价（用开仓均价 sheet 公式）
    let avgOpen = null;
    if (origQty != null && origPrice != null && newQty != null && newPrice != null) {
      avgOpen = calcOpenAvg(face || 1, origQty, origPrice, newQty, newPrice);
    }

    const itemName = $("calcItem").value;

    switch (itemName) {
      case "开仓均价":
        html += `<div class="sub-title">开仓均价</div>`;
        if (avgOpen == null) {
          html += `<div class="row-item"><span>提示</span><span>请填写：合约面值、原持仓数量、原持仓均价、新开仓数量、新开仓成交均价。</span></div>`;
        } else {
          html += row("加权平均开仓均价", avgOpen, 8);
        }
        break;

      case "手续费":
        html += `<div class="sub-title">手续费</div>`;
        html += row("开仓手续费", feeOpen, 8);
        html += row("平仓手续费", feeClose, 8);
        html += row("手续费合计", feeTotal, 8);
        break;

      case "合约收益":
        html += `<div class="sub-title">合约收益</div>`;
        html += row("合约收益（未扣手续费）", pnl, 8);
        break;

      case "收益率":
        html += `<div class="sub-title">收益与收益率</div>`;
        html += row("合约收益（未扣手续费）", pnl, 8);
        html += row("开仓保证金（初始）", initMargin, 8);
        const netForRate = pnl; // 按说明：收益 / 开仓固定保证金
        const rate = initMargin ? netForRate / initMargin * 100 : null;
        html += row("收益率（收益 ÷ 开仓保证金）", rate, 4, "%");
        break;

      case "开仓保证金（初始）":
        html += `<div class="sub-title">开仓保证金（初始）</div>`;
        html += row("开仓保证金（面值×开仓价×张数÷杠杆）", initMargin, 8);
        break;

      case "维持保证金":
        html += `<div class="sub-title">维持保证金</div>`;
        html += row("仓位价值（标记价格）", posValue, 8);
        html += row("维持保证金（仓位价值×维持保证金率）", maintMargin, 8);
        break;

      case "维持保证金率":
        html += `<div class="sub-title">单币种全仓保证金率</div>`;
        html += row("合约收益", pnl, 8);
        html += row("仓位价值（标记价格）", posValue, 8);
        html += row("保证金率（(保证金余额+收益) ÷ [仓位价值×(维持保证金率+减仓手续费率)])", marginRatioSingle, 4, "%");
        break;

      case "跨币种全仓维持保证金率":
        html += `<div class="sub-title">跨币种全仓维持保证金率</div>`;
        html += row("维持保证金", maintMargin, 8);
        html += row("减仓手续费", reduceFee, 8);
        html += row("有效保证金", effMargin, 8);
        html += row("维持保证金率（有效保证金 ÷ [维持保证金+减仓手续费])", marginRatioCross, 4, "%");
        break;

      case "仓位价值":
        html += `<div class="sub-title">仓位价值</div>`;
        html += row("仓位价值（面值×张数×标记价格）", posValue, 8);
        break;

      case "资金费用":
        html += `<div class="sub-title">资金费用</div>`;
        html += row("仓位价值（标记价格）", posValue, 8);
        html += row("资金费用（仓位价值×资金费率）", fundingFee, 8);
        break;

      case "预估强平价":
        html += `<div class="sub-title">预估强平价格</div>`;
        html += row("多仓预估强平价", liqLong, 8);
        html += row("空仓预估强平价", liqShort, 8);
        break;

      default:
        html += "该项目暂未实现，请先使用 Excel。";
    }

    return html;
  }

  // 币本位合约相关（按《币本位合约》sheet）
  function calcCoin(item) {
    const side = $("side").value;
    const face = getNum("faceValue");
    const ctt = Math.abs(getNum("contracts") || 0);
    const open = getNum("openPx");
    const close = getNum("closePx");
    const lev = getNum("leverage");
    const makerPct = getNum("makerFee");
    const takerPct = getNum("takerFee");
    const openRole = $("openRole").value;
    const closeRole = $("closeRole").value;
    const mark = getNum("markPx");
    const fundPct = getNum("fundingRate");
    const mmPct = getNum("mmRate");
    const liqPct = getNum("liqFeeRate");
    const mb = getNum("marginBalance");
    const effMargin = getNum("effectiveMargin");
    const reduceFee = getNum("reduceFee");
    const origQty = getNum("origQty");
    const origPrice = getNum("origPrice");
    const newQty = getNum("newQty");
    const newPrice = getNum("newPrice");

    const maker = pct(makerPct || 0);
    const taker = pct(takerPct || 0);
    const feeOpenRate = openRole === "maker" ? maker : taker;
    const feeCloseRate = closeRole === "maker" ? maker : taker;

    let html = "";

    // 仓位价值（面值*张数/标记价格）
    let posValue = null;
    if (face != null && ctt && mark != null && mark !== 0) {
      posValue = face * ctt / mark;
    }

    const mmRate = pct(mmPct || 0);
    const liqRate = pct(liqPct || 0);

    // 合约收益（A3）
    let pnl = null;
    if (face != null && ctt && open != null && close != null && open !== 0 && close !== 0) {
      if (side === "long") {
        pnl = (face / open - face / close) * ctt;
      } else {
        pnl = (face / close - face / open) * ctt;
      }
    }

    // 开仓保证金（面值/开仓价*张数/杠杆）（A5）
    let initMargin = null;
    if (face != null && ctt && open != null && open !== 0 && lev != null && lev !== 0) {
      initMargin = face / open * ctt / lev;
    }

    // 手续费（A2：面值*张数/价格*手续费率）
    let feeOpen = null, feeClose = null, feeTotal = null;
    if (face != null && ctt && open != null && open !== 0) {
      feeOpen = face * ctt / open * feeOpenRate;
    }
    if (face != null && ctt && close != null && close !== 0) {
      feeClose = face * ctt / close * feeCloseRate;
    }
    if (feeOpen != null || feeClose != null) {
      feeTotal = (feeOpen || 0) + (feeClose || 0);
    }

    // 维持保证金（A6：面值*|张数|*维持保证金率／标记价格）
    let maintMargin = null;
    if (face != null && ctt && mark != null && mark !== 0 && mmPct != null) {
      maintMargin = face * ctt * mmRate / mark;
    }

    // 单币种保证金率（A7）
    let marginRatioSingle = null;
    if (mb != null && pnl != null && face != null && ctt && mark != null && mark !== 0 && mmPct != null) {
      const closeFeeRate = feeCloseRate;
      const denom = (face * ctt / mark) * (mmRate + closeFeeRate);
      if (denom !== 0) {
        marginRatioSingle = (mb + pnl) / denom * 100;
      }
    }

    // 跨币种全仓维持保证金率（A8）
    let marginRatioCross = null;
    if (effMargin != null && maintMargin != null) {
      const denom = maintMargin + (reduceFee || 0);
      if (denom !== 0) {
        marginRatioCross = effMargin / denom * 100;
      }
    }

    // 资金费用（A10）
    let fundingFee = null;
    if (posValue != null && fundPct != null) {
      fundingFee = posValue * pct(fundPct);
    }

    // 预估强平价（A11）
    let liqLong = null, liqShort = null;
    if (posValue != null && open != null && open !== 0 && mb != null && mmPct != null && liqPct != null) {
      // 多仓预估强平价 = 仓位价值*(维持保证金率+手续费率+1) / (保证金余额 + 仓位价值/开仓均价)
      const feeRate = liqRate; // 视为减仓手续费率
      const denomLong = mb + posValue / open;
      if (denomLong !== 0) {
        liqLong = posValue * (mmRate + feeRate + 1) / denomLong;
      }
      // 空仓预估强平价 = 仓位价值*(维持保证金率+手续费率-1) / (保证金余额 - 仓位价值/开仓均价)
      const denomShort = mb - posValue / open;
      if (denomShort !== 0) {
        liqShort = posValue * (mmRate + feeRate - 1) / denomShort;
      }
    }

    // 开仓均价（同 U，本质加权平均）
    let avgOpen = null;
    if (origQty != null && origPrice != null && newQty != null && newPrice != null) {
      avgOpen = calcOpenAvg(face || 1, origQty, origPrice, newQty, newPrice);
    }

    const itemName = $("calcItem").value;

    switch (itemName) {
      case "开仓均价":
        html += `<div class="sub-title">开仓均价</div>`;
        html += row("加权平均开仓均价", avgOpen, 8);
        break;

      case "手续费":
        html += `<div class="sub-title">手续费</div>`;
        html += row("开仓手续费", feeOpen, 8);
        html += row("平仓手续费", feeClose, 8);
        html += row("手续费合计", feeTotal, 8);
        break;

      case "合约收益":
        html += `<div class="sub-title">合约收益</div>`;
        html += row("合约收益（未扣手续费）", pnl, 8);
        break;

      case "收益率":
        html += `<div class="sub-title">收益与收益率</div>`;
        html += row("合约收益（未扣手续费）", pnl, 8);
        html += row("开仓保证金（初始）", initMargin, 8);
        const rate = initMargin ? pnl / initMargin * 100 : null;
        html += row("收益率（收益 ÷ 开仓保证金）", rate, 4, "%");
        break;

      case "开仓保证金（初始）":
        html += `<div class="sub-title">开仓保证金（初始）</div>`;
        html += row("开仓保证金（面值/开仓价×张数÷杠杆）", initMargin, 8);
        break;

      case "维持保证金":
        html += `<div class="sub-title">维持保证金</div>`;
        html += row("仓位价值（面值×张数÷标记价格）", posValue, 8);
        html += row("维持保证金（仓位价值×维持保证金率）", maintMargin, 8);
        break;

      case "维持保证金率":
        html += `<div class="sub-title">单币种全仓保证金率</div>`;
        html += row("合约收益", pnl, 8);
        html += row("保证金率", marginRatioSingle, 4, "%");
        break;

      case "跨币种全仓维持保证金率":
        html += `<div class="sub-title">跨币种全仓维持保证金率</div>`;
        html += row("维持保证金", maintMargin, 8);
        html += row("减仓手续费", reduceFee, 8);
        html += row("有效保证金", effMargin, 8);
        html += row("维持保证金率（有效保证金 ÷ [维持保证金+减仓手续费])", marginRatioCross, 4, "%");
        break;

      case "仓位价值":
        html += `<div class="sub-title">仓位价值</div>`;
        html += row("仓位价值（面值×张数÷标记价格）", posValue, 8);
        break;

      case "资金费用":
        html += `<div class="sub-title">资金费用</div>`;
        html += row("仓位价值", posValue, 8);
        html += row("资金费用（仓位价值×资金费率）", fundingFee, 8);
        break;

      case "预估强平价":
        html += `<div class="sub-title">预估强平价格</div>`;
        html += row("多仓预估强平价", liqLong, 8);
        html += row("空仓预估强平价", liqShort, 8);
        break;

      default:
        html += "该项目暂未实现，请先使用 Excel。";
    }

    return html;
  }

  // 开仓均价 sheet 单独模式
  function calcOpenAvgOnly() {
    const face = getNum("faceValue");
    const origQty = getNum("origQty");
    const origPrice = getNum("origPrice");
    const newQty = getNum("newQty");
    const newPrice = getNum("newPrice");
    const avg = calcOpenAvg(face || 1, origQty, origPrice, newQty, newPrice);

    let html = `<div class="sub-title">开仓均价</div>`;
    html += row("加权平均开仓均价", avg, 8);
    return html;
  }

  function row(k,v,d,suf){
    const t = formatVal(v,d);
    return `<div class="row-item"><span>${k}</span><span>${t}${suf?" "+suf:""}</span></div>`;
  }
  function rowBig(k,v,d){
    const t = formatVal(v,d);
    return `<div class="row-item big"><span>${k}</span><span>${t}</span></div>`;
  }

  // ========== 主流程 ==========
  function doCalc() {
    const cType = $("contractType").value;
    const item = $("calcItem").value;
    const resEl = $("result");

    if (!REQUIRED[cType] || !REQUIRED[cType][item]) {
      resEl.textContent = "当前合约类型下，该项目暂未在网页中实现，请先使用 Excel。";
      return;
    }

    const missing = checkRequired(cType, item);
    if (missing.length > 0) {
      resEl.textContent = "请先填写以下参数再计算：" + missing.join("、");
      return;
    }

    let html = "";
    if (cType === "U本位合约") {
      html = calcU(item);
    } else if (cType === "币本位合约") {
      html = calcCoin(item);
    } else if (cType === "开仓均价 合约 U+币本") {
      if (item !== "开仓均价") {
        html = "“开仓均价 合约 U+币本” 表仅支持计算开仓均价，请将计算项目切换为【开仓均价】。";
      } else {
        html = calcOpenAvgOnly();
      }
    } else {
      html = "该合约类型暂未实现，请使用 Excel 表格版本。";
    }

    resEl.innerHTML = html;
  }

  // 事件
  $("contractType").addEventListener("change", refreshVisibleFields);
  $("calcItem").addEventListener("change", refreshVisibleFields);
  $("btnCalc").addEventListener("click", doCalc);

  // 初始刷新一次
  refreshVisibleFields();
})();
