#!/usr/bin/env python3
"""Dump all trades from Supabase via PostgREST into a JSON file."""
import json, os, urllib.request, urllib.error, sys

ROOT = "/home/mozacsuck48/gold-plan-web"
env = {}
with open(os.path.join(ROOT, ".env.local")) as f:
    for line in f:
        line = line.strip()
        if line and not line.startswith("#") and "=" in line:
            k, v = line.split("=", 1)
            env[k.strip()] = v.strip()

URL = env["VITE_SUPABASE_URL"].rstrip("/")
ANON = env["VITE_SUPABASE_ANON_KEY"]

def req(method, path, body=None, token=None):
    data = json.dumps(body).encode() if body is not None else None
    h = {"apikey": ANON, "Content-Type": "application/json"}
    if token:
        h["Authorization"] = "Bearer " + token
    rq = urllib.request.Request(URL + path, data=data, headers=h, method=method)
    try:
        with urllib.request.urlopen(rq) as resp:
            return resp.status, resp.read().decode(), dict(resp.headers)
    except urllib.error.HTTPError as e:
        return e.code, e.read().decode(), dict(e.headers)

# auth
st, txt, _ = req("POST", "/auth/v1/token?grant_type=password",
                 {"email": "arfasyrf@gmail.com", "password": "test123"})
if st >= 300:
    print("AUTH FAIL", st, txt[:300]); sys.exit(1)
tok = json.loads(txt)["access_token"]
uid = json.loads(txt)["user"]["id"]

# fetch all trades, paginated
all_rows = []
offset = 0
limit = 1000
while True:
    st, txt, _ = req("GET", f"/rest/v1/trades?user_id=eq.{uid}&select=*&order=trade_date.desc,id.desc&limit={limit}&offset={offset}", token=tok)
    if st >= 300:
        print("FETCH FAIL", st, txt[:300]); sys.exit(1)
    rows = json.loads(txt)
    if not rows:
        break
    all_rows.extend(rows)
    if len(rows) < limit:
        break
    offset += limit

out = {
    "count": len(all_rows),
    "trades": all_rows,
}
with open("/home/mozacsuck48/gold-plan-web/.extract_new/db_dump.json", "w") as f:
    json.dump(out, f)

from collections import Counter
print("total:", len(all_rows))
print("by account:", dict(Counter(r["account"] for r in all_rows)))
print("by date:", dict(sorted(Counter(r["trade_date"] for r in all_rows).items())))
print("net pnl:", round(sum(float(r["profit_loss"]) for r in all_rows), 2))
