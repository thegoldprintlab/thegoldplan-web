#!/usr/bin/env python3
"""Generate SQL to seed the 151 historical trades from the Google Sheet export.

Usage:
  python3 scripts/gen_seed.py /tmp/sheets/3_Trading_Log.csv > supabase/seed_trades.sql
"""
import csv
import sys
from datetime import datetime


def parse_date(d: str) -> str:
    # Sheet format is M/D/YYYY
    m, day, y = d.strip().split('/')
    return f"{y}-{int(m):02d}-{int(day):02d}"


def money(v: str) -> str:
    return v.replace('$', '').replace(',', '').strip()


def esc(s: str) -> str:
    return s.replace("'", "''")


def main(path: str) -> None:
    with open(path, newline='', encoding='utf-8-sig') as f:
        rows = list(csv.reader(f))

    header = rows[0]
    print('-- Seed historical trades from the Gold Plan Google Sheet.')
    print('-- Replace :USER_ID with the Supabase auth.users id of the account')
    print("-- you log in with, then run this file in the SQL Editor.")
    print()
    print('insert into public.trades')
    print('  (user_id, trade_date, account, session, setup, direction,')
    print('   entry_price, exit_price, pips, profit_loss, emotion, notes)')
    print('values')

    seen = set()
    values = []
    skipped = 0
    for row in rows[1:]:
        if not row or not row[0].strip():
            continue
        date, account, session, setup, direction = row[0].strip(), row[1].strip(), row[2].strip(), row[3].strip(), row[4].strip()
        entry, exit_, pips, pl = row[5].strip(), row[6].strip(), row[7].strip(), money(row[8])
        emotion, notes = row[9].strip(), esc(row[10].strip() if len(row) > 10 else '')

        key = (date, account, session, setup, direction, entry, exit_, pl)
        if key in seen:
            skipped += 1
            continue
        seen.add(key)

        values.append(
            f"  (:USER_ID, '{parse_date(date)}', '{esc(account)}', '{esc(session)}', '{esc(setup)}', "
            f"'{direction}', {entry}, {exit_}, {pips}, {pl}, '{esc(emotion)}', '{notes}')"
        )

    print(',\n'.join(values) + ';')
    print()
    print(f'-- {len(values)} rows generated ({skipped} duplicate rows skipped).')
    print()
    print('-- Seed default settings for the same user:')
    print("insert into public.settings (user_id, setups, sessions, emotions, accounts, max_daily_loss)")
    print("values (:USER_ID,")
    print("  array['SNR Breakout','SND Rejection','SNR + SND','Others'],")
    print("  array['Australia (Aus)','Tokyo (Tok)','London (Lon)','New York (NY)'],")
    print("  array['Calm & Focused','FOMO / Chasing Price','Revenge Trading','Hesitant'],")
    print("  array['Personal Account','Prop Firm 1','Prop Firm 2','Compounding Account'],")
    print("  100);")


if __name__ == '__main__':
    if len(sys.argv) < 2:
        print('usage: gen_seed.py <trading_log.csv>', file=sys.stderr)
        sys.exit(1)
    main(sys.argv[1])
