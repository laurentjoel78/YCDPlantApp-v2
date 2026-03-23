"""
YCD Farmer Guide — App Prototype PDF Generator
For RYIC 2026 (GHSS Regional Youth Innovation Challenge) — Agritech Domain

Generates a professional PDF showcasing actual app screenshots in user-flow
diagrams with navigation arrows, feature descriptions, and phone mockup frames.

Usage:
  1. Place screenshots in competition_docs/screenshots/ with these names:
     login.png, signup.png, forgot_password.png,
     home.png, disease_detection.png, disease_result.png,
     weather.png, ai_assistant.png, guidance.png,
     marketplace.png, product_details.png, cart.png,
     checkout.png, payment.png, order_success.png,
     experts.png, expert_advisory.png, consultation_chat.png,
     forums.png, forum_chat.png, new_forum_post.png,
     profile.png, edit_profile.png, settings.png
  2. Run: python generate_prototype_pdf.py
"""

import os
from pathlib import Path
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm, cm
from reportlab.lib.colors import HexColor, white, black, Color
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, PageBreak, Table, TableStyle,
    KeepTogether, Flowable
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_JUSTIFY
from reportlab.graphics.shapes import Drawing, Rect, String, Line, Polygon
from reportlab.graphics import renderPDF
from reportlab.pdfgen.canvas import Canvas

# ── Paths ──────────────────────────────────────────────────────────────
BASE_DIR = Path(__file__).parent
SCREENSHOT_DIR = BASE_DIR / "screenshots"
OUTPUT_PDF = BASE_DIR / "YCD_FarmerGuide_Prototype_ICT_2026.pdf"

# ── Brand colours ──────────────────────────────────────────────────────
GREEN_DARK  = HexColor("#2D5016")
GREEN_MID   = HexColor("#4A7C2E")
GREEN_LIGHT = HexColor("#E8F5E9")
GREEN_BG    = HexColor("#F1F8E9")
ACCENT_ORANGE = HexColor("#FF8F00")
ACCENT_BLUE   = HexColor("#1565C0")
GRAY_TEXT   = HexColor("#424242")
GRAY_LIGHT  = HexColor("#9E9E9E")
GRAY_BG     = HexColor("#F5F5F5")
WHITE       = white
BLACK       = black
PHONE_BORDER = HexColor("#333333")

PAGE_W, PAGE_H = A4  # 595.28 x 841.89 pt


# ── Utility: check if screenshot exists ────────────────────────────────
def screenshot_path(name: str) -> str | None:
    for ext in ("png", "jpg", "jpeg", "webp"):
        p = SCREENSHOT_DIR / f"{name}.{ext}"
        if p.exists():
            return str(p)
    return None


