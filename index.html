// u_perp_calc.js
(function () {
  // ===== 注入样式 =====
  const style = document.createElement("style");
  style.textContent = `
  *{box-sizing:border-box;}
  body{
    margin:0;
    font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;
    background:radial-gradient(circle at top,#1b1535 0,#050713 55%,#02030a 100%);
    color:#f5f5f7;
  }
  .wrap{
    max-width:1120px;
    margin:32px auto 40px;
    padding:0 16px;
  }
  h1{
    margin:0 0 18px;
    font-size:24px;
    font-weight:700;
    letter-spacing:.4px;
    color:#f8fafc;
  }
  .subtitle{
    font-size:13px;
    color:#9ca3af;
    margin-bottom:18px;
  }
  .card{
    background:linear-gradient(145deg,rgba(21,26,40,.98),rgba(10,13,24,.98));
    border-radius:16px;
    padding:18px 20px 20px;
    border:1px solid rgba(148,163,184,.35);
    box-shadow:0 18px 40px rgba(0,0,0,.55);
  }
  .card + .card{
    margin-top:18px;
  }
  .card-title{
    font-size:15px;
    font-weight:650;
    margin-bottom:12px;
    display:flex;
    align-items:center;
    gap:6px;
  }
  .card-title::before{
    content:"";
    display:inline-block;
    width:4px;
    height:16px;
    border-radius:999px;
    background:linear-gradient(180deg,#fbbf24,#f97316);
  }
  label{
    font-size:12px;
    font-weight:600;
    margin-bottom:4px;
    display:block;
    color:#e5e7eb;
  }
  input,select{
    width:100%;
    padding:8px 10px;
    border-radius:10px;
    border:1px solid rgba(148,163,184,.55);
    background:rgba(15,23,42,.9);
    color:#f9fafb;
    font-size:13px;
    outline:none;
  }
  input::placeholder{color:#6b7280;}
  input:focus,select:focus{
    border-color:#fbbf24;
    box-shadow:0 0 0 1px #f97316;
  }
  .grid{
    display:grid;
    grid-template-columns:repeat(auto-fit,minmax(220px,1fr));
    gap:12px 14px;
  }
  .field{display:flex;flex-direction:column;}
  .btn-row{
    display:flex;
    justify-content:flex-end;
    margin-top:14px;
  }
  .calc-btn{
    min-width:120px;
    padding:9px 18px;
    border-radius:999px;
    border:none;
    cursor:pointer;
    font-size:14px;
    font-weight:700;
    letter-spacing:.3px;
    background:linear-gradient(135deg,#fbbf24,#f97316);
    color:#111827;
    box-shadow:0 10px 25px rgba(248,181,55,.45);
  }
  .calc-btn:hover{
    transform:translateY(-1px);
    box-shadow:0 14px 30px rgba(248,181,55,.65);
  }
  .result-block{
    margin-top:6px;
    padding:12px 14px;
    border-radius:14px;
    background:rgba(15,23,42,.96);
    border:1px solid rgba(75,85,99,.7);
    font-size:13px;
  }
  .row{
    display:flex;
    justify-content:space-between;
    margin-bottom:6px;
  }
  .row span:first-child{
    color:#9ca3af;
  }
  .row span:last-child{
    color:#e5e7eb;
    font-weight:600;
  }
  .row.big span:last-child{
    font-size:15px;
    color:#fef3c7;
  }
  @media(max-width:640px){
    .wrap{margin-top:20px;}
    h1{font-size:20px;}
  }
  `;
  document.head.appendChild(style);

  // ===== 注入 HTML 结构 =====
  document.body.innerHTML = `
    <div class="wrap">
      <h1>U本位合约盈亏 & 保证金计算器</h1>
      <div class="subtitle">适用于：手动输入手续费率（支持负数）、计算盈亏、保证金、资金费用与强平价。</div>

      <div class="card" id="card-input">
        <div class="card-title">交易与风险参数</div>
        <div class="grid">
          <div class="field">
            <label>方向</label>
            <select id="side">
              <option value="long">做多</option>
              <option value="short">做空</option>
            </select>
          </div>
          <div class="field">
            <label>面值</label>
            <input id="faceValue" type="text" inputmode="decimal" />
          </div>
          <div class="field">
            <label>开仓均价</label>
            <input id="openPx" type="text" inputmode="decimal" />
          </div>
          <div class="field">
            <label>平仓均价</label>
            <input id="closePx" type="text" inputmode="decimal" />
          </div>
          <div class="field">
            <label>张数</label>
            <input id="contracts" type="text" inputmode="decimal" />
          </div>
          <div class="field">
            <label>杠杆倍数</label>
            <input id="leverage" type="text" inputmode="decimal" />
          </div>

          <div class="field">
            <label>Maker 手续费（%）</label>
            <input id="makerFee" type="text" inputmode="decimal" placeholder="例如 -0.02" />
          </div>
          <div class="field">
            <label>Taker 手续费（%）</label>
            <input id="takerFee" type="text" inputmode="decimal" placeholder="例如 0.05" />
          </div>
          <div class="field">
            <label>开仓使用</label>
            <select id="openRole">
              <option value="maker">Maker</option>
              <option value="taker">Taker</option>
            </select>
          </div>
          <div class="field">
            <label>平仓使用</label>
            <select id="closeRole">
              <option value="maker">Maker</option>
              <option value="taker">Taker</option>
            </select>
          </div>

          <div class="field">
            <label>标记价格</label>
            <input id="markPx" type="text" inputmode="decimal" />
          </div>
          <div class="field">
            <label>资金费率（%）</label>
            <input id="fundingRate" type="text" inputmode="decimal" />
          </div>
          <div class="field">
            <label>维持保证金率（%）</label>
            <input id="mmRate" type="text" inputmode="decimal" />
          </div>
          <div class="field">
            <label>强平手续费率（%）</label>
            <input id="liqFeeRate" type="text" inputmode="decimal" />
          </div>
          <div class="field">
            <label>保证金余额</label>
            <input id="marginBalance" type="text" inputmode="decimal" />
          </div>
        </div>
        <div class="btn-row">
          <button class="calc-btn" id="btnCalc">计算</button>
        </div>
      </div>

      <div class="card">
        <div class="card-title">计算结果</div>
        <div id="result" class="result-block">
          请在上方填写参数后点击「计算」。
        </div>
      </div>
    </div>
  `;

  // ===== 计算逻辑 =====
  function getNum(id) {
    const el = document.getElementById(id);
    if (!el) return null;
    let v = el.value.trim();
    if (!v) return null;
    v = v.replace(/,/g, "").replace(/，/g, "");
    const n = parseFloat(v);
    return Number.isFinite(n) ? n : null;
  }
  const pct = (v) => v / 100;

  function calcU() {
    const side = document.getElementById("side").value;
    const face = getNum("faceValue");
    const open = getNum("openPx");
    const close = getNum("closePx");
    const ctt = getNum("contracts");
    const lev = getNum("leverage");

    const makerPct = getNum("makerFee");
    const takerPct = getNum("takerFee");
    const openRole = document.getElementById("openRole").value;
    const closeRole = document.getElementById("closeRole").value;

    const mark = getNum("markPx");
    const fundPct = getNum("fundingRate");
    const mmPct = getNum("mmRate");
    const liqPct = getNum("liqFeeRate");
    const mb = getNum("marginBalance");

    const resultEl = document.getElementById("result");

    if ([face, open, close, ctt, lev].some((v) => v === null)) {
      resultEl.innerHTML = "请至少填完：面值 / 开平价格 / 张数 / 杠杆，再点击计算。";
      return;
    }

    const absC = Math.abs(ctt);

    const maker = pct(makerPct || 0);
    const taker = pct(takerPct || 0);

    const feeOpenRate = openRole === "maker" ? maker : taker;
    const feeCloseRate = closeRole === "maker" ? maker : taker;

    // 开仓保证金
    const margin = face * absC * open / lev;

    // 未扣手续费盈亏
    let pnl;
    if (side === "long") {
      pnl = face * absC * (close - open);
    } else {
      pnl = face * absC * (open - close);
    }

    // 手续费
    const feeOpen = face * absC * open * feeOpenRate;
    const feeClose = face * absC * close * feeCloseRate;
    const feeTotal = feeOpen + feeClose;

    const net = pnl - feeTotal;
    const roe = margin !== 0 ? (net / margin) * 100 : 0;

    let html = "";
    html += row("开仓保证金", margin, 8);
    html += row("开仓手续费", feeOpen, 8);
    html += row("平仓手续费", feeClose, 8);
    html += row("总手续费", feeTotal, 8);
    html += row("盈亏（未扣手续费）", pnl, 8);
    html += rowBig("最终盈亏（含手续费）", net, 8);
    html += row("收益率 ROE", roe, 4, "%");

    // 仓位价值 + 资金费用
    if (mark !== null) {
      const posValue = face * absC * mark;
      html += row("仓位价值", posValue, 8);
      if (fundPct !== null) {
        const fundingFee = posValue * pct(fundPct);
        html += row("资金费用", fundingFee, 8);
      }
    }

    // 维持保证金
    if (mark !== null && mmPct !== null) {
      const maint = face * absC * mark * pct(mmPct);
      html += row("维持保证金", maint, 8);
    }

    // 强平价
    if (mb !== null && liqPct !== null) {
      const mm = pct(mmPct || 0);
      const lf = pct(liqPct || 0);
      const pos = face * absC;

      const denomLong = pos * (mm + lf - 1);
      if (denomLong !== 0) {
        const L = (mb - pos * open) / denomLong;
        html += row("多仓强平价", L, 8);
      }
      const denomShort = pos * (mm + lf + 1);
      if (denomShort !== 0) {
        const S = (mb + pos * open) / denomShort;
        html += row("空仓强平价", S, 8);
      }
    }

    resultEl.innerHTML = html;
  }

  function row(label, val, dec, suffix) {
    const v = Number.isFinite(val) ? val.toFixed(dec) : "-";
    const tail = suffix ? ` ${suffix}` : "";
    return `<div class="row"><span>${label}</span><span>${v}${tail}</span></div>`;
  }
  function rowBig(label, val, dec) {
    const v = Number.isFinite(val) ? val.toFixed(dec) : "-";
    return `<div class="row big"><span>${label}</span><span>${v}</span></div>`;
  }

  document.getElementById("btnCalc").addEventListener("click", calcU);
})();
