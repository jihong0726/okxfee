// u_perp_calc.js（最终版：左右双栏、不滚动、Bybit 风格紧凑UI）
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
    margin-bottom:14px;
  }

  /* ===== 两栏布局 ===== */
  .row-2col{
    display:grid;
    grid-template-columns: 1fr 380px;
    gap:16px;
    align-items:start;
  }

  /* 左右栏卡片 */
  .card{
    background:#111726;
    border-radius:12px;
    padding:14px 16px 16px;
    border:1px solid rgba(255,255,255,0.06);
  }

  /* 标题 */
  .card-title{
    font-size:14px;
    font-weight:650;
    margin-bottom:6px;
    color:#fff;
  }
  .block-title{
    font-size:12px;
    font-weight:600;
    margin:10px 0 4px;
    color:#e5e7eb;
  }

  /* 表单样式 */
  .grid{
    display:grid;
    grid-template-columns:repeat(auto-fit,minmax(160px,1fr));
    gap:10px 12px;
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
    margin-top:12px;
    padding:8px 12px;
    border-radius:8px;
    border:none;
    cursor:pointer;
    font-size:13px;
    font-weight:700;
    background:linear-gradient(135deg,#fbbf24,#f97316);
    color:#111827;
  }

  /* 右边结果区 */
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

  /* 手机适配 */
  @media(max-width:900px){
    .row-2col{
      grid-template-columns:1fr;
    }
  }
  `;
  document.head.appendChild(style);

  // ===== 页面结构（自动注入 HTML） =====
  document.body.innerHTML = `
    <div class="wrap">
      <h1>U 本位合约计算器</h1>
      <div class="subtitle">盈亏、保证金、手续费、资金费用、强平价，一次看完</div>

      <div class="row-2col">

        <!-- 左边：输入参数 -->
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

          <div class="block-title">手续费（可负数，%）</div>
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

          <div class="block-title">资金费用 / 仓位参数</div>
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

        <!-- 右边：结果 -->
        <div class="card">
          <div class="card-title">计算结果</div>
          <div id="result">请填写左侧参数后点击计算</div>
        </div>

      </div>
    </div>
  `;

  // ===== 工具函数 =====
  const get = id => {
    const el = document.getElementById(id);
    if (!el) return null;
    let v = el.value.trim();
    if (!v) return null;
    v = v.replace(/,/g, "").replace(/，/g, "");
    const n = parseFloat(v);
    return Number.isFinite(n) ? n : null;
  };
  const pct = v => v / 100;

  // ===== 主计算 =====
  function calcU() {
    const side = document.getElementById("side").value;
    const face = get("faceValue");
    const open = get("openPx");
    const close = get("closePx");
    const ctt = get("contracts");
    const lev = get("leverage");

    const makerPct = get("makerFee");
    const takerPct = get("takerFee");
    const openRole = document.getElementById("openRole").value;
    const closeRole = document.getElementById("closeRole").value;

    const mark = get("markPx");
    const fundPct = get("fundingRate");
    const mmPct = get("mmRate");
    const liqPct = get("liqFeeRate");
    const mb = get("marginBalance");

    const resultEl = document.getElementById("result");

    if ([face, open, close, ctt, lev].some(v => v === null)) {
      resultEl.innerHTML = "请输入面值、价格、张数、杠杆后再计算";
      return;
    }

    const absC = Math.abs(ctt);

    const maker = pct(makerPct || 0);
    const taker = pct(takerPct || 0);

    const feeOpenRate = openRole === "maker" ? maker : taker;
    const feeCloseRate = closeRole === "maker" ? maker : taker;

    // 開倉保證金
    const margin = face * absC * open / lev;

    // 未扣手續費盈虧
    let pnl = side === "long"
      ? face * absC * (close - open)
      : face * absC * (open - close);

    // 手續費
    const feeOpen = face * absC * open * feeOpenRate;
    const feeClose = face * absC * close * feeCloseRate;
    const feeTotal = feeOpen + feeClose;

    const net = pnl - feeTotal;
    const rate = margin !== 0 ? (net / margin) * 100 : 0;

    let html = ``;

    // ===== ① 收益与手续费 =====
    html += `<div class="sub-title">一、收益与手续费</div>`;
    html += row("开仓所需保证金", margin, 8);
    html += row("开仓手续费", feeOpen, 8);
    html += row("平仓手续费", feeClose, 8);
    html += row("手续费合计", feeTotal, 8);
    html += row("盈亏（未扣手续费）", pnl, 8);
    html += rowBig("实际盈亏（含手续费）", net, 8);
    html += row("收益率（以开仓保证金）", rate, 4, "%");

    // ===== ② 资金费用 / 仓位价值 =====
    if (mark !== null || fundPct !== null) {
      html += `<div class="sub-title">二、资金费用与仓位价值</div>`;
    }

    if (mark !== null) {
      const posValue = face * absC * mark;
      html += row("当前仓位名义价值", posValue, 8);

      if (fundPct !== null) {
        const fundingFee = posValue * pct(fundPct);
        html += row("单次资金费用", fundingFee, 8);
      }
    }

    // ===== ③ 强平相关 =====
    if ((mark !== null && mmPct !== null) || (mb !== null && liqPct !== null)) {
      html += `<div class="sub-title">三、维持保证金与预估强平价格</div>`;
    }

    if (mark !== null && mmPct !== null) {
      const maint = face * absC * mark * pct(mmPct);
      html += row("维持保证金", maint, 8);
    }

    if (mb !== null && liqPct !== null) {
      const mm = pct(mmPct || 0);
      const lf = pct(liqPct || 0);
      const pos = face * absC;

      const denomLong = pos * (mm + lf - 1);
      if (denomLong !== 0) {
        const L = (mb - pos * open) / denomLong;
        html += row("多仓预估强平价格", L, 8);
      }
      const denomShort = pos * (mm + lf + 1);
      if (denomShort !== 0) {
        const S = (mb + pos * open) / denomShort;
        html += row("空仓预估强平价格", S, 8);
      }
    }

    resultEl.innerHTML = html;
  }

  // ===== 输出格式 =====
  function row(k, v, d, suf) {
    const t = Number.isFinite(v) ? v.toFixed(d) : "-";
    return `<div class="row-item"><span>${k}</span><span>${t}${suf ? " "+suf : ""}</span></div>`;
  }
  function rowBig(k, v, d) {
    const t = Number.isFinite(v) ? v.toFixed(d) : "-";
    return `<div class="row-item big"><span>${k}</span><span>${t}</span></div>`;
  }

  document.getElementById("btnCalc").addEventListener("click", calcU);
})();