# ── Custom Flowable: Phone Mockup ──────────────────────────────────────
class PhoneMockup(Flowable):
    """Draws a phone frame with a screenshot or placeholder inside."""

    def __init__(self, image_path, label, width=120, height=220):
        super().__init__()
        self.image_path = image_path
        self.label = label
        self.frame_w = width
        self.frame_h = height
        self.width = width
        self.height = height + 20  # extra space for label below

    def draw(self):
        c = self.canv
        # Phone bezel (rounded rect)
        radius = 8
        bx, by = 0, 20
        c.setStrokeColor(PHONE_BORDER)
        c.setLineWidth(2)
        c.setFillColor(HexColor("#1A1A1A"))
        c.roundRect(bx, by, self.frame_w, self.frame_h, radius, fill=1, stroke=1)

        # Inner screen area with small margin
        margin = 4
        sx = bx + margin
        sy = by + margin + 12  # top notch area
        sw = self.frame_w - 2 * margin
        sh = self.frame_h - 2 * margin - 20  # minus top notch + bottom bar

        if self.image_path and os.path.exists(self.image_path):
            # Draw real screenshot — fill the entire screen area
            c.saveState()
            # Clip to screen area
            p = c.beginPath()
            p.rect(sx, sy, sw, sh)
            c.clipPath(p, stroke=0)
            # Get original image dimensions
            from reportlab.lib.utils import ImageReader
            img_reader = ImageReader(self.image_path)
            iw, ih = img_reader.getSize()
            # Scale to fill screen (cover mode — no gaps)
            scale_w = sw / iw
            scale_h = sh / ih
            scale = max(scale_w, scale_h)  # cover: fill entirely
            draw_w = iw * scale
            draw_h = ih * scale
            # Center the image
            draw_x = sx + (sw - draw_w) / 2
            draw_y = sy + (sh - draw_h) / 2
            c.drawImage(self.image_path, draw_x, draw_y, draw_w, draw_h)
            c.restoreState()
        else:
            # Placeholder
            c.setFillColor(GREEN_BG)
            c.rect(sx, sy, sw, sh, fill=1, stroke=0)
            # Diagonal lines to indicate placeholder
            c.setStrokeColor(HexColor("#C8E6C9"))
            c.setLineWidth(0.5)
            c.line(sx, sy, sx + sw, sy + sh)
            c.line(sx + sw, sy, sx, sy + sh)
            # Center label text
            c.setFillColor(GREEN_DARK)
            c.setFont("Helvetica-Bold", 8)
            # Split label to fit
            words = self.label.split()
            if len(words) <= 2:
                c.drawCentredString(sx + sw/2, sy + sh/2, self.label)
            else:
                mid = len(words) // 2
                line1 = " ".join(words[:mid])
                line2 = " ".join(words[mid:])
                c.drawCentredString(sx + sw/2, sy + sh/2 + 6, line1)
                c.drawCentredString(sx + sw/2, sy + sh/2 - 6, line2)
            c.setFillColor(GRAY_LIGHT)
            c.setFont("Helvetica", 6)
            c.drawCentredString(sx + sw/2, sy + 8, "Add screenshot")

        # Top notch (camera area)
        notch_w = 30
        c.setFillColor(HexColor("#1A1A1A"))
        c.roundRect(bx + self.frame_w/2 - notch_w/2, by + self.frame_h - 12,
                    notch_w, 6, 3, fill=1, stroke=0)

        # Bottom bar
        c.setFillColor(HexColor("#555555"))
        bar_w = 30
        c.roundRect(bx + self.frame_w/2 - bar_w/2, by + 5,
                    bar_w, 3, 1.5, fill=1, stroke=0)

        # Screen label below phone
        c.setFillColor(GREEN_DARK)
        c.setFont("Helvetica-Bold", 7)
        c.drawCentredString(bx + self.frame_w/2, 6, self.label)


# ── Custom Flowable: Arrow between phones ──────────────────────────────
class FlowArrow(Flowable):
    """A horizontal right-arrow."""
    def __init__(self, width=30, height=220):
        super().__init__()
        self.width = width
        self.height = height + 20

    def draw(self):
        c = self.canv
        mid_y = self.height / 2
        # Line
        c.setStrokeColor(ACCENT_ORANGE)
        c.setLineWidth(2)
        c.line(4, mid_y, self.width - 8, mid_y)
        # Arrowhead as polygon
        c.setFillColor(ACCENT_ORANGE)
        arrow_x = self.width - 8
        p = c.beginPath()
        p.moveTo(arrow_x, mid_y)
        p.lineTo(arrow_x - 8, mid_y + 5)
        p.lineTo(arrow_x - 8, mid_y - 5)
        p.close()
        c.drawPath(p, fill=1, stroke=0)


# ── Custom Flowable: Flow Row (phones + arrows in one row) ─────────────
class FlowRow(Flowable):
    """A row of phone mockups connected by arrows."""
    def __init__(self, screens, phone_w=110, phone_h=200, arrow_w=25, max_per_row=4):
        super().__init__()
        self.screens = screens  # list of (screenshot_name, label)
        self.phone_w = phone_w
        self.phone_h = phone_h
        self.arrow_w = arrow_w
        self.max_per_row = max_per_row

        n = min(len(screens), max_per_row)
        self.width = n * phone_w + (n - 1) * arrow_w
        label_space = 22
        self.height = phone_h + label_space

    def draw(self):
        c = self.canv
        x = 0
        count = min(len(self.screens), self.max_per_row)
        for i, (name, label) in enumerate(self.screens[:count]):
            img = screenshot_path(name)
            phone = PhoneMockup(img, label, self.phone_w, self.phone_h)
            phone.canv = c
            c.saveState()
            c.translate(x, 0)
            phone.draw()
            c.restoreState()
            x += self.phone_w

            if i < count - 1:
                arrow = FlowArrow(self.arrow_w, self.phone_h)
                arrow.canv = c
                c.saveState()
                c.translate(x, 0)
                arrow.draw()
                c.restoreState()
                x += self.arrow_w


