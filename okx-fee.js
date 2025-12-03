<div class="left-panel">

  <div class="section">
    <label>合约</label>
    <select id="instSelect" onchange="loadInst(this.value)">
      <option value="BTC-USDT-SWAP">BTC-USDT-SWAP</option>
      <option value="ETH-USDT-SWAP">ETH-USDT-SWAP</option>
      <option value="SOL-USDT-SWAP">SOL-USDT-SWAP</option>
      <!-- 你自己的清单可以继续加 -->
    </select>
  </div>

  <div class="section">
    <label>手续费模式</label>
    <select id="feeMode" onchange="mode=this.value">
      <option value="demo">示例手续费</option>
      <option value="api">实际费率(API)</option>
      <option value="manual">自定义</option>
    </select>
  </div>

  <div class="section" id="vipBox">
    <label>用户等级</label>
    <select id="vipLevel">
      <option>Regular</option>
      <option>VIP1</option>
      <option>VIP2</option>
      <option>VIP3</option>
      <option>VIP4</option>
      <option>VIP5</option>
      <option>VIP6</option>
      <option>VIP7</option>
      <option>VIP8</option>
      <option>VIP9</option>
    </select>
  </div>

  <div class="section" id="manualBox" style="display:none;">
    <label>Maker</label>
    <input id="manualMaker" type="number" step="0.00001"/>
    <label>Taker</label>
    <input id="manualTaker" type="number" step="0.00001"/>
  </div>

  <div class="section">
    <label>开仓类型</label>
    <select id="openRole">
      <option value="maker">Maker</option>
      <option value="taker">Taker</option>
    </select>
  </div>

  <div class="section">
    <label>平仓类型</label>
    <select id="closeRole">
      <option value="maker">Maker</option>
      <option value="taker">Taker</option>
    </select>
  </div>

  <div class="section">
    <label>数量</label>
    <input id="qtyInput" type="number" placeholder="输入数量">
  </div>

  <div class="section">
    <label>价格</label>
    <input id="priceInput" type="number" placeholder="输入价格">
  </div>

  <div class="section">
    <button onclick="calc()">计算</button>
  </div>

  <div class="section fee-group">
    <span id="feeGroupLabel">Group 未载入</span>
  </div>

</div>

<style>
.left-panel {
  width: 310px;
  padding: 15px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.section { display: flex; flex-direction: column; gap: 6px; }

label { font-size: 14px; font-weight: 600; }

select, input {
  padding: 8px 10px;
  border-radius: 6px;
  border: 1px solid #ddd;
  font-size: 14px;
}

button {
  padding: 10px;
  font-size: 15px;
  font-weight: bold;
  background: #0068ff;
  color: #fff;
  border: none;
  border-radius: 6px;
  cursor: pointer;
}

button:hover { opacity: 0.9; }

.fee-group {
  text-align: center;
  font-weight: bold;
  color: #666;
}
</style>
