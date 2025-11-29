// api/okx-fee.js
// 用于部署在 Vercel / Render 等 Node.js 无服务器环境的简单代理
// 作用：安全地使用你的 OKX API Key，从官方接口获取当前账户的合约手续费费率。
// 前端只看到返回的 maker / taker 数字，不接触密钥。

import crypto from "crypto";

const OKX_API_KEY = process.env.OKX_API_KEY;
const OKX_API_SECRET = process.env.OKX_API_SECRET; // 原始密钥字符串
const OKX_API_PASSPHRASE = process.env.OKX_API_PASSPHRASE;
const OKX_API_PROJECT = process.env.OKX_API_PROJECT || ""; // 若有项目 ID 可填

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

  const { instType = "SWAP", instId = "" } = req.query || {};

  try {
    const timestamp = new Date().toISOString();
    const method = "GET";
    const path = "/api/v5/account/trade-fee";
    const query = new URLSearchParams({
      instType,
      instId
    }).toString();
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
      console.error("OKX HTTP error", okxRes.status, text);
      res.status(502).json({ error: "OKX HTTP error", status: okxRes.status, body: text });
      return;
    }

    const data = await okxRes.json();
    if (data.code !== "0") {
      console.error("OKX API error", data);
      res.status(502).json({ error: "OKX API error", data });
      return;
    }

    const row = (data.data && data.data[0]) || {};
    // 兼容不同字段命名
    let maker = Number(row.maker);
    let taker = Number(row.taker);

    if (!Number.isFinite(maker) || !Number.isFinite(taker)) {
      // 有些账户会返回 makerU / takerU 之类的字段
      if (row.feeRate && typeof row.feeRate === "string") {
        const parts = row.feeRate.split(",");
        if (parts.length >= 2) {
          maker = Number(parts[0]);
          taker = Number(parts[1]);
        }
      } else if (Number.isFinite(Number(row.makerU)) && Number.isFinite(Number(row.takerU))) {
        maker = Number(row.makerU);
        taker = Number(row.takerU);
      }
    }

    if (!Number.isFinite(maker) || !Number.isFinite(taker)) {
      res.status(500).json({ error: "Cannot parse maker/taker from OKX response", raw: row });
      return;
    }

    res.status(200).json({ maker, taker });
  } catch (err) {
    console.error("Proxy error", err);
    res.status(500).json({ error: "Proxy error", detail: String(err) });
  }
}