# ── Custom Flowable: Section Title Bar ─────────────────────────────────
class SectionBar(Flowable):
    """A coloured bar with an icon and section title."""
    def __init__(self, title, icon_char="●", bar_color=GREEN_DARK, width=PAGE_W - 80):
        super().__init__()
        self.title = title
        self.icon = icon_char
        self.bar_color = bar_color
        self.width = width
        self.height = 28

    def draw(self):
        c = self.canv
        c.setFillColor(self.bar_color)
        c.roundRect(0, 0, self.width, self.height, 5, fill=1, stroke=0)
        c.setFillColor(WHITE)
        c.setFont("Helvetica-Bold", 13)
        c.drawString(12, 8, f"{self.icon}  {self.title}")


# ── Custom Flowable: Feature Description Box ──────────────────────────
class FeatureBox(Flowable):
    """A highlighted box with feature description."""
    def __init__(self, features, width=PAGE_W - 80):
        super().__init__()
        self.features = features  # list of (icon, title, description)
        self.f_width = width
        self.line_h = 16
        self.width = width
        self.height = len(features) * self.line_h + 16

    def draw(self):
        c = self.canv
        c.setFillColor(GREEN_BG)
        c.roundRect(0, 0, self.f_width, self.height, 6, fill=1, stroke=0)
        c.setStrokeColor(GREEN_MID)
        c.setLineWidth(0.5)
        c.roundRect(0, 0, self.f_width, self.height, 6, fill=0, stroke=1)

        y = self.height - 14
        for icon, title, desc in self.features:
            c.setFillColor(GREEN_DARK)
            c.setFont("Helvetica-Bold", 8)
            c.drawString(10, y, f"{icon}  {title}:")
            title_w = c.stringWidth(f"{icon}  {title}:", "Helvetica-Bold", 8)
            c.setFillColor(GRAY_TEXT)
            c.setFont("Helvetica", 8)
            c.drawString(14 + title_w, y, f" {desc}")
            y -= self.line_h


