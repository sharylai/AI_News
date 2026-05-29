"""
生成 1080×1080 AI 新視野 社群貼圖
"""
from PIL import Image, ImageDraw, ImageFont, ImageFilter, ImageOps
import os

# ----- 設定 -----
W, H = 1080, 1080
INK = (17, 24, 39)              # #111827 主背景
INK_SOFT = (31, 41, 55)         # 次背景
YELLOW = (251, 191, 36)         # #FBBF24
YELLOW_DARK = (245, 158, 11)
PAPER = (249, 250, 251)
GRAY = (156, 163, 175)

FONT_PATH = "/System/Library/Fonts/PingFang.ttc"
FONT_BOLD_INDEX = 4              # PingFang TC Semibold
FONT_REG_INDEX = 2               # PingFang TC Regular

SHARY_VOICE = "今天三件事看起來分散，其實連成一條線：Sora 2.0 商用化讓全 AI 廣告變成可執行方案，Nike 用實際案例驗證觀眾接受度，FTC 規範把「揭露」從選項變成義務。給企業主：別等競品做了你才動。現在就拆出「AI 內製組 + 合規 SOP」雙軌，半年內你的廣告成本結構會跟對手拉開 30-50% 差距。"

DATE = "2026.05.29"

OUT_PATH = "/Users/videomaker2021/Documents/AI_News/output/2026-05-29/ai-shinshi-ye-2026-05-29.png"
AVATAR_PATH = "/Users/videomaker2021/Documents/AI_News/assets/shary.jpg"

# ----- 建畫布 -----
img = Image.new("RGB", (W, H), INK)
draw = ImageDraw.Draw(img)

# 微妙的漸層感（左下角加深一點）
overlay = Image.new("RGB", (W, H), INK_SOFT)
mask = Image.new("L", (W, H), 0)
mask_draw = ImageDraw.Draw(mask)
for i in range(60):
    mask_draw.ellipse([-200 + i*8, H-400 + i*5, 600 + i*8, H+200 + i*5], fill=int(60 - i))
img.paste(overlay, (0, 0), mask)

# ----- 黃色「AI 新視野」標籤 -----
LABEL_X, LABEL_Y = 80, 80
LABEL_W, LABEL_H = 200, 56
draw.rounded_rectangle(
    [LABEL_X, LABEL_Y, LABEL_X + LABEL_W, LABEL_Y + LABEL_H],
    radius=8, fill=YELLOW
)
label_font = ImageFont.truetype(FONT_PATH, 26, index=FONT_BOLD_INDEX)
label_text = "AI 新視野"
bbox = draw.textbbox((0, 0), label_text, font=label_font)
tw, th = bbox[2] - bbox[0], bbox[3] - bbox[1]
draw.text(
    (LABEL_X + (LABEL_W - tw) / 2, LABEL_Y + (LABEL_H - th) / 2 - 5),
    label_text, font=label_font, fill=INK
)

# ----- 大引號裝飾 -----
quote_font = ImageFont.truetype("/System/Library/Fonts/Supplemental/Times New Roman.ttf", 200)
draw.text((70, 130), '"', font=quote_font, fill=YELLOW)

# ----- 主文字（自動斷行） -----
def wrap_text(text, font, max_width):
    """中文字 + 標點符號逐字斷行"""
    lines = []
    line = ""
    for ch in text:
        test = line + ch
        bbox = font.getbbox(test)
        w = bbox[2] - bbox[0]
        if w > max_width and line:
            lines.append(line)
            line = ch
        else:
            line = test
    if line:
        lines.append(line)
    return lines

body_font = ImageFont.truetype(FONT_PATH, 36, index=FONT_BOLD_INDEX)
BODY_X = 90
BODY_Y = 340
BODY_MAX_W = W - 180
LINE_HEIGHT = 64

lines = wrap_text(SHARY_VOICE, body_font, BODY_MAX_W)
for i, line in enumerate(lines):
    draw.text((BODY_X, BODY_Y + i * LINE_HEIGHT), line, font=body_font, fill=PAPER)

# ----- 簽名 -----
sign_font = ImageFont.truetype(FONT_PATH, 28, index=FONT_BOLD_INDEX)
sign_small = ImageFont.truetype(FONT_PATH, 20, index=FONT_REG_INDEX)

SIGN_Y = H - 180
draw.text((90, SIGN_Y), "Shary", font=sign_font, fill=YELLOW)
draw.text((90, SIGN_Y + 42), "影音創客 創辦人", font=sign_small, fill=GRAY)
draw.text((90, SIGN_Y + 80), DATE, font=sign_small, fill=GRAY)

# ----- 圓形頭像（右下）-----
if os.path.exists(AVATAR_PATH):
    AVATAR_SIZE = 200
    avatar = Image.open(AVATAR_PATH).convert("RGB")
    avatar = ImageOps.fit(avatar, (AVATAR_SIZE, AVATAR_SIZE), Image.LANCZOS)
    mask_circle = Image.new("L", (AVATAR_SIZE, AVATAR_SIZE), 0)
    md = ImageDraw.Draw(mask_circle)
    md.ellipse((0, 0, AVATAR_SIZE, AVATAR_SIZE), fill=255)
    avatar_x = W - AVATAR_SIZE - 80
    avatar_y = H - AVATAR_SIZE - 110
    # 黃色邊框
    border = 6
    draw.ellipse(
        (avatar_x - border, avatar_y - border,
         avatar_x + AVATAR_SIZE + border, avatar_y + AVATAR_SIZE + border),
        fill=YELLOW
    )
    img.paste(avatar, (avatar_x, avatar_y), mask_circle)

# ----- 底部品牌 strip -----
strip_h = 6
draw.rectangle([0, H - strip_h, W, H], fill=YELLOW)

# ----- 右上角小 logo -----
logo_font = ImageFont.truetype(FONT_PATH, 22, index=FONT_BOLD_INDEX)
draw.text((W - 280, 90), "AI News", font=logo_font, fill=GRAY)
draw.text((W - 280, 118), "videomaker.cc", font=sign_small, fill=YELLOW)

# ----- 存檔 -----
img.save(OUT_PATH, "PNG", optimize=True)
print(f"✅ 已生成：{OUT_PATH}")
print(f"   尺寸：{W}×{H}")
print(f"   檔案大小：{os.path.getsize(OUT_PATH) / 1024:.1f} KB")
