// api/okx-fee.js
// 最新版：支持 OKX feeGroup + groupId，同时兼容旧字段。
// 可直接用于 Vercel / Render / Node.js 无服务器环境。

import crypto from "crypto";

const OKX_API_KEY = process.env.OKX_API_KEY;
const OKX_API_SECRET = process.env.OKX_API_SECRET;
const OKX_API_PASSPHRASE = process.env.OKX_API_PASSPHRASE;
const OKX_API_PROJECT = process.env.OKX_API_PROJECT || "";

// HMAC-SHA256 签名
function sign(prehash, secret) {
  const hmac = crypto.createHmac("sha256", secret);
  hmac.update(prehash);
  return hmac.digest("base64");
}

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  if (!OKX_API_KEY || !OKX_API_SECRET || !OKX_API_PASSPHRASE) {
    res.status(500).json({ error: "Missing OKX API env variables" });
    return;
  }

  // 前端会传入：instType + groupId
  // instType = SWAP / SPOT / FUTURES / OPTION
  // groupId = OKX feeGroup 的分组 ID
  const { instType = "SWAP", groupId = "" } = req.query || {};

  try {
    const timestamp = new Date().toISOString();
    const method = "GET";
    const path = "/api/v5/account/trade-fee";

    // 只需要 instType，instId 不一定需要
    const query = new URLSearchParams({ instType }).toString();
    const requestPath = `${path}?${query}`;

    const prehash = timestamp + method + requestPath;
    const signature = sign(prehash, OKX_API_SECRET);

    const headers = {
      "OK-ACCESS-KEY": OKX_API_KEY,
      "OK-ACCESS-SIGN": signature,
      "OK-ACCESS-TIMESTAMP": timestamp,
      "OK-ACCESS-PASSPHRASE": OKX_API_PASSPHRASE,
      "Content-Type": "application/json"
    };
    if (OKX_API_PROJECT) {
      headers["OK-ACCESS-PROJECT"] = OKX_API_PROJECT;
    }

    const url = "https://www.okx.com" + requestPath;
    const okxRes = await fetch(url, { method, headers });

    if (!okxRes.ok) {
      const text = await okxRes.text();
      res.status(502).json({
        error: "OKX HTTP error",
        status: okxRes.status,
        body: text
      });
      return;
    }

    const data = await okxRes.json();
    if (data.code !== "0") {
      res.status(502).json({ error: "OKX API error", data });
      return;
    }

    const row = (data.data && data.data[0]) || {};
    let maker = null;
    let taker = null;

    // ---------------------------
    // 1. 新版结构：feeGroup 支持
    // ---------------------------
    if (Array.isArray(row.feeGroup)) {
      // 如果前端传入 groupId，找对应分组
      if (groupId) {
        const found = row.feeGroup.find(g => String(g.groupId) === String(groupId));
        if (found) {
          maker = Number(found.maker);
          taker = Number(found.taker);
        }
      }

      // 如果没找到或没传 groupId，则默认用第一个 feeGroup
      if (maker === null || taker === null) {
        const primary = row.feeGroup[0];
        maker = Number(primary.maker);
        taker = Number(primary.taker);
      }
    }

    // ---------------------------
    // 2. 兼容旧字段（短期兼容）
    // ---------------------------
    if (!Number.isFinite(maker) || !Number.isFinite(taker)) {
      if (Number.isFinite(Number(row.maker)) && Number.isFinite(Number(row.taker))) {
        maker = Number(row.maker);
        taker = Number(row.taker);
      }
    }

    // ---------------------------
    // 3. 再 fallback：兼容 makerU / takerU
    // ---------------------------
    if (!Number.isFinite(maker) || !Number.isFinite(taker)) {
      if (Number.isFinite(Number(row.makerU)) && Number.isFinite(Number(row.takerU))) {
        maker = Number(row.makerU);
        taker = Number(row.takerU);
      }
    }

    if (!Number.isFinite(maker) || !Number.isFinite(taker)) {
      res.status(500).json({
        error: "Cannot parse maker/taker",
        raw: row
      });
      return;
    }

    res.status(200).json({ maker, taker });
  } catch (err) {
    res.status(500).json({
      error: "Proxy error",
      detail: String(err)
    });
  }
}