# ── Cover page drawer ─────────────────────────────────────────────────
def draw_cover(canvas, doc):
    canvas.saveState()
    # Full green background
    canvas.setFillColor(GREEN_DARK)
    canvas.rect(0, 0, PAGE_W, PAGE_H, fill=1, stroke=0)

    # Decorative circles
    canvas.setFillColor(Color(1, 1, 1, 0.05))
    canvas.circle(PAGE_W * 0.85, PAGE_H * 0.85, 180, fill=1, stroke=0)
    canvas.circle(PAGE_W * 0.15, PAGE_H * 0.25, 120, fill=1, stroke=0)
    canvas.circle(PAGE_W * 0.7, PAGE_H * 0.1, 90, fill=1, stroke=0)

    # Top badge
    canvas.setFillColor(HexColor("#FFFFFF20"))
    canvas.roundRect(PAGE_W/2 - 160, PAGE_H - 100, 320, 36, 18, fill=1, stroke=0)
    canvas.setFillColor(WHITE)
    canvas.setFont("Helvetica-Bold", 11)
    canvas.drawCentredString(PAGE_W/2, PAGE_H - 88,
                             "ICT Innovation Competition 2026")

    # App name
    canvas.setFont("Helvetica-Bold", 42)
    canvas.drawCentredString(PAGE_W/2, PAGE_H - 200, "YCD Farmer Guide")

    # Subtitle
    canvas.setFont("Helvetica", 16)
    canvas.setFillColor(HexColor("#C8E6C9"))
    canvas.drawCentredString(PAGE_W/2, PAGE_H - 235,
                             "AI-Powered Agricultural Support Platform")

    # Divider line
    canvas.setStrokeColor(ACCENT_ORANGE)
    canvas.setLineWidth(3)
    canvas.line(PAGE_W/2 - 80, PAGE_H - 260, PAGE_W/2 + 80, PAGE_H - 260)

    # "APP PROTOTYPE" label
    canvas.setFillColor(ACCENT_ORANGE)
    canvas.setFont("Helvetica-Bold", 22)
    canvas.drawCentredString(PAGE_W/2, PAGE_H - 300, "APP PROTOTYPE")

    canvas.setFillColor(WHITE)
    canvas.setFont("Helvetica", 13)
    canvas.drawCentredString(PAGE_W/2, PAGE_H - 330,
                             "Interactive User Flow & Screen Showcase")

    # Stats boxes
    stats = [
        ("20+", "Screens"),
        ("6", "User Flows"),
        ("AI", "Powered"),
        ("2", "Languages"),
    ]
    box_w, box_h = 100, 60
    total_w = len(stats) * box_w + (len(stats) - 1) * 12
    start_x = PAGE_W/2 - total_w/2
    y_stat = PAGE_H - 430

    for i, (val, label) in enumerate(stats):
        bx = start_x + i * (box_w + 12)
        canvas.setFillColor(Color(1, 1, 1, 0.1))
        canvas.roundRect(bx, y_stat, box_w, box_h, 8, fill=1, stroke=0)
        canvas.setFillColor(WHITE)
        canvas.setFont("Helvetica-Bold", 22)
        canvas.drawCentredString(bx + box_w/2, y_stat + 30, val)
        canvas.setFillColor(HexColor("#C8E6C9"))
        canvas.setFont("Helvetica", 10)
        canvas.drawCentredString(bx + box_w/2, y_stat + 12, label)

    # Team info
    canvas.setFillColor(HexColor("#A5D6A7"))
    canvas.setFont("Helvetica", 10)
    canvas.drawCentredString(PAGE_W/2, y_stat - 40,
                             "ICT & Agritech  |  Cameroon  |  March 2026")

    # Bottom team
    canvas.setFillColor(WHITE)
    canvas.setFont("Helvetica-Bold", 11)
    canvas.drawCentredString(PAGE_W/2, 100,
                             "Team YCD  —  University of Buea")
    canvas.setFillColor(HexColor("#A5D6A7"))
    canvas.setFont("Helvetica", 9)
    canvas.drawCentredString(PAGE_W/2, 82,
                             "Laurent Joel  •  Ikome Johnson  •  Albert Teghen  •  Ndinguru Hope  •  Stanley Lem-Mola")
    canvas.drawCentredString(PAGE_W/2, 66,
                             "Software Eng. | Network Eng. | Environment | Agriculture | Microbiology")

    canvas.restoreState()


# ── Subsequent pages header/footer ────────────────────────────────────
def draw_page(canvas, doc):
    canvas.saveState()
    # Top bar
    canvas.setFillColor(GREEN_DARK)
    canvas.rect(0, PAGE_H - 30, PAGE_W, 30, fill=1, stroke=0)
    canvas.setFillColor(WHITE)
    canvas.setFont("Helvetica-Bold", 8)
    canvas.drawString(20, PAGE_H - 21, "YCD Farmer Guide — App Prototype")
    canvas.setFont("Helvetica", 8)
    canvas.drawRightString(PAGE_W - 20, PAGE_H - 21, "ICT Competition 2026")

    # Footer
    canvas.setFillColor(GRAY_LIGHT)
    canvas.setFont("Helvetica", 7)
    canvas.drawCentredString(PAGE_W/2, 18, f"Page {doc.page}")
    canvas.setFillColor(GREEN_DARK)
    canvas.rect(0, 0, PAGE_W, 8, fill=1, stroke=0)
    canvas.restoreState()


