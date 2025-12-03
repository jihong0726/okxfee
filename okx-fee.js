<script>
const G1 = new Set([
  "BTC-USDT","ETH-USDT","SOL-USDT","DOGE-USDT","BTC-USD",
  "XRP-USDT","ETH-USD","PEPE-USDT","PUMP-USDT","SUI-USDT"
]);

function g(inst) {
  if (!inst || inst.instType !== "SWAP") return "group2";
  return G1.has(inst.uly) ? "group1" : "group2";
}

const vip = {
  group1: {
    Regular:{m:0.00020,t:0.00050},
    VIP1:{m:0.00018,t:0.00040},
    VIP2:{m:0.00013,t:0.00035},
    VIP3:{m:0.00010,t:0.00028},
    VIP4:{m:0.00008,t:0.00027},
    VIP5:{m:0.00005,t:0.00026},
    VIP6:{m:0.00000,t:0.00025},
    VIP7:{m:-0.00002,t:0.00020},
    VIP8:{m:-0.00005,t:0.00020},
    VIP9:{m:-0.00005,t:0.00015},
  },
  group2: {
    Regular:{m:0.00020,t:0.00050},
    VIP1:{m:0.00018,t:0.00040},
    VIP2:{m:0.00013,t:0.00035},
    VIP3:{m:0.00010,t:0.00028},
    VIP4:{m:0.00008,t:0.00027},
    VIP5:{m:0.00005,t:0.00026},
    VIP6:{m:0.00000,t:0.00025},
    VIP7:{m:-0.00005,t:0.00025},
    VIP8:{m:-0.00010,t:0.00025},
    VIP9:{m:-0.00010,t:0.00020},
  }
};

let inst = null;
let feeGroup = "group2";
let mode = "demo"; // demo / api / manual
let customM = 0, customT = 0;

async function loadInst(id){
  const r = await fetch(`https://www.okx.com/api/v5/public/instruments?instType=SWAP&instId=${id}`);
  const d = await r.json();
  inst = d.data?.[0];
  feeGroup = g(inst);
  document.getElementById("feeGroupLabel").textContent =
    feeGroup === "group1" ? "Group 1" : "Group 2";
}

async function fee(){
  const roleO = document.getElementById("openRole").value;
  const roleC = document.getElementById("closeRole").value;
  const v = document.getElementById("vipLevel").value;

  if(mode==="demo"){
    const c = vip[feeGroup][v];
    return {maker:c.m, taker:c.t};
  }

  if(mode==="manual"){
    return {maker:customM, taker:customT};
  }

  if(mode==="api"){
    const gid = feeGroup==="group1"?"4":"5";
    const r = await fetch(`/api/okx-fee?instType=SWAP&groupId=${gid}`);
    return await r.json();
  }
}
</script>
