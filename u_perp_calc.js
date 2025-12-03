// u_perp_calc.js 带标签页版本（按 Excel 小标题拆分：收益 / 维持保证金 / 强平价格 / 资金费用 / 全部）
(function () {
  // ===== 样式 =====
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
    max-width:1260px;
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

  /* 标签栏 */
  .tabs{
    display:inline-flex;
    padding:3px;
    border-radius:999px;
    background:#151a2a;
    margin-bottom:12px;
  }
  .tab-btn{
    border:none;
    padding:6px 14px;
    font-size:12px;
    border-radius:999px;
    background:transparent;
    color:#9ca3af;
    cursor:pointer;
    white-space:nowrap;
  }
  .tab-btn.active{
    background:linear-gradient(135deg,#fbbf24,#f97316);
    color:#111827;
    font-weight:700;
  }

  /* 两栏布局 */
  .row-2col{
    display:grid;
    grid-template-columns: 1fr 380px;
    gap:16px;
    align-items:start;
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

  /* 表单 */
  .grid{
    display:grid;
    grid-template-columns:repeat(auto-fit,minmax(160px,1fr));
    gap:8px 10px;
  }
  label{
    font-size:11px;
    margin-bottom:3px;
    color:#cbd5e1;
  }
  input,select{
    width:100%;
    padding:6px 8px;
    border-radius:8px;
    border:1px solid rgba(148,163,184,.45);
    background:#0f172a;
    color:#f9fafb;
    font-size:12px;
  }
  input:focus,select:focus{
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

  /* 结果区 */
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

  @media(max-width:900px){
    .row-2col{grid-template-columns:1fr;}
  }
  `;
  document.head.appendChild(style);

  // ===== 页面结构 =====
  document.body.innerHTML = `
    <div class="wrap">
      <h1>U 本位合约计算器</h1>
      <div class="subtitle">根据 Excel 公式计算：收益、保证金、资金费用与预估强平价格。</div>

      <div class="tabs">
        <button class="tab-btn active" data-tab="profit">收益</button>
        <button class="tab-btn" data-tab="margin">维持保证金</button>
        <button class="tab-btn" data-tab="liq">强平价格</button>
        <button class="tab-btn" data-tab="funding">资金费用</button>
        <button class="tab-btn" data-tab="all">全部</button>
      </div>

      <div class="row-2col">
        <!-- 左：输入 -->
        <div class="card">
          <div class="card-title">参数填写</div>

          <div class="block-title">基础参数</div>
          <div class="grid">
            <div>
              <label>方向</label>
              <select id="side">
                <option value="long">做多</option>
                <option value="short">做空</option>
              </select>
            </div>
            <div>
              <label>面值</label>
              <input id="faceValue" type="text">
            </div>
            <div>
              <label>开仓均价</label>
              <input id="openPx" type="text">
            </div>
            <div>
              <label>平仓均价</label>
              <input id="closePx" type="text">
            </div>
            <div>
              <label>张数</label>
              <input id="contracts" type="text">
            </div>
            <div>
              <label>杠杆倍数</label>
              <input id="leverage" type="text">
            </div>
          </div>

          <div class="block-title">手续费（可为负，单位：%）</div>
          <div class="grid">
            <div>
              <label>挂单手续费（%）</label>
              <input id="makerFee" type="text">
            </div>
            <div>
              <label>吃单手续费（%）</label>
              <input id="takerFee" type="text">
            </div>
            <div>
              <label>开仓使用费率</label>
              <select id="openRole">
                <option value="maker">挂单</option>
                <option value="taker">吃单</option>
              </select>
            </div>
            <div>
              <label>平仓使用费率</label>
              <select id="closeRole">
                <option value="maker">挂单</option>
                <option value="taker">吃单</option>
              </select>
            </div>
          </div>

          <div class="block-title">资金费用 / 仓位</div>
          <div class="grid">
            <div>
              <label>标记价格</label>
              <input id="markPx" type="text">
            </div>
            <div>
              <label>资金费率（%）</label>
              <input id="fundingRate" type="text">
            </div>
          </div>

          <div class="block-title">强平相关</div>
          <div class="grid">
            <div>
              <label>维持保证金率（%）</label>
              <input id="mmRate" type="text">
            </div>
            <div>
              <label>强平手续费率（%）</label>
              <input id="liqFeeRate" type="text">
            </div>
            <div>
              <label>保证金余额</label>
              <input id="marginBalance" type="text">
            </div>
          </div>

          <button class="calc-btn" id="btnCalc">计算</button>
        </div>

        <!-- 右：结果 -->
        <div class="card">
          <div class="card-title">计算结果</div>
          <div id="result">请先在左侧填写参数并点击“计算”。</div>
        </div>
      </div>
    </div>
  `;

  // ===== 工具函数 =====
  const getNum = id => {
    const el = document.getElementById(id);
    if (!el) return null;
    let v = el.value.trim();
    if (!v) return null;
    v = v.replace(/,/g,"").replace(/，/g,"");
    const n = parseFloat(v);
    return Number.isFinite(n) ? n : null;
  };
  const pct = v => v / 100;

  let activeTab = "profit";
  let lastCalc = null;

  // ===== 结果渲染（按标签切换展示内容） =====
  function renderResult(c) {
    const el = document.getElementById("result");
    if (!c) {
      el.innerHTML = "请先在左侧填写参数并点击“计算”。";
      return;
    }

    let html = "";

    if (activeTab === "profit" || activeTab === "all") {
      html += `<div class="sub-title">一、收益与手续费</div>`;
      html += row("开仓所需保证金", c.margin, 8);
      html += row("开仓手续费", c.feeOpen, 8);
      html += row("平仓手续费", c.feeClose, 8);
      html += row("手续费合计", c.feeTotal, 8);
      html += row("盈亏（未扣手续费）", c.pnl, 8);
      html += rowBig("实际盈亏（含手续费）", c.net, 8);
      html += row("收益率（以开仓保证金为基准）", c.rate, 4, "%");
    }

    if (activeTab === "margin" || activeTab === "all") {
      html += `<div class="sub-title">二、维持保证金</div>`;
      if (c.maint != null) {
        html += row("维持保证金", c.maint, 8);
      } else {
        html += `<div class="row-item"><span>提示</span><span>如需计算维持保证金，请填写标记价格和维持保证金率。</span></div>`;
      }
    }

    if (activeTab === "liq" || activeTab === "all") {
      html += `<div class="sub-title">三、预估强平价格</div>`;
      if (c.liqLong != null || c.liqShort != null) {
        if (c.liqLong != null)  html += row("多仓预估强平价格", c.liqLong, 8);
        if (c.liqShort != null) html += row("空仓预估强平价格", c.liqShort, 8);
      } else {
        html += `<div class="row-item"><span>提示</span><span>如需计算强平价格，请填写保证金余额、维持保证金率与强平手续费率。</span></div>`;
      }
    }

    if (activeTab === "funding" || activeTab === "all") {
      html += `<div class="sub-title">四、资金费用与仓位价值</div>`;
      if (c.posValue != null) {
        html += row("当前仓位名义价值", c.posValue, 8);
        if (c.fundingFee != null) {
          html += row("单次资金费用", c.fundingFee, 8);
        } else {
          html += `<div class="row-item"><span>提示</span><span>如需计算资金费用，请填写资金费率。</span></div>`;
        }
      } else {
        html += `<div class="row-item"><span>提示</span><span>如需计算仓位价值与资金费用，请填写标记价格。</span></div>`;
      }
    }

    if (!html) {
      html = "当前标签下没有可展示的结果，请先在左侧补充参数并点击“计算”。";
    }

    el.innerHTML = html;
  }

  function row(k,v,d,suffix){
    const t = Number.isFinite(v) ? v.toFixed(d) : "-";
    return `<div class="row-item"><span>${k}</span><span>${t}${suffix ? " "+suffix : ""}</span></div>`;
  }
  function rowBig(k,v,d){
    const t = Number.isFinite(v) ? v.toFixed(d) : "-";
    return `<div class="row-item big"><span>${k}</span><span>${t}</span></div>`;
  }

  // ===== 计算逻辑（依然严格按照 Excel 公式） =====
  function calcU(){
    const side = document.getElementById("side").value;
    const face = getNum("faceValue");
    const open = getNum("openPx");
    const close = getNum("closePx");
    const ctt = getNum("contracts");
    const lev  = getNum("leverage");

    const makerPct = getNum("makerFee");
    const takerPct = getNum("takerFee");
    const openRole  = document.getElementById("openRole").value;
    const closeRole = document.getElementById("closeRole").value;

    const mark   = getNum("markPx");
    const fundPct= getNum("fundingRate");
    const mmPct  = getNum("mmRate");
    const liqPct = getNum("liqFeeRate");
    const mb     = getNum("marginBalance");

    if ([face,open,close,ctt,lev].some(v => v===null)){
      lastCalc = null;
      renderResult(null);
      return;
    }

    const absC = Math.abs(ctt);

    const maker = pct(makerPct || 0);
    const taker = pct(takerPct || 0);
    const feeOpenRate  = openRole==="maker" ? maker : taker;
    const feeCloseRate = closeRole==="maker" ? maker : taker;

    // 开仓保证金
    const margin = face * absC * open / lev;

    // 合约收益
    let pnl;
    if(side==="long"){
      pnl = face * absC * (close - open);
    }else{
      pnl = face * absC * (open - close);
    }

    // 手续费
    const feeOpen  = face * absC * open  * feeOpenRate;
    const feeClose = face * absC * close * feeCloseRate;
    const feeTotal = feeOpen + feeClose;

    const net  = pnl - feeTotal;
    const rate = margin !== 0 ? (net / margin) * 100 : 0;

    // 仓位价值 + 资金费
    let posValue = null, fundingFee = null;
    if (mark != null){
      posValue = face * absC * mark;
      if (fundPct != null){
        fundingFee = posValue * pct(fundPct);
      }
    }

    // 维持保证金
    let maint = null;
    if (mark != null && mmPct != null){
      maint = face * absC * mark * pct(mmPct);
    }

    // 强平价格
    let liqLong = null, liqShort = null;
    if (mb != null && liqPct != null){
      const mm = pct(mmPct || 0);
      const lf = pct(liqPct || 0);
      const pos = face * absC;

      const denomLong = pos * (mm + lf - 1);
      if (denomLong !== 0){
        liqLong = (mb - pos*open) / denomLong;
      }
      const denomShort = pos * (mm + lf + 1);
      if (denomShort !== 0){
        liqShort = (mb + pos*open) / denomShort;
      }
    }

    lastCalc = {
      margin, pnl, feeOpen, feeClose, feeTotal, net, rate,
      posValue, fundingFee, maint, liqLong, liqShort
    };
    renderResult(lastCalc);
  }

  // ===== 事件绑定 =====
  document.getElementById("btnCalc").addEventListener("click", calcU);

  document.querySelectorAll(".tab-btn").forEach(btn=>{
    btn.addEventListener("click",()=>{
      document.querySelectorAll(".tab-btn").forEach(b=>b.classList.remove("active"));
      btn.classList.add("active");
      activeTab = btn.getAttribute("data-tab");
      renderResult(lastCalc);
    });
  });
})();