# ── Build the document ─────────────────────────────────────────────────
def build_pdf():
    doc = SimpleDocTemplate(
        str(OUTPUT_PDF),
        pagesize=A4,
        leftMargin=40, rightMargin=40,
        topMargin=50, bottomMargin=40,
    )

    styles = getSampleStyleSheet()
    content_width = PAGE_W - 80

    # Custom styles
    style_h1 = ParagraphStyle("H1", parent=styles["Heading1"],
                               fontSize=20, textColor=GREEN_DARK,
                               spaceAfter=8, spaceBefore=4)
    style_h2 = ParagraphStyle("H2", parent=styles["Heading2"],
                               fontSize=14, textColor=GREEN_MID,
                               spaceAfter=6, spaceBefore=10)
    style_body = ParagraphStyle("Body", parent=styles["Normal"],
                                 fontSize=9, textColor=GRAY_TEXT,
                                 leading=13, alignment=TA_JUSTIFY)
    style_caption = ParagraphStyle("Caption", parent=styles["Normal"],
                                    fontSize=8, textColor=GRAY_LIGHT,
                                    alignment=TA_CENTER, spaceAfter=4)
    style_flow_title = ParagraphStyle("FlowTitle", parent=styles["Heading3"],
                                       fontSize=12, textColor=GREEN_DARK,
                                       spaceBefore=6, spaceAfter=2)

    story = []

    # ── Cover page (content must start on page 2) ───────────────────
    story.append(PageBreak())

    # ── Page 2 — Table of Contents / Overview ────────────────────────
    story.append(Paragraph("App Prototype — Table of Contents", style_h1))
    story.append(Spacer(1, 8))
    story.append(Paragraph(
        "This prototype document showcases the <b>YCD Farmer Guide</b> mobile application "
        "through annotated user flows. Each section presents a key user journey with "
        "actual app screens, navigation paths, and feature highlights.",
        style_body
    ))
    story.append(Spacer(1, 12))

    toc_items = [
        ("1", "Home & Dashboard", "Main hub with quick-access feature cards"),
        ("2", "AI Disease Detection", "Camera → AI Analysis → Treatment Plan"),
        ("3", "AI Farming Assistant", "Chat-based AI for farming advice"),
        ("4", "Weather & Climate", "Real-time localized weather forecasts"),
        ("5", "Agricultural Marketplace", "Browse → Product Details → Cart → Payment"),
        ("6", "Expert Consultation", "Find experts → Expert profile → Live chat"),
        ("7", "Profile & Settings", "User management, language, preferences"),
        ("8", "Admin Dashboard", "Platform management, analytics, user control"),
    ]

    toc_data = []
    for num, title, desc in toc_items:
        toc_data.append([
            Paragraph(f'<font color="#FF8F00"><b>{num}</b></font>', style_body),
            Paragraph(f'<b>{title}</b>', style_body),
            Paragraph(desc, style_body),
        ])

    toc_table = Table(toc_data, colWidths=[30, 160, content_width - 200])
    toc_table.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("TOPPADDING", (0, 0), (-1, -1), 6),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
        ("LINEBELOW", (0, 0), (-1, -1), 0.5, HexColor("#E0E0E0")),
        ("LEFTPADDING", (0, 0), (0, -1), 8),
    ]))
    story.append(toc_table)

    story.append(Spacer(1, 20))

    # Tech stack summary
    story.append(Paragraph("Technology Stack", style_h2))
    tech_items = [
        ("📱", "Frontend", "React Native + Expo SDK 55"),
        ("⚙️", "Backend", "Node.js + Express.js (34 Controllers, 43 Models)"),
        ("🤖", "AI Engine", "Groq LLaMA 4 Scout + Whisper V3 (Voice)"),
        ("🗄️", "Database", "PostgreSQL + PostGIS (Geospatial)"),
        ("☁️", "Cloud", "Railway + Cloudinary + Upstash Redis"),
        ("🔒", "Security", "JWT Auth, Rate Limiting, Input Sanitization"),
    ]
    story.append(FeatureBox(tech_items, content_width))

    # ── Flow 1 — Home Dashboard ──────────────────────────────────────
    story.append(PageBreak())
    story.append(SectionBar("Flow 1 — Home Dashboard", "🏠"))
    story.append(Spacer(1, 8))
    story.append(Paragraph(
        "The home screen serves as the central hub, providing quick access to all "
        "core features through intuitive cards. It displays weather summaries, "
        "recent marketplace listings, and personalized AI recommendations.",
        style_body
    ))
    story.append(Spacer(1, 8))

    home_screens = [
        ("home", "Home Screen"),
    ]
    story.append(FlowRow(home_screens, phone_w=150, phone_h=260, arrow_w=30, max_per_row=1))
    story.append(Spacer(1, 8))

    home_features = [
        ("🎯", "Quick Actions", "One-tap access to Disease Detection, Weather, AI Chat, Marketplace"),
        ("📊", "Dashboard Stats", "Crop health overview, market trends, weather alerts"),
        ("🔔", "Notifications", "Real-time alerts for expert replies, forum posts, orders"),
        ("📍", "Location-Aware", "Content personalized to farmer's region in Cameroon"),
    ]
    story.append(FeatureBox(home_features, content_width))

    # ── Flow 2 — AI Disease Detection ────────────────────────────────
    story.append(PageBreak())
    story.append(SectionBar("Flow 2 — AI Disease Detection", "🔬"))
    story.append(Spacer(1, 8))
    story.append(Paragraph(
        "Farmers photograph sick plants using their smartphone camera. The AI model "
        "identifies diseases with high accuracy and provides immediate treatment "
        "recommendations including organic and chemical options with local availability.",
        style_body
    ))
    story.append(Spacer(1, 8))

    disease_screens = [
        ("home", "Home"),
        ("disease_detection", "Scan Plant"),
        ("disease_result", "AI Diagnosis"),
    ]
    story.append(FlowRow(disease_screens, phone_w=130, phone_h=230, arrow_w=35, max_per_row=3))
    story.append(Spacer(1, 8))

    disease_features = [
        ("📸", "Camera Scan", "Take or upload a photo of the affected plant"),
        ("🤖", "AI Analysis", "Groq LLaMA 4 Scout identifies disease with confidence score"),
        ("💊", "Treatment Plan", "Organic & chemical remedies with local product recommendations"),
        ("📚", "History", "Track past scans to monitor crop health over time"),
    ]
    story.append(FeatureBox(disease_features, content_width))

    # ── Flow 3 — AI Farming Assistant ────────────────────────────────
    story.append(Spacer(1, 16))
    story.append(SectionBar("Flow 3 — AI Farming Assistant", "🤖"))
    story.append(Spacer(1, 8))
    story.append(Paragraph(
        "An intelligent chat assistant that answers farming questions in natural "
        "language. Supports voice input (Whisper V3) and provides region-specific "
        "advice on planting schedules, soil management, pest control, and more.",
        style_body
    ))
    story.append(Spacer(1, 8))

    ai_screens = [
        ("home", "Home"),
        ("ai_assistant", "AI Chat"),
    ]
    story.append(FlowRow(ai_screens, phone_w=140, phone_h=240, arrow_w=40, max_per_row=2))
    story.append(Spacer(1, 8))

    ai_features = [
        ("💬", "Natural Chat", "Ask questions in English or French, get expert-level answers"),
        ("🎤", "Voice Input", "Whisper V3 speech-to-text for hands-free use in the field"),
        ("🌾", "Context-Aware", "Advice tailored to Cameroon's crops, climate, and soil types"),
        ("📖", "Farming Guidance", "Step-by-step crop cultivation guides and best practices"),
    ]
    story.append(FeatureBox(ai_features, content_width))

    # ── Flow 4 — Weather & Climate ───────────────────────────────────
    story.append(PageBreak())
    story.append(SectionBar("Flow 4 — Weather & Climate Intelligence", "🌦️"))
    story.append(Spacer(1, 8))
    story.append(Paragraph(
        "Real-time localized weather forecasts help farmers plan planting, "
        "irrigation, and harvesting. The system uses OpenWeather API with PostGIS "
        "for precise location-based forecasts across Cameroon's diverse climate zones.",
        style_body
    ))
    story.append(Spacer(1, 8))

    weather_screens = [
        ("home", "Home"),
        ("weather", "Weather Forecast"),
    ]
    story.append(FlowRow(weather_screens, phone_w=140, phone_h=240, arrow_w=40, max_per_row=2))
    story.append(Spacer(1, 8))

    weather_features = [
        ("🌡️", "Current Conditions", "Temperature, humidity, wind speed, precipitation"),
        ("📅", "7-Day Forecast", "Plan farming activities with weekly weather outlook"),
        ("⚠️", "Weather Alerts", "Extreme weather warnings for crop protection"),
        ("🗺️", "Region-Specific", "Forecasts for all 10 regions of Cameroon"),
    ]
    story.append(FeatureBox(weather_features, content_width))

    # ── Flow 5 — Marketplace & E-commerce ────────────────────────────
    story.append(Spacer(1, 16))
    story.append(SectionBar("Flow 5 — Agricultural Marketplace", "🛒"))
    story.append(Spacer(1, 8))
    story.append(Paragraph(
        "A complete e-commerce platform connecting farmers directly with buyers. "
        "Farmers can sell produce, seeds, and tools; buyers browse with category "
        "filters. Supports Mobile Money (MTN MoMo, Orange Money) for payments.",
        style_body
    ))
    story.append(Spacer(1, 8))

    market_screens = [
        ("marketplace", "Marketplace"),
        ("product_details", "Product Details"),
    ]
    story.append(FlowRow(market_screens, phone_w=140, phone_h=240, arrow_w=40, max_per_row=2))
    story.append(Spacer(1, 8))

    market_features = [
        ("🏪", "Product Listings", "Seeds, fertilizers, tools, and fresh produce"),
        ("💰", "Fair Pricing", "Eliminates middlemen — farmers earn up to 50% more"),
        ("📱", "Mobile Money", "MTN MoMo & Orange Money integration"),
        ("📦", "Order Tracking", "Full order history and delivery status"),
    ]
    story.append(FeatureBox(market_features, content_width))

    # ── Flow 6 — Expert Consultation ─────────────────────────────────
    story.append(PageBreak())
    story.append(SectionBar("Flow 6 — Expert Consultation", "👨‍🌾"))
    story.append(Spacer(1, 8))
    story.append(Paragraph(
        "Farmers connect with verified agricultural experts for personalized advice. "
        "Experts include agronomists, soil specialists, and pest control professionals. "
        "Live chat with text, images, and real-time consultation tracking.",
        style_body
    ))
    story.append(Spacer(1, 8))

    expert_screens = [
        ("experts", "Browse Experts"),
        ("expert_advisory", "Expert Profile"),
    ]
    story.append(FlowRow(expert_screens, phone_w=140, phone_h=240, arrow_w=40, max_per_row=2))
    story.append(Spacer(1, 8))

    expert_features = [
        ("👤", "Expert Profiles", "Verified credentials, specialization, ratings, and availability"),
        ("💬", "Live Chat", "Real-time text and image-based consultations"),
        ("🔔", "Socket.IO", "Instant notifications when experts respond"),
        ("⭐", "Rating System", "Farmers rate consultation quality for accountability"),
    ]
    story.append(FeatureBox(expert_features, content_width))

    # ── Flow 7 — Profile & Settings ──────────────────────────────────
    story.append(Spacer(1, 16))
    story.append(SectionBar("Flow 7 — Profile & Settings", "⚙️"))
    story.append(Spacer(1, 8))
    story.append(Paragraph(
        "Users manage their profile, farm details, language preferences, and app "
        "settings. The profile stores farm location for region-specific content, "
        "and supports switching between English and French.",
        style_body
    ))
    story.append(Spacer(1, 8))

    profile_screens = [
        ("profile", "My Profile"),
    ]
    story.append(FlowRow(profile_screens, phone_w=150, phone_h=260, arrow_w=30, max_per_row=1))
    story.append(Spacer(1, 8))

    profile_features = [
        ("👤", "Farm Profile", "Name, region, farm size, main crops"),
        ("🌐", "Language Switch", "Toggle between English and French instantly"),
        ("🔒", "Security", "Change password, manage sessions"),
        ("📊", "Activity History", "View past scans, orders, consultations"),
    ]
    story.append(FeatureBox(profile_features, content_width))

    # ── Flow 8 — Admin Dashboard ──────────────────────────────────────
    story.append(PageBreak())
    story.append(SectionBar("Flow 8 — Admin Dashboard", "📊"))
    story.append(Spacer(1, 8))
    story.append(Paragraph(
        "Administrators have a dedicated dashboard for platform management. "
        "Monitor user activity, approve new registrations, manage products and experts, "
        "moderate forums, and view real-time analytics on platform usage.",
        style_body
    ))
    story.append(Spacer(1, 8))

    admin_screens = [
        ("admin_dashboard", "Admin Dashboard"),
    ]
    story.append(FlowRow(admin_screens, phone_w=150, phone_h=260, arrow_w=30, max_per_row=1))
    story.append(Spacer(1, 8))

    admin_features = [
        ("📈", "Analytics", "Real-time platform stats — users, scans, orders, revenue"),
        ("👥", "User Management", "Approve registrations, manage roles and permissions"),
        ("🏪", "Product Control", "Add, edit, and moderate marketplace listings"),
        ("👨‍🏫", "Expert Oversight", "Verify and manage agricultural expert accounts"),
        ("💬", "Forum Moderation", "Create categories, moderate discussions"),
    ]
    story.append(FeatureBox(admin_features, content_width))

    # ── Summary Page ─────────────────────────────────────────────────
    story.append(Spacer(1, 20))
    story.append(SectionBar("Impact & Innovation Summary", "🚀", ACCENT_BLUE))
    story.append(Spacer(1, 10))

    impact_data = [
        ["Feature", "Innovation", "Impact on Farmers"],
        ["AI Disease Detection", "LLaMA 4 Scout vision model", "Reduces crop loss by 20-40%"],
        ["Voice AI Assistant", "Whisper V3 speech-to-text", "Accessible to low-literacy users"],
        ["Agricultural Marketplace", "Direct farmer-to-buyer platform", "Eliminates middleman exploitation"],
        ["Expert Consultation", "Real-time Socket.IO chat", "1:3000 ratio overcome digitally"],
        ["Weather Intelligence", "PostGIS + OpenWeather API", "Climate-smart farming decisions"],
        ["Community Forums", "Region-based peer network", "Scalable knowledge sharing"],
    ]

    impact_table = Table(impact_data, colWidths=[130, 170, content_width - 310])
    impact_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), GREEN_DARK),
        ("TEXTCOLOR", (0, 0), (-1, 0), WHITE),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, 0), 9),
        ("FONTNAME", (0, 1), (-1, -1), "Helvetica"),
        ("FONTSIZE", (0, 1), (-1, -1), 8),
        ("TEXTCOLOR", (0, 1), (-1, -1), GRAY_TEXT),
        ("BACKGROUND", (0, 1), (-1, -1), GREEN_BG),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [GREEN_BG, WHITE]),
        ("GRID", (0, 0), (-1, -1), 0.5, HexColor("#C8E6C9")),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("TOPPADDING", (0, 0), (-1, -1), 5),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
        ("LEFTPADDING", (0, 0), (-1, -1), 6),
    ]))
    story.append(impact_table)

    story.append(Spacer(1, 16))
    story.append(Paragraph(
        '<b>Target Beneficiaries:</b> 5+ million smallholder farmers across Cameroon, '
        'starting with the South-West, Littoral, and West regions.',
        style_body
    ))
    story.append(Spacer(1, 6))
    story.append(Paragraph(
        '<b>Scalability:</b> Designed for multi-country expansion across sub-Saharan Africa. '
        'AI models can be fine-tuned for local crops and diseases in any region. '
        'Roadmap includes Pidgin, Ewondo, Fulfulde, Duala, and Bamiléké language support.',
        style_body
    ))

    # ── Build ────────────────────────────────────────────────────────
    doc.build(story, onFirstPage=draw_cover, onLaterPages=draw_page)
    print(f"\n✅ Prototype PDF generated: {OUTPUT_PDF}")
    print(f"   File size: {OUTPUT_PDF.stat().st_size / 1024:.1f} KB")
    print(f"\n📸 Screenshots folder: {SCREENSHOT_DIR}")

    # Check which screenshots are missing
    all_names = [
        "home", "disease_detection", "disease_result",
        "weather", "ai_assistant",
        "marketplace", "product_details",
        "experts", "expert_advisory",
        "profile", "admin_dashboard",
    ]
    found = [n for n in all_names if screenshot_path(n)]
    missing = [n for n in all_names if not screenshot_path(n)]

    print(f"\n   ✅ Screenshots found: {len(found)}/{len(all_names)}")
    if found:
        for n in found:
            print(f"      • {n}")
    if missing:
        print(f"   ❌ Screenshots missing: {len(missing)}")
        for n in missing:
            print(f"      • {n}.png")
        print(f"\n   Place screenshots in: {SCREENSHOT_DIR}")
        print("   Then re-run this script to update the PDF.")


if __name__ == "__main__":
    build_pdf()
