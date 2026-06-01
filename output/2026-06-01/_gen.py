from PIL import Image, ImageDraw, ImageFont, ImageOps
import os

W, H = 1080, 1080
INK = (17, 24, 39)
YELLOW = (251, 191, 36)
PAPER = (249, 250, 251)
GRAY = (156, 163, 175)
FONT = "/System/Library/Fonts/PingFang.ttc"
BOLD, REG = 4, 2

VOICE = "六月第一天。台灣電商 ROI 480%、Runway 速度快 10 倍、歐盟 AI Act 正式執法——三件事告訴你同一件事：AI 影音的「試試看」時代結束了，「要怎麼跑得比別人快又合規」才是現在的真正問題。給創作者：速度是新的護城河，Gen-5 Turbo 讓你一天能跑的版本從 10 個變成 100 個，先跑先贏。給企業主：六月要做一件事——指定一個人負責 AI 影音，不是「大家都來用」，是「有一個人要負責結果」。"
DATE = "2026.06.01"
OUT = "/Users/videomaker2021/Documents/AI_News/output/2026-06-01/ai-shinshi-ye-2026-06-01.png"
AVATAR = "/Users/videomaker2021/Documents/AI_News/assets/shary.jpg"

img = Image.new("RGB", (W, H), INK)
draw = ImageDraw.Draw(img)

# 底部黃色細條
draw.rectangle([0, H-8, W, H], fill=YELLOW)

# 左側黃色裝飾豎線
draw.rectangle([0, 0, 8, H-8], fill=YELLOW)

# 「AI 新視野」標籤
lf = ImageFont.truetype(FONT, 26, index=BOLD)
label = "AI 新視野"
bb = draw.textbbox((0,0), label, font=lf)
lw, lh = bb[2]-bb[0], bb[3]-bb[1]
draw.rounded_rectangle([70, 72, 70+lw+28, 72+lh+18], radius=6, fill=YELLOW)
draw.text((70+14, 72+9), label, font=lf, fill=INK)

# 日期右上
sf = ImageFont.truetype(FONT, 20, index=REG)
draw.text((W-180, 82), DATE, font=sf, fill=GRAY)
draw.text((W-220, 108), "AI News", font=ImageFont.truetype(FONT, 20, index=BOLD), fill=GRAY)

# 大引號
try:
    qf = ImageFont.truetype("/System/Library/Fonts/Supplemental/Times New Roman.ttf", 180)
except:
    qf = ImageFont.truetype(FONT, 180, index=BOLD)
draw.text((62, 110), "“", font=qf, fill=YELLOW)

# 主文字自動換行
def wrap(text, font, max_w):
    lines, line = [], ""
    for ch in text:
        test = line + ch
        bb = font.getbbox(test)
        if bb[2]-bb[0] > max_w and line:
            lines.append(line); line = ch
        else:
            line = test
    if line: lines.append(line)
    return lines

bf = ImageFont.truetype(FONT, 34, index=BOLD)
lines = wrap(VOICE, bf, W-150)
y = 320
for line in lines:
    draw.text((80, y), line, font=bf, fill=PAPER)
    y += 60

# 簽名
draw.text((90, H-160), "Shary", font=ImageFont.truetype(FONT, 30, index=BOLD), fill=YELLOW)
draw.text((90, H-122), "影音創客 創辦人", font=sf, fill=GRAY)

# 頭像
if os.path.exists(AVATAR):
    SZ = 200
    av = ImageOps.fit(Image.open(AVATAR).convert("RGB"), (SZ, SZ), Image.LANCZOS)
    mask = Image.new("L", (SZ, SZ), 0)
    ImageDraw.Draw(mask).ellipse((0,0,SZ,SZ), fill=255)
    ax, ay = W-SZ-70, H-SZ-100
    draw.ellipse([ax-5, ay-5, ax+SZ+5, ay+SZ+5], fill=YELLOW)
    img.paste(av, (ax, ay), mask)

img.save(OUT, "PNG", optimize=True)
print(f"✅ {OUT}")
print(f"   {os.path.getsize(OUT)//1024} KB")
