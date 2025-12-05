js = r"""
document.addEventListener('DOMContentLoaded', function () {
  const calcTabsEl = document.querySelector('.calc-tabs');
  const formTitleEl = document.querySelector('.form-title');
  const formDescEl = document.querySelector('.form-desc');
  const formFieldsEl = document.querySelector('.form-fields');
  const resultMainEl = document.getElementById('resultMain');
  const formulaBaseEl = document.getElementById('formulaBase');
  const formulaNumericEl = document.getElementById('formulaNumeric');
  const btnCalc = document.getElementById('btnCalc');
  const btnClear = document.getElementById('btnClear');
  const tipEl = document.querySelector('.form-tip');
  const versionEl = document.getElementById('versionText');

  const version = 'v1.0（示例）';
  if (versionEl) versionEl.textContent = '版本：' + version;

  function toNumber(v) {
    if (v === null || v === undefined) return NaN;
    if (typeof v === 'number') return v;
    v = String(v).trim().replace(/,/g, '');
    if (!v) return NaN;
    return Number(v);
  }

  function fmtNum(v, digits) {
    if (!isFinite(v)) return '--';
    return v.toFixed(digits != null ? digits : 4);
  }

  function fmtPct(v, digits) {
    if (!isFinite(v)) return '--';
    return (v * 100).toFixed(digits != null ? digits : 2) + ' %';
  }

  function makeInputRow(field) {
    const row = document.createElement('div');
    row.className = 'field-row';

    const label = document.createElement('label');
    label.className = 'field-label';
    label.textContent = field.label;

    const inputWrap = document.createElement('div');
    inputWrap.className = 'field-input-wrap';

    let input;
    if (field.type === 'select') {
      input = document.createElement('select');
      for (const opt of field.options) {
        const o = document.createElement('option');
        o.value = opt.value;
        o.textContent = opt.label;
        input.appendChild(o);
      }
    } else {
      input = document.createElement('input');
      input.type = 'text';
      input.inputMode = 'decimal';
      input.placeholder = field.placeholder || '';
    }
    input.id = field.id;
    input.className = 'field-input';

    inputWrap.appendChild(input);

    if (field.unit) {
      const unitSpan = document.createElement('span');
      unitSpan.className = 'field-unit';
      unitSpan.textContent = field.unit;
      inputWrap.appendChild(unitSpan);
    }

    row.appendChild(label);
    row.appendChild(inputWrap);
    return row;
  }

  const calcs = {
    avgOpen: {
      key: 'avgOpen',
      name: '开仓均价',
      desc: '输入合约面值、原持仓张数和均价、新增张数和成交均价，计算新的整体开仓均价。',
      fields: [
        { id: 'faceValue', label: '合约面值', placeholder: '例如 0.1', unit: '币' },
        { id: 'oldQty', label: '原持仓张数', placeholder: '例如 100', unit: '张' },
        { id: 'oldPrice', label: '原持仓均价', placeholder: '例如 1000', unit: 'USDT' },
        { id: 'newQty', label: '新开仓张数', placeholder: '例如 50', unit: '张' },
        { id: 'newPrice', label: '新成交均价', placeholder: '例如 1200', unit: 'USDT' }
      ],
      compute(values) {
        const face = toNumber(values.faceValue);
        const oldQty = toNumber(values.oldQty);
        const oldPrice = toNumber(values.oldPrice);
        const newQty = toNumber(values.newQty);
        const newPrice = toNumber(values.newPrice);

        if ([face, oldQty, oldPrice, newQty, newPrice].some(v => !isFinite(v))) {
          throw new Error('请把所有输入项填写完整（只能输入数字）。');
        }
        const totalQty = oldQty + newQty;
        if (!totalQty) throw new Error('原持仓张数 + 新开仓张数 不能为 0。');

        const num = face * oldQty * oldPrice + face * newQty * newPrice;
        const den = face * totalQty;
        const avg = num / den;

        const result = '新的开仓均价 ≈ ' + fmtNum(avg, 4) + ' USDT';

        const baseFormula =
          '开仓均价 = （合约面值 × 原持仓张数 × 原持仓均价 + 合约面值 × 新开仓张数 × 新成交均价） ÷ （合约面值 × (原持仓张数 + 新开仓张数)）';

        const numericFormula =
          '开仓均价 = (' +
          face + ' × ' + oldQty + ' × ' + oldPrice +
          ' + ' + face + ' × ' + newQty + ' × ' + newPrice +
          ') ÷ (' + face + ' × (' + oldQty + ' + ' + newQty + '))' +
          ' ≈ ' + fmtNum(avg, 4) + ' USDT';

        return { result, baseFormula, numericFormula };
      }
    },

    fee: {
      key: 'fee',
      name: '手续费',
      desc: '根据合约面值、张数、成交均价和手续费率，计算本次交易手续费金额。',
      fields: [
        { id: 'faceValue', label: '合约面值', placeholder: '例如 0.1', unit: '币' },
        { id: 'qty', label: '合约张数', placeholder: '例如 100', unit: '张' },
        { id: 'price', label: '成交均价', placeholder: '例如 1000', unit: 'USDT' },
        { id: 'feeRate', label: '手续费率', placeholder: '例如 0.0002', unit: '' }
      ],
      compute(values) {
        const face = toNumber(values.faceValue);
        const qty = toNumber(values.qty);
        const price = toNumber(values.price);
        const feeRate = toNumber(values.feeRate);
        if ([face, qty, price, feeRate].some(v => !isFinite(v))) {
          throw new Error('请把所有输入项填写完整（只能输入数字）。');
        }
        const fee = face * qty * price * feeRate;
        const result = '本次交易手续费 ≈ ' + fmtNum(fee, 4) + ' USDT';

        const baseFormula =
          '手续费 = 合约面值 × 合约张数 × 成交均价 × 手续费率';

        const numericFormula =
          '手续费 = ' + face + ' × ' + qty + ' × ' + price + ' × ' + feeRate +
          ' ≈ ' + fmtNum(fee, 4) + ' USDT';

        return { result, baseFormula, numericFormula };
      }
    },

    profit: {
      key: 'profit',
      name: '合约收益 / 收益率',
      desc: '输入多空方向、合约面值、张数、开仓价、平仓价和杠杆，计算合约收益与收益率。',
      fields: [
        { id: 'side', label: '持仓方向', type: 'select', options: [
          { value: 'long', label: '多仓' },
          { value: 'short', label: '空仓' }
        ]},
        { id: 'faceValue', label: '合约面值', placeholder: '例如 0.1', unit: '币' },
        { id: 'qty', label: '合约张数', placeholder: '例如 100', unit: '张' },
        { id: 'openPrice', label: '开仓均价', placeholder: '例如 1000', unit: 'USDT' },
        { id: 'closePrice', label: '平仓均价', placeholder: '例如 1200', unit: 'USDT' },
        { id: 'leverage', label: '杠杆倍数', placeholder: '例如 10', unit: '倍' }
      ],
      compute(values) {
        const side = values.side || 'long';
        const face = toNumber(values.faceValue);
        const qty = toNumber(values.qty);
        const openP = toNumber(values.openPrice);
        const closeP = toNumber(values.closePrice);
        const lev = toNumber(values.leverage);
        if ([face, qty, openP, closeP, lev].some(v => !isFinite(v))) {
          throw new Error('请把除方向以外的输入项填写完整。');
        }
        const dir = side === 'short' ? -1 : 1;
        const profit = face * qty * (closeP - openP) * dir;
        const margin = face * qty * openP / lev;
        const roi = profit / margin;

        const result =
          '合约收益 ≈ ' + fmtNum(profit, 4) + ' USDT\\n' +
          '收益率 ≈ ' + fmtPct(roi, 2);

        const baseFormula =
          '合约收益 = 合约面值 × 合约张数 × (平仓均价 - 开仓均价) × 多空方向\\n' +
          '收益率 = 合约收益 ÷ (合约面值 × 开仓张数 × 开仓均价 ÷ 杠杆倍数)';

        const numericFormula =
          '合约收益 = ' + face + ' × ' + qty + ' × (' + closeP + ' - ' + openP + ') × ' + (dir === 1 ? '多仓(+1)' : '空仓(-1)') +
          ' ≈ ' + fmtNum(profit, 4) + ' USDT\\n' +
          '收益率 = ' + fmtNum(profit, 4) + ' ÷ (' + face + ' × ' + qty + ' × ' + openP + ' ÷ ' + lev + ')' +
          ' ≈ ' + fmtPct(roi, 2);

        return { result, baseFormula, numericFormula };
      }
    },

    initialMargin: {
      key: 'initialMargin',
      name: '开仓保证金（初始）',
      desc: '根据合约面值、开仓张数、开仓价格和杠杆倍数，计算初始开仓保证金。',
      fields: [
        { id: 'faceValue', label: '合约面值', placeholder: '例如 0.1', unit: '币' },
        { id: 'qty', label: '开仓张数', placeholder: '例如 100', unit: '张' },
        { id: 'openPrice', label: '开仓价格', placeholder: '例如 1000', unit: 'USDT' },
        { id: 'leverage', label: '杠杆倍数', placeholder: '例如 10', unit: '倍' }
      ],
      compute(values) {
        const face = toNumber(values.faceValue);
        const qty = toNumber(values.qty);
        const openP = toNumber(values.openPrice);
        const lev = toNumber(values.leverage);
        if ([face, qty, openP, lev].some(v => !isFinite(v))) {
          throw new Error('请把所有输入项填写完整。');
        }
        const margin = face * qty * openP / lev;
        const result = '开仓初始保证金 ≈ ' + fmtNum(margin, 4) + ' USDT';

        const baseFormula =
          '开仓保证金（初始） = 合约面值 × 开仓张数 × 开仓价格 ÷ 杠杆倍数';

        const numericFormula =
          '开仓保证金（初始） = ' + face + ' × ' + qty + ' × ' + openP + ' ÷ ' + lev +
          ' ≈ ' + fmtNum(margin, 4) + ' USDT';

        return { result, baseFormula, numericFormula };
      }
    },

    maintMargin: {
      key: 'maintMargin',
      name: '维持保证金',
      desc: '根据合约面值、合约张数、标记价格和维持保证金率，计算当前维持保证金。',
      fields: [
        { id: 'faceValue', label: '合约面值', placeholder: '例如 0.1', unit: '币' },
        { id: 'qty', label: '合约张数', placeholder: '例如 100', unit: '张' },
        { id: 'markPrice', label: '标记价格', placeholder: '例如 1000', unit: 'USDT' },
        { id: 'maintRate', label: '维持保证金率', placeholder: '例如 0.005', unit: '' }
      ],
      compute(values) {
        const face = toNumber(values.faceValue);
        const qty = toNumber(values.qty);
        const markP = toNumber(values.markPrice);
        const rate = toNumber(values.maintRate);
        if ([face, qty, markP, rate].some(v => !isFinite(v))) {
          throw new Error('请把所有输入项填写完整。');
        }
        const mm = face * qty * markP * rate;
        const result = '维持保证金 ≈ ' + fmtNum(mm, 4) + ' USDT';

        const baseFormula =
          '维持保证金 = 合约面值 × 合约张数 × 标记价格 × 维持保证金率';

        const numericFormula =
          '维持保证金 = ' + face + ' × ' + qty + ' × ' + markP + ' × ' + rate +
          ' ≈ ' + fmtNum(mm, 4) + ' USDT';

        return { result, baseFormula, numericFormula };
      }
    },

    maintRate: {
      key: 'maintRate',
      name: '维持保证金率 / 风险度',
      desc: '根据保证金余额、收益、合约规模、标记价格以及维保率和手续费率，估算当前维持保证金率（风险度）。',
      fields: [
        { id: 'balance', label: '保证金余额', placeholder: '例如 1000', unit: 'USDT' },
        { id: 'profit', label: '已实现 / 未实现收益', placeholder: '例如 50', unit: 'USDT' },
        { id: 'faceValue', label: '合约面值', placeholder: '例如 0.1', unit: '币' },
        { id: 'qty', label: '合约张数（含符号）', placeholder: '例如 100，做空填负数', unit: '张' },
        { id: 'markPrice', label: '标记价格', placeholder: '例如 1000', unit: 'USDT' },
        { id: 'maintRate', label: '维持保证金率', placeholder: '例如 0.005', unit: '' },
        { id: 'feeRate', label: '手续费率', placeholder: '例如 0.0005', unit: '' }
      ],
      compute(values) {
        const bal = toNumber(values.balance);
        const profit = toNumber(values.profit);
        const face = toNumber(values.faceValue);
        const qty = toNumber(values.qty);
        const markP = toNumber(values.markPrice);
        const maintR = toNumber(values.maintRate);
        const feeR = toNumber(values.feeRate);
        if ([bal, profit, face, qty, markP, maintR, feeR].some(v => !isFinite(v))) {
          throw new Error('请把所有输入项填写完整。');
        }

        const denom = face * Math.abs(qty) * markP * (maintR + feeR);
        if (!denom) throw new Error('分母为 0，请检查面值、张数、标记价格、维保率和手续费率。');

        const rate = (bal + profit) / denom;

        const result = '维持保证金率（风险度） ≈ ' + fmtPct(rate, 4);

        const baseFormula =
          '维持保证金率 = (保证金余额 + 收益) ÷ [合约面值 × |合约张数| × 标记价格 × (维持保证金率 + 手续费率)]';

        const numericFormula =
          '维持保证金率 = (' + bal + ' + ' + profit + ') ÷ [' +
          face + ' × ' + Math.abs(qty) + ' × ' + markP +
          ' × (' + maintR + ' + ' + feeR + ')]' +
          ' ≈ ' + fmtPct(rate, 4);

        return { result, baseFormula, numericFormula };
      }
    },

    crossMaintRate: {
      key: 'crossMaintRate',
      name: '跨币种全仓维持保证金率',
      desc: '根据有效保证金、维持保证金和减仓手续费，计算跨币种全仓维持保证金率。',
      fields: [
        { id: 'effective', label: '有效保证金', placeholder: '例如 500', unit: 'USDT' },
        { id: 'maint', label: '总维持保证金', placeholder: '例如 300', unit: 'USDT' },
        { id: 'reduceFee', label: '减仓手续费', placeholder: '例如 10', unit: 'USDT' }
      ],
      compute(values) {
        const eff = toNumber(values.effective);
        const maint = toNumber(values.maint);
        const reduceFee = toNumber(values.reduceFee);
        if ([eff, maint, reduceFee].some(v => !isFinite(v))) {
          throw new Error('请把所有输入项填写完整。');
        }
        const denom = maint + reduceFee;
        if (!denom) throw new Error('维持保证金 + 减仓手续费 不能为 0。');

        const rate = eff / denom;

        const result = '跨币种全仓维持保证金率 ≈ ' + fmtPct(rate, 4);

        const baseFormula =
          '维持保证金率 = 有效保证金 ÷ (维持保证金 + 减仓手续费)';

        const numericFormula =
          '维持保证金率 = ' + eff + ' ÷ (' + maint + ' + ' + reduceFee + ')' +
          ' ≈ ' + fmtPct(rate, 4);

        return { result, baseFormula, numericFormula };
      }
    },

    positionValue: {
      key: 'positionValue',
      name: '仓位价值',
      desc: '根据合约面值、张数和标记价格，计算当前仓位价值。',
      fields: [
        { id: 'faceValue', label: '合约面值', placeholder: '例如 0.1', unit: '币' },
        { id: 'qty', label: '合约张数', placeholder: '例如 100', unit: '张' },
        { id: 'markPrice', label: '标记价格', placeholder: '例如 1000', unit: 'USDT' }
      ],
      compute(values) {
        const face = toNumber(values.faceValue);
        const qty = toNumber(values.qty);
        const markP = toNumber(values.markPrice);
        if ([face, qty, markP].some(v => !isFinite(v))) {
          throw new Error('请把所有输入项填写完整。');
        }
        const pv = face * qty * markP;
        const result = '仓位价值 ≈ ' + fmtNum(pv, 4) + ' USDT';

        const baseFormula = '仓位价值 = 合约面值 × 合约张数 × 标记价格';

        const numericFormula =
          '仓位价值 = ' + face + ' × ' + qty + ' × ' + markP +
          ' ≈ ' + fmtNum(pv, 4) + ' USDT';

        return { result, baseFormula, numericFormula };
      }
    },

    fundingFee: {
      key: 'fundingFee',
      name: '资金费用',
      desc: '根据仓位价值和资金费率，计算一次资金费用金额。',
      fields: [
        { id: 'positionValue', label: '仓位价值', placeholder: '例如 1000', unit: 'USDT' },
        { id: 'fundingRate', label: '资金费率', placeholder: '例如 0.0005', unit: '' }
      ],
      compute(values) {
        const pv = toNumber(values.positionValue);
        const rate = toNumber(values.fundingRate);
        if ([pv, rate].some(v => !isFinite(v))) {
          throw new Error('请把所有输入项填写完整。');
        }
        const fee = pv * rate;
        const result = '本次资金费用 ≈ ' + fmtNum(fee, 4) + ' USDT';

        const baseFormula = '资金费用 = 仓位价值 × 资金费率';

        const numericFormula =
          '资金费用 = ' + pv + ' × ' + rate +
          ' ≈ ' + fmtNum(fee, 4) + ' USDT';

        return { result, baseFormula, numericFormula };
      }
    },

    liqPrice: {
      key: 'liqPrice',
      name: '预估强平价',
      desc: '根据保证金余额、合约规模、开仓价格、维持保证金率和手续费率，估算多 / 空仓的预估强平价格。',
      fields: [
        { id: 'side', label: '持仓方向', type: 'select', options: [
          { value: 'long', label: '多仓' },
          { value: 'short', label: '空仓' }
        ]},
        { id: 'balance', label: '保证金余额', placeholder: '例如 500', unit: 'USDT' },
        { id: 'faceValue', label: '合约面值', placeholder: '例如 0.1', unit: '币' },
        { id: 'qty', label: '合约张数', placeholder: '例如 100', unit: '张' },
        { id: 'openPrice', label: '开仓均价', placeholder: '例如 1000', unit: 'USDT' },
        { id: 'maintRate', label: '维持保证金率', placeholder: '例如 0.005', unit: '' },
        { id: 'feeRate', label: '手续费率', placeholder: '例如 0.0005', unit: '' }
      ],
      compute(values) {
        const side = values.side || 'long';
        const bal = toNumber(values.balance);
        const face = toNumber(values.faceValue);
        const qty = toNumber(values.qty);
        const openP = toNumber(values.openPrice);
        const maintR = toNumber(values.maintRate);
        const feeR = toNumber(values.feeRate);
        if ([bal, face, qty, openP, maintR, feeR].some(v => !isFinite(v))) {
          throw new Error('请把除方向以外的输入项填写完整。');
        }
        const s = face * qty;
        let liq;
        if (side === 'long') {
          const denom = s * (maintR + feeR - 1);
          if (!denom) throw new Error('分母为 0，请检查维持保证金率和手续费率。');
          liq = (bal - s * openP) / denom;
        } else {
          const denom = s * (maintR + feeR + 1);
          if (!denom) throw new Error('分母为 0，请检查维持保证金率和手续费率。');
          liq = (bal + s * openP) / denom;
        }

        const result =
          (side === 'long' ? '多仓' : '空仓') +
          '预估强平价 ≈ ' + fmtNum(liq, 4) + ' USDT';

        const baseFormula =
          '多仓预估强平价 = (保证金余额 - 合约面值 × 合约张数 × 开仓均价) ÷ [合约面值 × 合约张数 × (维持保证金率 + 手续费率 - 1)]\\n' +
          '空仓预估强平价 = (保证金余额 + 合约面值 × 合约张数 × 开仓均价) ÷ [合约面值 × 合约张数 × (维持保证金率 + 手续费率 + 1)]';

        let numericFormula;
        if (side === 'long') {
          numericFormula =
            '多仓预估强平价 = (' + bal + ' - ' + face + ' × ' + qty + ' × ' + openP + ') ÷ [' +
            face + ' × ' + qty + ' × (' + maintR + ' + ' + feeR + ' - 1)]' +
            ' ≈ ' + fmtNum(liq, 4) + ' USDT';
        } else {
          numericFormula =
            '空仓预估强平价 = (' + bal + ' + ' + face + ' × ' + qty + ' × ' + openP + ') ÷ [' +
            face + ' × ' + qty + ' × (' + maintR + ' + ' + feeR + ' + 1)]' +
            ' ≈ ' + fmtNum(liq, 4) + ' USDT';
        }

        return { result, baseFormula, numericFormula };
      }
    }
  };

  const calcOrder = [
    'avgOpen',
    'fee',
    'profit',
    'initialMargin',
    'maintMargin',
    'maintRate',
    'crossMaintRate',
    'positionValue',
    'fundingFee',
    'liqPrice'
  ];

  let activeCalcKey = calcOrder[0];

  function renderTabs() {
    calcTabsEl.innerHTML = '';
    calcOrder.forEach(key => {
      const c = calcs[key];
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'calc-tab' + (key === activeCalcKey ? ' active' : '');
      btn.textContent = c.name;
      btn.dataset.key = key;
      calcTabsEl.appendChild(btn);
    });
  }

  function renderForm() {
    const calc = calcs[activeCalcKey];
    formTitleEl.textContent = '输入区 · ' + calc.name;
    formDescEl.textContent = calc.desc;
    tipEl.textContent = '请按提示填写数据，然后点击“开始计算”。';

    formFieldsEl.innerHTML = '';
    calc.fields.forEach(field => {
      const row = makeInputRow(field);
      formFieldsEl.appendChild(row);
    });

    resultMainEl.value = '';
    formulaBaseEl.textContent = '';
    formulaNumericEl.textContent = '';
  }

  calcTabsEl.addEventListener('click', e => {
    const btn = e.target.closest('button.calc-tab');
    if (!btn) return;
    const key = btn.dataset.key;
    if (!key || key === activeCalcKey) return;
    activeCalcKey = key;
    renderTabs();
    renderForm();
  });

  btnClear.addEventListener('click', () => {
    const inputs = formFieldsEl.querySelectorAll('input, select');
    inputs.forEach(el => {
      if (el.tagName === 'SELECT') {
        el.selectedIndex = 0;
      } else {
        el.value = '';
      }
    });
    resultMainEl.value = '';
    formulaBaseEl.textContent = '';
    formulaNumericEl.textContent = '';
    tipEl.textContent = '已清空输入，请重新填写。';
  });

  btnCalc.addEventListener('click', () => {
    const calc = calcs[activeCalcKey];
    const values = {};
    calc.fields.forEach(f => {
      const el = document.getElementById(f.id);
      if (el) values[f.id] = el.value;
    });
    try {
      const { result, baseFormula, numericFormula } = calc.compute(values);
      resultMainEl.value = result;
      formulaBaseEl.textContent = baseFormula;
      formulaNumericEl.textContent = numericFormula;
      tipEl.textContent = '计算完成，结果仅作参考。';
    } catch (err) {
      tipEl.textContent = err.message || '计算失败，请检查输入。';
    }
  });

  renderTabs();
  renderForm();
});
"""
print(len(js.splitlines()))