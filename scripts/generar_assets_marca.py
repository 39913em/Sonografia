
import random
from PIL import Image, ImageDraw, ImageFont

RED = (204, 34, 51, 255)
WHITE_DOT = (232, 233, 232, 255)
BG = (10, 10, 15, 255)
TEXT = (232, 230, 240, 255)
MUTED = (154, 154, 168, 255)
MUTED2 = (106, 106, 128, 255)
BLUE = (26, 58, 138, 255)

FONT_REG = "IBMPlexMono-Regular.ttf"
FONT_BOLD = "IBMPlexMono-Bold.ttf"

DOTS_WHITE = [
    (20, 14.4), (20, 17.2), (20, 20), (20, 22.8), (20, 25.6),
    (17, 17.2), (17, 20), (17, 22.8),
    (23, 17.2), (23, 20), (23, 22.8),
    (14.5, 20), (25.5, 20),
]
DOTS_RED_OUT = [(5, 20), (7.5, 20), (32.5, 20), (35, 20)]


def draw_isotype(size, transparent_bg=True, bg_color=None, include_outer_dots=True):
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0) if transparent_bg else bg_color)
    d = ImageDraw.Draw(img)
    scale = size / 40.0
    cx, cy = size / 2, size / 2
    r = 10 * scale
    d.ellipse([cx - r, cy - r, cx + r, cy + r], fill=RED)
    dot_r = max(1, 0.7 * scale)
    for sx, sy in DOTS_WHITE:
        px = cx + (sx - 20) * scale
        py = cy + (sy - 20) * scale
        d.ellipse([px - dot_r, py - dot_r, px + dot_r, py + dot_r], fill=WHITE_DOT)
    if include_outer_dots:
        for sx, sy in DOTS_RED_OUT:
            px = cx + (sx - 20) * scale
            py = cy + (sy - 20) * scale
            d.ellipse([px - dot_r, py - dot_r, px + dot_r, py + dot_r], fill=RED)
    return img


def generar_favicons():
    sizes = [16, 32, 48, 180, 192, 512]
    imgs = {}
    for s in sizes:
        master = draw_isotype(s * 4, transparent_bg=True, include_outer_dots=False)
        master = master.resize((s, s), Image.LANCZOS)
        imgs[s] = master
        if s in (180, 192, 512):
            solid = Image.new("RGBA", (s, s), BG)
            solid.alpha_composite(master)
            solid.save(f"assets/favicon-{s}.png")
        else:
            master.save(f"assets/favicon-{s}.png")
    imgs[16].save("assets/favicon.ico", sizes=[(16, 16), (32, 32), (48, 48)])
    print("Favicons regenerados en assets/")


def generar_og_image():
    W, H = 1200, 630
    og = Image.new("RGB", (W, H), BG)

    random.seed(7)
    px = og.load()
    for _ in range(14000):
        x = random.randint(0, W - 1)
        y = random.randint(0, H - 1)
        v = random.randint(4, 16)
        r, g, b = px[x, y]
        px[x, y] = (min(255, r + v), min(255, g + v), min(255, b + v))

    d = ImageDraw.Draw(og, "RGBA")

    margin = 34
    frame = [margin, margin, W - margin, H - margin]
    shadow_off = 10
    d.rectangle([frame[0] + shadow_off, frame[1] + shadow_off, frame[2] + shadow_off, frame[3] + shadow_off], fill=RED)
    d.rectangle(frame, fill=BG)
    d.rectangle(frame, outline=RED, width=4)

    def reg_mark(cx, cy, s=7):
        d.line([cx, cy - s, cx, cy + s], fill=RED, width=2)
        d.line([cx - s, cy, cx + s, cy], fill=RED, width=2)

    for cx, cy in [(margin, margin), (W - margin, margin), (margin, H - margin), (W - margin, H - margin)]:
        reg_mark(cx, cy)

    f_title = ImageFont.truetype(FONT_BOLD, 78)
    f_sub = ImageFont.truetype(FONT_REG, 22)
    f_tag = ImageFont.truetype(FONT_REG, 21)
    f_small = ImageFont.truetype(FONT_REG, 15)

    title_text = "SONOGRAFÍA"
    tb0 = d.textbbox((0, 0), title_text, font=f_title)
    title_w = tb0[2] - tb0[0]
    dot_r = 8
    block_w = title_w + 28 + dot_r * 2  
    text_x = (W - block_w) // 2

    title_y = 240
    d.text((text_x, title_y), title_text, font=f_title, fill=TEXT)
    tb = d.textbbox((text_x, title_y), title_text, font=f_title)
    d.ellipse([tb[2] + 14, tb[1] + 12, tb[2] + 14 + dot_r * 2, tb[1] + 12 + dot_r * 2], fill=RED)

    sub_text = "E R R O R E S   V I S I O N O R O S"
    tsub = d.textbbox((0, 0), sub_text, font=f_sub)
    sub_x = (W - (tsub[2] - tsub[0])) // 2
    sub_y = tb[3] + 20
    d.text((sub_x, sub_y), sub_text, font=f_sub, fill=MUTED)

    tag_text = "IMAGEN → RUIDO → PARTITURA + DAW"
    ttag = d.textbbox((0, 0), tag_text, font=f_tag)
    tag_w = ttag[2] - ttag[0]
    tag_x = (W - tag_w) // 2
    tag_y = sub_y + 50
    d.line([(W - 420) // 2, tag_y - 16, (W + 420) // 2, tag_y - 16], fill=BLUE, width=3)
    d.text((tag_x, tag_y), tag_text, font=f_tag, fill=TEXT)

    meta_text = "SONOGRAFÍA · ERRORES VISIONOROS · By: 39913 · Databending · 2017-2026"
    tmeta = d.textbbox((0, 0), meta_text, font=f_small)
    meta_x = (W - (tmeta[2] - tmeta[0])) // 2
    meta_y = tag_y + 44
    d.text((meta_x, meta_y), meta_text, font=f_small, fill=MUTED2)

    og.save("assets/og-image.png", quality=92)
    print("Imagen Open Graph regenerada en assets/og-image.png")


if __name__ == "__main__":
    generar_favicons()
    generar_og_image()
