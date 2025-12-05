// u_perp_calc_final.js
// V1.0.4：版本号添加，标题优化，解决 TypeError: missing.gfilter is not a function

(function () {
    // ========== 常量：版本号 ==========
    const VERSION = "V1.0.4";

    // ========== 样式 (添加版本号样式) ==========
    const style = document.createElement("style");
    style.textContent = `
    *{box-sizing:border-box;}
    body{
      margin:0;
      font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;
      background:#0a0a0a;
      color:#e0e0e0;
      font-size:13px;
    }
    .wrap{
      max-width:1240px;
      margin:22px auto;
      padding:0 18px;
    }
    h1{
      margin:0 0 8px;
      font-size:24px;
      font-weight:700;
      color:#ffffff;
    }
    .subtitle{
      font-size:13px;
      color:#909090;
      margin-bottom:12px;
    }

    .top-row{
      display:flex;
      flex-wrap:wrap;
      gap:16px;
      margin-bottom:20px;
      align-items:center;
    }
    .top-row label{
      font-size:13px;
      color:#bdbdbd;
      margin-right:4px;
    }
    .top-row select{
      min-width:180px;
      padding:8px 14px;
      border-radius:6px;
      border:1px solid #303030;
      background:#1a1a1a;
      color:#ffffff;
      font-size:14px;
      appearance: none;
      -webkit-appearance: none;
    }

    .row-2col{
      display:grid;
      grid-template-columns: 1.1fr 0.9fr;
      gap:24px;
      align-items:flex-start;
    }

    .card{
      background:#181818;
      border-radius:12px;
      padding:20px;
      border:1px solid #333333;
    }
    .card-title{
      font-size:16px;
      font-weight:700;
      margin-bottom:10px;
      color:#4FC3F7;
    }
    .block-title{
      font-size:14px;
      font-weight:600;
      margin:15px 0 8px;
      color:#bdbdbd;
      border-left:3px solid #4FC3F7;
      padding-left:10px;
    }

    .grid{
      display:grid;
      grid-template-columns:repeat(auto-fit,minmax(180px,1fr));
      gap:12px;
    }
    .field{
      display:flex;
      flex-direction:column;
    }
    .field label{
      font-size:12px;
      margin-bottom:4px;
      color:#9e9e9e;
    }
    input,select.param{
      width:100%;
      padding:8px 10px;
      border-radius:6px;
      border:1px solid #303030;
      background:#1a1a1a;
      color:#ffffff;
      font-size:14px;
    }
    input::placeholder{
      color:#616161;
    }
    input:focus,select.param:focus{
      border-color:#4FC3F7;
      box-shadow:0 0 0 1px #4FC3F7;
    }

    .calc-btn{
      width:100%;
      margin-top:20px;
      padding:10px 14px;
      border-radius:8px;
      border:none;
      cursor:pointer;
      font-size:15px;
      font-weight:700;
      background:linear-gradient(135deg, #00BCD4, #4FC3F7);
      color:#0a0a0a;
      transition: background 0.3s ease;
    }
    .calc-btn:hover{
        background:linear-gradient(135deg, #0097A7, #00BCD4);
    }
    
    #result{
      font-size:14px;
      color:#e0e0e0;
    }
    .sub-title{
      margin:12px 0 6px;
      font-size:15px;
      font-weight:700;
      border-left:4px solid #4FC3F7;
      padding-left:12px;
      color:#ffffff;
    }
    .row-item{
      display:flex;
      justify-content:space-between;
      padding:6px 0;
      border-bottom:1px dashed #282828;
    }
    .row-item:last-child{
        border-bottom:none;
    }
    .row-item span:first-child{
      color:#b0b0b0;
      font-size:14px;
    }
    .row-item span:last-child{
      font-weight:650;
      color:#ffffff;
      font-size:15px;
    }
    .row-item.big{
      margin-top:8px;
      margin-bottom:8px;
      padding-top:10px;
      padding-bottom:10px;
      background:#1a1a1a;
      border-radius:6px;
      border-bottom:none;
      padding-left:12px;
      padding-right:12px;
    }
    .row-item.big span:first-child{
      font-size:15px;
    }
    .row-item.big span:last-child{
      font-size:20px;
      color:#00BCD4;
    }

    .hint{
      font-size:12px;
      color:#9e9e9e;
      margin-top:10px;
      line-height:1.6;
      padding: 0 10px;
    }
    .hint-error {
        color: #FF5252 !important;
    }

    .version-info {
        text-align: right;
        font-size: 11px;
        color: #555;
        padding: 10px 0 20px;
        margin-top: 20px;
        border-top: 1px solid #1a1a1a;
    }

    @media(max-width:900px){
      .row-2col{grid-template-columns:1fr;}
    }
    `;
    document.head.appendChild(style);

    // ========== 页面骨架 (修改标题和添加版本号) ==========
    document.body.innerHTML = `
    <div class="wrap">
      <h1>永续合约盈亏与保证金计算器</h1>
      <div class="subtitle">先选择合约类型，再选择要计算的项目，系统会自动给出需要填写的参数。</div>

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
              <input id="faceValue" type="text" placeholder="例如：10 (ETHUSDC) 或 0.001 (BTCUSD)">
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
              <input id="liqFeeRate" type="text" placeholder="通常是 Taker Fee">
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
              <input id="marginBalance" type="text" placeholder="U本位: USDT | 币本位: 币">
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
              <label>原持仓数量（张）</label>
              <input id="origQty" type="text">
            </div>
            <div class="field" data-field="origPrice">
              <label>原持仓均价</label>
              <input id="origPrice" type="text">
            </div>
            <div class="field" data-field="newQty">
              <label>新开仓数量（张）</label>
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

        <div class="card">
          <div class="card-title">计算结果</div>
          <div id="result">参数更新后，请点击计算。</div>
        </div>
      </div>
      
      <div class="version-info">版本号：${VERSION}</div>
    </div>
    `;

    // ========== 常量和 DOM 引用 (保持不变) ==========
    const $ = id => document.getElementById(id);
    const $D = {}; 

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
        origQty: "原持仓数量（张）",
        origPrice: "原持仓均价",
        newQty: "新开仓数量（张）",
        newPrice: "新开仓成交均价"
    };

    // 必填项配置 (保持不变)
    const REQUIRED = {
        "U本位合约": {
            "开仓均价": ["origQty", "origPrice", "newQty", "newPrice"],
            "手续费": ["faceValue", "contracts", "openPx", "closePx", "makerFee", "takerFee", "openRole", "closeRole"],
            "合约收益": ["side", "faceValue", "contracts", "openPx", "closePx"],
            "收益率": ["side", "faceValue", "contracts", "openPx", "closePx", "leverage"],
            "开仓保证金（初始）": ["faceValue", "contracts", "openPx", "leverage"],
            "维持保证金": ["faceValue", "contracts", "markPx", "mmRate"],
            "维持保证金率": ["side", "faceValue", "contracts", "openPx", "closePx", "markPx", "mmRate", "takerFee", "marginBalance"],
            "跨币种全仓维持保证金率": ["faceValue", "contracts", "markPx", "mmRate", "effectiveMargin", "reduceFee"],
            "仓位价值": ["faceValue", "contracts", "markPx"],
            "资金费用": ["faceValue", "contracts", "markPx", "fundingRate"],
            "预估强平价": ["side", "faceValue", "contracts", "openPx", "marginBalance", "mmRate", "liqFeeRate"]
        },
        "币本位合约": {
            "开仓均价": ["origQty", "origPrice", "newQty", "newPrice"],
            "手续费": ["faceValue", "contracts", "openPx", "closePx", "makerFee", "takerFee", "openRole", "closeRole"],
            "合约收益": ["side", "faceValue", "contracts", "openPx", "closePx"],
            "收益率": ["side", "faceValue", "contracts", "openPx", "closePx", "leverage"],
            "开仓保证金（初始）": ["faceValue", "contracts", "openPx", "leverage"],
            "维持保证金": ["faceValue", "contracts", "markPx", "mmRate"],
            "维持保证金率": ["side", "faceValue", "contracts", "openPx", "closePx", "markPx", "mmRate", "takerFee", "marginBalance"],
            "跨币种全仓维持保证金率": ["faceValue", "contracts", "markPx", "mmRate", "effectiveMargin", "reduceFee"],
            "仓位价值": ["faceValue", "contracts", "markPx"],
            "资金费用": ["faceValue", "contracts", "markPx", "fundingRate"],
            "预估强平价": ["side", "faceValue", "contracts", "openPx", "marginBalance", "mmRate", "liqFeeRate"]
        },
        "开仓均价 合约 U+币本": {
            "开仓均价": ["contractType", "faceValue", "origQty", "origPrice", "newQty", "newPrice"] 
        }
    };

    function initDOMElements() {
        const allIds = ["contractType", "calcItem", "side", "faceValue", "contracts", "openPx", "closePx", "leverage", "makerFee", "takerFee", "openRole", "closeRole", "liqFeeRate", "markPx", "fundingRate", "mmRate", "marginBalance", "effectiveMargin", "reduceFee", "origQty", "origPrice", "newQty", "newPrice", "btnCalc", "result", "hintText"];
        allIds.forEach(id => {
            $D[id] = $(id); 
        });
    }


    // ========== 工具函数 (核心计算逻辑不变) ==========

    function getVal(id) {
        const el = $D[id];
        if (!el || el.value === undefined) return null; 
        
        let v = el.value.trim();
        return v;
    }

    function getNum(id) {
        const el = $D[id];
        if (!el || el.value === undefined) return null; 
        
        let v = el.value.trim();
        if (!v) return null;
        v = v.replace(/,/g, "").replace(/，/g, "");
        const n = parseFloat(v);
        return Number.isFinite(n) ? n : null;
    }

    const pct = v => v / 100;

    function formatVal(v, d = 8) {
        if (!Number.isFinite(v)) return "-";
        return v.toFixed(d);
    }

    function row(k, v, d, suffix = "") {
        const t = formatVal(v, d);
        return `<div class="row-item"><span>${k}</span><span>${t}${suffix ? " " + suffix : ""}</span></div>`;
    }
    function rowBig(k, v, d, suffix = "") {
        const t = formatVal(v, d);
        return `<div class="row-item big"><span>${k}</span><span>${t}${suffix ? " " + suffix : ""}</span></div>`;
    }

    function calcOpenAvgPrice(face, origQty, origPrice, newQty, newPrice, cType) {
        if (origQty == null || origPrice == null || newQty == null || newPrice == null) return null;
        
        const totalQty = origQty + newQty;
        if (totalQty === 0) return null;
        
        if (cType === "币本位合约") {
            const totalValueTerm = (face * origQty / origPrice) + (face * newQty / newPrice);
            if (totalValueTerm === 0) return null;
            return (face * totalQty) / totalValueTerm;
        } else {
            return (origQty * origPrice + newQty * newPrice) / totalQty;
        }
    }


    // ========== 界面交互逻辑 (保持不变) ==========

    function refreshVisibleFields() {
        const cType = $D.contractType.value;
        const item = $D.calcItem.value;
        const requiredFields = (REQUIRED[cType] && REQUIRED[cType][item]) || [];
        const needSet = new Set(requiredFields);

        document.querySelectorAll("[data-field]").forEach(div => {
            const id = div.getAttribute("data-field");
            const isRequired = needSet.has(id);
            const isSideRequired = (id === 'side' && requiredFields.length > 0 && ['合约收益', '收益率', '预估强平价', '维持保证金率'].includes(item));
            
            div.style.display = (isRequired || isSideRequired) ? "flex" : "none";
        });

        // 隐藏/显示区块标题和区块本身
        ["basic", "fee", "mark", "margin", "openavg"].forEach(name => {
            const block = $(`block-${name}`);
            const title = $(`block-${name}-title`);
            if (!block) return;
            const hasVisible = Array.from(block.querySelectorAll("[data-field]"))
                .some(div => div.style.display !== "none");
            block.style.display = hasVisible ? "grid" : "none";
            if (title) title.style.display = hasVisible ? "block" : "none";
        });

        const hint = $D.hintText;
        if (!REQUIRED[cType] || !REQUIRED[cType][item]) {
            hint.textContent = "该合约类型下此项目暂未在网页中实现，请先使用 Excel 表。";
            hint.classList.remove('hint-error');
        } else {
            const needNames = requiredFields.map(id => FIELD_LABELS[id]).filter(Boolean);
            hint.textContent = needNames.length
                ? "当前项目需要填写的主要参数：" + needNames.join("、")
                : "";
            hint.classList.remove('hint-error');
        }

        $D.result.textContent = "参数更新后，请点击计算。";
    }

    function checkRequired(contractType, item) {
        const req = (REQUIRED[contractType] && REQUIRED[contractType][item]) || [];
        const missing = [];
        req.forEach(id => {
            const v = getVal(id); 

            if (v === null || v === "") { 
                missing.push(FIELD_LABELS[id] || id);
            }
        });
        
        // 核心修复：确保使用正确的 filter 函数
        return missing.filter(Boolean); 
    }


    // ========== 核心计算函数 (calcU, calcCoin) 保持不变) ==========

    function calcU(item, P) {
        const { side, face, ctt, open, close, lev, feeOpenRate, feeCloseRate, mark, fundPct, mmRate, liqRate, mb, effMargin, reduceFee, origQty, origPrice, newQty, newPrice } = P;
        const Unit = "USDT";
        let html = "";
        const P_C = face * ctt; 

        let pnl = null;
        if (open != null && close != null) {
            pnl = side === "long" ? P_C * (close - open) : P_C * (open - close);
        }

        let initMargin = null;
        if (open != null && lev != null && lev !== 0) {
            initMargin = P_C * open / lev;
        }

        const positionValue_mark = mark != null ? P_C * mark : null;

        let feeOpen = null, feeClose = null, feeTotal = null;
        if (open != null) feeOpen = P_C * open * feeOpenRate;
        if (close != null) feeClose = P_C * close * feeCloseRate;
        if (feeOpen != null || feeClose != null) feeTotal = (feeOpen || 0) + (feeClose || 0);

        let maintMargin = null;
        if (positionValue_mark != null && mmRate != null) {
            maintMargin = positionValue_mark * mmRate;
        }

        let marginRatioSingle = null;
        if (mb != null && pnl != null && positionValue_mark != null && mmRate != null) {
            const liqFee = pct(getNum("takerFee") || 0); 
            const denom = positionValue_mark * (mmRate + liqFee);
            if (denom !== 0) {
                marginRatioSingle = (mb + pnl) / denom * 100;
            }
        }

        let liqLong = null, liqShort = null;
        if (open != null && mb != null && mmRate != null && liqRate != null) {
            const pos = P_C; 
            
            const denomLong = pos * (1 - mmRate - liqRate); 
            if (denomLong !== 0) {
                liqLong = (pos * open - mb) / denomLong; 
            }
            
            const denomShort = pos * (1 + mmRate + liqRate); 
            if (denomShort !== 0) {
                liqShort = (pos * open + mb) / denomShort;
            }
        }

        const avgOpen = calcOpenAvgPrice(face, origQty, origPrice, newQty, newPrice, "U本位合约");

        switch (item) {
            case "开仓均价":
                html += `<div class="sub-title">开仓均价</div>`;
                html += rowBig("加权平均开仓均价", avgOpen, 8);
                break;
            case "手续费":
                html += `<div class="sub-title">手续费 (${Unit})</div>`;
                html += row("开仓手续费", feeOpen, 8);
                html += row("平仓手续费", feeClose, 8);
                html += rowBig("手续费合计", feeTotal, 8);
                break;
            case "合约收益":
                html += `<div class="sub-title">合约收益 (${Unit})</div>`;
                html += rowBig("合约收益（未扣手续费）", pnl, 8);
                break;
            case "收益率":
                html += `<div class="sub-title">收益与收益率</div>`;
                html += row("合约收益（未扣手续费）", pnl, 8, Unit);
                html += row("开仓保证金（初始）", initMargin, 8, Unit);
                const rate = initMargin ? pnl / initMargin * 100 : null;
                html += rowBig("收益率（收益 ÷ 开仓保证金）", rate, 4, "%");
                break;
            case "开仓保证金（初始）":
                html += `<div class="sub-title">开仓保证金（初始） (${Unit})</div>`;
                html += rowBig("开仓保证金", initMargin, 8);
                break;
            case "维持保证金":
                html += `<div class="sub-title">维持保证金 (${Unit})</div>`;
                html += row("仓位价值（标记价格）", positionValue_mark, 8, Unit);
                html += rowBig("维持保证金", maintMargin, 8);
                break;
            case "维持保证金率":
                html += `<div class="sub-title">单币种全仓保证金率</div>`;
                html += row("账户权益（MB + PnL）", (mb != null && pnl != null ? mb + pnl : null), 8, Unit);
                html += rowBig("保证金率", marginRatioSingle, 4, "%");
                break;
            case "跨币种全仓维持保证金率":
                html += `<div class="sub-title">跨币种全仓维持保证金率</div>`;
                html += row("维持保证金", maintMargin, 8);
                html += row("减仓手续费", reduceFee, 8);
                html += row("有效保证金", effMargin, 8);
                const marginRatioCross = effMargin != null && maintMargin != null ? effMargin / (maintMargin + (reduceFee || 0)) * 100 : null;
                html += rowBig("维持保证金率", marginRatioCross, 4, "%");
                break;
            case "仓位价值":
                html += `<div class="sub-title">仓位价值 (${Unit})</div>`;
                html += rowBig("仓位价值（面值×张数×标记价格）", positionValue_mark, 8);
                break;
            case "资金费用":
                html += `<div class="sub-title">资金费用 (${Unit})</div>`;
                const fundingFee = positionValue_mark != null && fundPct != null ? positionValue_mark * pct(fundPct) : null;
                html += row("仓位价值（标记价格）", positionValue_mark, 8, Unit);
                html += rowBig("资金费用（仓位价值×资金费率）", fundingFee, 8);
                break;
            case "预估强平价":
                html += `<div class="sub-title">预估强平价格</div>`;
                html += rowBig("多仓预估强平价", liqLong, 8);
                html += rowBig("空仓预估强平价", liqShort, 8);
                break;
            default:
                html += "该项目暂未实现，请先使用 Excel。";
        }

        return html;
    }

    function calcCoin(item, P) {
        const { side, face, ctt, open, close, lev, feeOpenRate, feeCloseRate, mark, fundPct, mmRate, liqRate, mb, effMargin, reduceFee, origQty, origPrice, newQty, newPrice } = P;
        const Unit = "币"; 
        let html = "";
        const P_C = face * ctt; 

        let posValue = null;
        if (mark != null && mark !== 0) {
            posValue = P_C / mark;
        }
        
        let pnl = null;
        if (open != null && close != null && open !== 0 && close !== 0) {
            pnl = side === "long" ? P_C * (1 / open - 1 / close) : P_C * (1 / close - 1 / open);
        }

        let initMargin = null;
        if (open != null && open !== 0 && lev != null && lev !== 0) {
            initMargin = P_C / open / lev;
        }

        let feeOpen = null, feeClose = null, feeTotal = null;
        if (open != null && open !== 0) feeOpen = P_C / open * feeOpenRate;
        if (close != null && close !== 0) feeClose = P_C / close * feeCloseRate;
        if (feeOpen != null || feeClose != null) feeTotal = (feeOpen || 0) + (feeClose || 0);

        let maintMargin = null;
        if (posValue != null && mmRate != null) {
            maintMargin = posValue * mmRate;
        }

        let marginRatioSingle = null;
        if (mb != null && pnl != null && posValue != null && mmRate != null) {
            const liqFee = pct(getNum("takerFee") || 0); 
            const denom = posValue * (mmRate + liqFee);
            if (denom !== 0) {
                marginRatioSingle = (mb + pnl) / denom * 100;
            }
        }

        let liqLong = null, liqShort = null;
        if (posValue != null && open != null && open !== 0 && mb != null && mmRate != null && liqRate != null) {
            const posCoinAtOpen = P_C / open;
            const feeRate = liqRate;

            const denomLong = mb + posCoinAtOpen; 
            if (denomLong !== 0) {
                liqLong = posValue * (mmRate + feeRate + 1) / denomLong; 
            }

            const denomShort = mb - posCoinAtOpen; 
            if (denomShort !== 0) {
                liqShort = posValue * (mmRate + feeRate - 1) / denomShort;
            }
        }

        const avgOpen = calcOpenAvgPrice(face, origQty, origPrice, newQty, newPrice, "币本位合约");

        switch (item) {
            case "开仓均价":
                html += `<div class="sub-title">开仓均价</div>`;
                html += rowBig("调和平均开仓均价", avgOpen, 8);
                break;
            case "手续费":
                html += `<div class="sub-title">手续费 (${Unit})</div>`;
                html += row("开仓手续费", feeOpen, 8);
                html += row("平仓手续费", feeClose, 8);
                html += rowBig("手续费合计", feeTotal, 8);
                break;
            case "合约收益":
                html += `<div class="sub-title">合约收益 (${Unit})</div>`;
                html += rowBig("合约收益（未扣手续费）", pnl, 8);
                break;
            case "收益率":
                html += `<div class="sub-title">收益与收益率</div>`;
                html += row("合约收益（未扣手续费）", pnl, 8, Unit);
                html += row("开仓保证金（初始）", initMargin, 8, Unit);
                const rate = initMargin ? pnl / initMargin * 100 : null;
                html += rowBig("收益率（收益 ÷ 开仓保证金）", rate, 4, "%");
                break;
            case "开仓保证金（初始）":
                html += `<div class="sub-title">开仓保证金（初始） (${Unit})</div>`;
                html += rowBig("开仓保证金", initMargin, 8);
                break;
            case "维持保证金":
                html += `<div class="sub-title">维持保证金 (${Unit})</div>`;
                html += row("仓位价值（面值×张数÷标记价格）", posValue, 8, Unit);
                html += rowBig("维持保证金", maintMargin, 8);
                break;
            case "维持保证金率":
                html += `<div class="sub-title">单币种全仓保证金率</div>`;
                html += row("账户权益（MB + PnL）", (mb != null && pnl != null ? mb + pnl : null), 8, Unit);
                html += rowBig("保证金率", marginRatioSingle, 4, "%");
                break;
            case "跨币种全仓维持保证金率":
                html += `<div class="sub-title">跨币种全仓维持保证金率</div>`;
                html += row("维持保证金", maintMargin, 8);
                html += row("减仓手续费", reduceFee, 8);
                html += row("有效保证金", effMargin, 8);
                const marginRatioCross = effMargin != null && maintMargin != null ? effMargin / (maintMargin + (reduceFee || 0)) * 100 : null;
                html += rowBig("维持保证金率", marginRatioCross, 4, "%");
                break;
            case "仓位价值":
                html += `<div class="sub-title">仓位价值 (${Unit})</div>`;
                html += rowBig("仓位价值", posValue, 8);
                break;
            case "资金费用":
                html += `<div class="sub-title">资金费用 (${Unit})</div>`;
                const fundingFee = posValue != null && fundPct != null ? posValue * pct(fundPct) : null;
                html += row("仓位价值", posValue, 8, Unit);
                html += rowBig("资金费用（仓位价值×资金费率）", fundingFee, 8);
                break;
            case "预估强平价":
                html += `<div class="sub-title">预估强平价格</div>`;
                html += rowBig("多仓预估强平价", liqLong, 8);
                html += rowBig("空仓预估强平价", liqShort, 8);
                break;
            default:
                html += "该项目暂未实现，请先使用 Excel。";
        }

        return html;
    }


    // ========== 主计算逻辑 ==========

    function doCalc() {
        const cType = $D.contractType.value;
        const item = $D.calcItem.value;
        const resEl = $D.result;
        const hintEl = $D.hintText;

        if (!REQUIRED[cType] || !REQUIRED[cType][item]) {
            resEl.textContent = "当前合约类型下，该项目暂未在网页中实现，请先使用 Excel。";
            hintEl.classList.remove('hint-error');
            return;
        }

        const missing = checkRequired(cType, item);
        if (missing.length > 0) {
            resEl.innerHTML = `<div class="sub-title" style="color:#FF5252;">⚠️ 必填参数缺失</div>`;
            hintEl.innerHTML = `<div style="color:#FF5252;">请先填写以下参数再计算：${missing.join("、")}</div>`;
            hintEl.classList.add('hint-error');
            return;
        }
        hintEl.classList.remove('hint-error');


        // 收集所有参数（使用加固后的 getNum 和 getVal）
        const params = {
            side: getVal("side"),
            face: getNum("faceValue"),
            ctt: Math.abs(getNum("contracts") || 0),
            open: getNum("openPx"),
            close: getNum("closePx"),
            lev: getNum("leverage"),
            makerPct: getNum("makerFee"),
            takerPct: getNum("takerFee"),
            openRole: getVal("openRole"),
            closeRole: getVal("closeRole"),
            mark: getNum("markPx"),
            fundPct: getNum("fundingRate"),
            mmRate: pct(getNum("mmRate") || 0),
            liqRate: pct(getNum("liqFeeRate") || 0),
            mb: getNum("marginBalance"),
            effMargin: getNum("effectiveMargin"),
            reduceFee: getNum("reduceFee"),
            origQty: getNum("origQty"),
            origPrice: getNum("origPrice"),
            newQty: getNum("newQty"),
            newPrice: getNum("newPrice")
        };
        
        const openRole = params.openRole || "taker"; 
        const closeRole = params.closeRole || "taker"; 

        params.maker = pct(params.makerPct || 0);
        params.taker = pct(params.takerPct || 0);
        
        params.feeOpenRate = openRole === "maker" ? params.maker : params.taker;
        params.feeCloseRate = closeRole === "maker" ? params.maker : params.taker; 


        let html = "";
        if (cType === "U本位合约") {
            html = calcU(item, params);
        } else if (cType === "币本位合约") {
            html = calcCoin(item, params);
        } else if (cType === "开仓均价 合约 U+币本") {
            if (item !== "开仓均价") {
                html = "“开仓均价 合约 U+币本” 表仅支持计算开仓均价，请将计算项目切换为【开仓均价】。";
            } else {
                const avgOpenU = calcOpenAvgPrice(params.face || 1, params.origQty, params.origPrice, params.newQty, params.newPrice, "U本位合约"); 
                const avgOpenCoin = calcOpenAvgPrice(params.face || 1, params.origQty, params.origPrice, params.newQty, params.newPrice, "币本位合约"); 
                html = `<div class="sub-title">U本位 (加权平均)</div>`;
                html += rowBig("U本位开仓均价", avgOpenU, 8);
                html += `<div class="sub-title">币本位 (调和平均)</div>`;
                html += rowBig("币本位开仓均价", avgOpenCoin, 8);
            }
        } else {
            html = "该合约类型暂未实现，请使用 Excel 表格版本。";
        }

        resEl.innerHTML = html;
        hintEl.textContent = "计算完成。";
    }

    // ========== 事件绑定与初始化 ==========
    initDOMElements(); 

    $D.contractType.addEventListener("change", refreshVisibleFields);
    $D.calcItem.addEventListener("change", refreshVisibleFields);
    $D.btnCalc.addEventListener("click", doCalc);

    refreshVisibleFields(); // 页面加载时执行一次
})();
