#!/usr/bin/env python3
"""gen_og_cards.py — jana kad OG 1200x630 ikut identiti 'The Quiet Ledger'.

Gaya sama dengan og-lot-calculator.png (commit 6ab743d): bg #0b0b0d,
border emas bulat, brand Playfair + berlian, eyebrow, tajuk Playfair besar,
panel formula emas, penerangan kelabu, thegoldplan.my.

Guna: python3 scripts/gen_og_cards.py
Tambah kad: tambah entri dalam CARDS, jalan semula, commit.
"""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

OUT = Path(__file__).resolve().parent.parent / "public" / "og"
FONTS = Path("/home/mozacsuck48/tools/fonts")

BG = (11, 11, 13)
GOLD = (226, 185, 0)
GOLD_DIM = (201, 157, 0)
CREAM = (243, 240, 234)
GREY = (153, 154, 160)
PANEL = (22, 23, 27)
PANEL_LINE = (43, 48, 56)

W, H = 1200, 630

CARDS = [
    {
        "name": "og-pip-calculator.png",
        "eyebrow": "FREE TOOL · NO SIGN-UP · RUNS IN YOUR BROWSER",
        "title": "XAUUSD Pip Value Calculator",
        "formula": "1.0 lot · $0.10 move = $10",
        "desc": "Know what one pip costs before you size the trade.",
    },
    {
        "name": "og-session-times.png",
        "eyebrow": "GOLD HOURS · LONDON · NEW YORK",
        "title": "XAUUSD Session Times",
        "formula": "London + New York = cleanest gold moves",
        "desc": "When gold actually moves, in UTC, all year round.",
    },
    {
        "name": "og-trading-plan-template.png",
        "eyebrow": "FREE TEMPLATE · COPY · PRINT",
        "title": "XAUUSD Trading Plan Template",
        "formula": "setup · entry · stop · target · invalid",
        "desc": "One page. Written before the session, not during it.",
    },
]


def font(path, size):
    return ImageFont.truetype(str(path), size)


def center(draw, y, text, f, fill):
    w = draw.textlength(text, font=f)
    draw.text(((W - w) / 2, y), text, font=f, fill=fill)


def make(card):
    img = Image.new("RGB", (W, H), BG)
    d = ImageDraw.Draw(img)
    # bingkai emas
    d.rounded_rectangle([16, 16, W - 17, H - 17], radius=20, outline=(173, 137, 0), width=2)
    # brand + berlian (kiri atas)
    d.polygon([(88, 78), (106, 100), (88, 122), (70, 100)], outline=(227, 182, 0), width=4)
    brand = font(FONTS / "Playfair-Var.ttf", 46)
    d.text((122, 76), "The Gold Plan", font=brand, fill=(244, 241, 236))
    # eyebrow
    eb = font(FONTS / "Inter-Var.ttf", 17)
    center(d, 195, card["eyebrow"], eb, GOLD_DIM)
    # tajuk
    t = font(FONTS / "Playfair-Var.ttf", 64)
    center(d, 238, card["title"], t, CREAM)
    # panel formula
    f = font(FONTS / "Inter-Var.ttf", 28)
    fw = d.textlength(card["formula"], font=f)
    px, py = (W - fw) / 2 - 32, 330
    d.rounded_rectangle([px, py, px + fw + 64, py + 86], radius=15, fill=PANEL, outline=PANEL_LINE, width=1)
    d.text(((W - fw) / 2, py + 25), card["formula"], font=f, fill=(240, 196, 0))
    # penerangan
    de = font(FONTS / "Inter-Var.ttf", 22)
    center(d, 455, card["desc"], de, GREY)
    # web
    wfb = font(FONTS / "Inter-Var.ttf", 24)
    center(d, 558, "thegoldplan.my", wfb, GOLD)

    out = OUT / card["name"]
    img.save(out, "PNG")
    print(out, img.size)


if __name__ == "__main__":
    for c in CARDS:
        make(c)
