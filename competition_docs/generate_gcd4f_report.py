#!/usr/bin/env python3
"""
YCD Farmer Guide — Project Report
Global Competition on Design for Futures (GCD4F) 2026

Theme: AI for Society
Phase 1 Submission — Project Report

Professional, visually rich PDF designed to stand out.
"""

from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch, cm, mm
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
    HRFlowable, KeepTogether, PageBreak, ListFlowable, ListItem
)
from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_JUSTIFY, TA_LEFT, TA_RIGHT
from reportlab.platypus.flowables import Flowable
from reportlab.graphics.shapes import Drawing, Rect, Circle, Line, String
from reportlab.graphics import renderPDF
import os, textwrap

OUTPUT_DIR = os.path.dirname(os.path.abspath(__file__))
OUTPUT_PDF = os.path.join(OUTPUT_DIR, "YCD_FarmerGuide_GCD4F_2026_Report.pdf")

# ─── COLOR PALETTE ───────────────────────────────────────────────────────────
DEEP_GREEN   = colors.HexColor("#0A3D2E")
MID_GREEN    = colors.HexColor("#14713D")
ACCENT_GREEN = colors.HexColor("#27AE60")
LIGHT_GREEN  = colors.HexColor("#E8F5E9")
SOFT_GREEN   = colors.HexColor("#A8D5A2")
TEAL         = colors.HexColor("#1ABC9C")
WHITE        = colors.white
BLACK        = colors.HexColor("#1A1A1A")
DARK_GREY    = colors.HexColor("#333333")
MID_GREY     = colors.HexColor("#666666")
LIGHT_GREY   = colors.HexColor("#F5F5F5")
CARD_BG      = colors.HexColor("#F8FBF8")
GOLD         = colors.HexColor("#D4A017")
ORANGE       = colors.HexColor("#E67E22")
BLUE         = colors.HexColor("#2980B9")

W, H = A4

# ─── TEAM ────────────────────────────────────────────────────────────────────
TEAM = [
    {
        "name": "Ikome Johnson",
        "role": "Team Lead — Systems & Connectivity",
        "field": "Network Engineering (Level 500)",
        "uni": "University of Buea",
        "contrib": "Project coordination, systems integration, connectivity architecture, and deployment strategy.",
    },
    {
        "name": "Mkounga Tatchum Laurent Joël",
        "role": "Technical Lead — Full-Stack & AI",
        "field": "Software Engineering",
        "uni": "University of Buea",
        "contrib": "System architecture, full-stack development (React Native, Node.js), AI/ML integration (Groq, LLaMA, Whisper), database design, and platform engineering.",
    },
    {
        "name": "Ndum Albert Teghen",
        "role": "Mentor — Environmentalist",
        "field": "Environmental Science",
        "uni": "—",
        "contrib": "Strategic mentorship, environmental sustainability guidance, ecological impact assessment, and project advisory.",
    },
    {
        "name": "Ndinguru Hope",
        "role": "Agriculture Specialist",
        "field": "Agriculture",
        "uni": "ISAGO (Institut Supérieur Agricole d'Obala)",
        "contrib": "Agricultural domain expertise, crop science validation, farmer engagement strategy, and field-level advisory content.",
    },
    {
        "name": "Tata Stanley Lem-Mola",
        "role": "Crop Health & Biological Systems",
        "field": "Microbiology",
        "uni": "University of Bamenda",
        "contrib": "Disease detection domain knowledge, biological systems validation, crop health data curation, and scientific accuracy review.",
    },
]


# ─── CUSTOM FLOWABLES ────────────────────────────────────────────────────────

class ColorBar(Flowable):
    """A colored horizontal bar."""
    def __init__(self, width, height, color):
        Flowable.__init__(self)
        self.width = width
        self.height = height
        self.color = color

    def draw(self):
        self.canv.setFillColor(self.color)
        self.canv.roundRect(0, 0, self.width, self.height, 2, fill=1, stroke=0)


class SectionHeader(Flowable):
    """A numbered section header with accent bar."""
    def __init__(self, number, title, width=480):
        Flowable.__init__(self)
        self.number = number
        self.title = title
        self.w = width
        self.height = 32

    def draw(self):
        c = self.canv
        # Accent bar on the left
        c.setFillColor(ACCENT_GREEN)
        c.roundRect(0, 2, 4, self.height - 4, 2, fill=1, stroke=0)
        # Number circle
        c.setFillColor(DEEP_GREEN)
        c.circle(22, self.height / 2, 12, fill=1, stroke=0)
        c.setFillColor(WHITE)
        c.setFont("Helvetica-Bold", 11)
        c.drawCentredString(22, self.height / 2 - 4, str(self.number))
        # Title
        c.setFillColor(DEEP_GREEN)
        c.setFont("Helvetica-Bold", 14)
        c.drawString(42, self.height / 2 - 5, self.title)
        # Underline
        c.setStrokeColor(ACCENT_GREEN)
        c.setLineWidth(1.5)
        c.line(42, -2, self.w, -2)


class FeatureBox(Flowable):
    """A feature card with icon-label and description."""
    def __init__(self, icon_letter, title, description, width=220, bg=CARD_BG):
        Flowable.__init__(self)
        self.icon_letter = icon_letter
        self.title = title
        self.description = description
        self.w = width
        self.bg = bg
        self.height = 70

    def draw(self):
        c = self.canv
        # Background card
        c.setFillColor(self.bg)
        c.roundRect(0, 0, self.w, self.height, 6, fill=1, stroke=0)
        # Icon circle
        c.setFillColor(ACCENT_GREEN)
        c.circle(20, self.height - 20, 10, fill=1, stroke=0)
        c.setFillColor(WHITE)
        c.setFont("Helvetica-Bold", 11)
        c.drawCentredString(20, self.height - 24, self.icon_letter)
        # Title
        c.setFillColor(DEEP_GREEN)
        c.setFont("Helvetica-Bold", 10)
        c.drawString(36, self.height - 24, self.title)
        # Description — wrap text
        c.setFillColor(DARK_GREY)
        c.setFont("Helvetica", 8)
        lines = textwrap.wrap(self.description, width=int((self.w - 16) / 3.6))
        y = self.height - 38
        for line in lines[:3]:
            c.drawString(10, y, line)
            y -= 10


class StatBox(Flowable):
    """A highlighted statistic box."""
    def __init__(self, number, label, color=ACCENT_GREEN, width=105):
        Flowable.__init__(self)
        self.number = number
        self.label = label
        self.color = color
        self.w = width
        self.height = 55

    def draw(self):
        c = self.canv
        c.setFillColor(self.color)
        c.roundRect(0, 0, self.w, self.height, 5, fill=1, stroke=0)
        c.setFillColor(WHITE)
        c.setFont("Helvetica-Bold", 18)
        c.drawCentredString(self.w / 2, 28, self.number)
        c.setFont("Helvetica", 7.5)
        lines = self.label.split('\n')
        if len(lines) == 2:
            c.drawCentredString(self.w / 2, 16, lines[0])
            c.drawCentredString(self.w / 2, 6, lines[1])
        else:
            c.drawCentredString(self.w / 2, 10, self.label)


# ─── COVER PAGE ──────────────────────────────────────────────────────────────

def draw_cover(canvas, doc):
    canvas.saveState()

    # Full deep green background
    canvas.setFillColor(DEEP_GREEN)
    canvas.rect(0, 0, W, H, fill=1, stroke=0)

    # Decorative diagonal stripe
    canvas.setFillColor(colors.HexColor("#0C4A36"))
    canvas.saveState()
    path = canvas.beginPath()
    path.moveTo(0, H * 0.65)
    path.lineTo(W, H * 0.45)
    path.lineTo(W, H * 0.35)
    path.lineTo(0, H * 0.55)
    path.close()
    canvas.clipPath(path, stroke=0)
    canvas.setFillColor(colors.HexColor("#0C4A36"))
    canvas.rect(0, 0, W, H, fill=1, stroke=0)
    canvas.restoreState()

    # Top badge — competition name
    badge_y = H - 100
    canvas.setFillColor(colors.HexColor("#0E5038"))
    canvas.roundRect(60, badge_y - 15, W - 120, 50, 8, fill=1, stroke=0)
    canvas.setFillColor(GOLD)
    canvas.setFont("Helvetica-Bold", 11)
    canvas.drawCentredString(W / 2, badge_y + 14,
        "GLOBAL COMPETITION ON DESIGN FOR FUTURES (GCD4F) 2026")
    canvas.setFillColor(SOFT_GREEN)
    canvas.setFont("Helvetica", 9)
    canvas.drawCentredString(W / 2, badge_y - 2,
        "Beijing Normal University  ·  UNESCO IITE  ·  World Digital Education Alliance")

    # Thin accent lines
    canvas.setStrokeColor(ACCENT_GREEN)
    canvas.setLineWidth(0.8)
    canvas.line(80, H - 180, W - 80, H - 180)

    # Theme tag
    canvas.setFillColor(ACCENT_GREEN)
    canvas.roundRect(W / 2 - 80, H - 210, 160, 22, 11, fill=1, stroke=0)
    canvas.setFillColor(WHITE)
    canvas.setFont("Helvetica-Bold", 10)
    canvas.drawCentredString(W / 2, H - 204, "AI  FOR  SOCIETY")

    # Project title
    canvas.setFillColor(WHITE)
    canvas.setFont("Helvetica-Bold", 42)
    canvas.drawCentredString(W / 2, H - 290, "YCD Farmer")
    canvas.drawCentredString(W / 2, H - 338, "Guide")

    # Subtitle
    canvas.setFillColor(SOFT_GREEN)
    canvas.setFont("Helvetica", 14)
    canvas.drawCentredString(W / 2, H - 370,
        "AI-Powered Agricultural Support Platform")

    # Tagline
    canvas.setFont("Helvetica-Oblique", 10.5)
    canvas.setFillColor(colors.HexColor("#C8E6C8"))
    canvas.drawCentredString(W / 2, H - 400,
        '"Bridging the digital divide for smallholder farmers"')

    # Bottom line
    canvas.setStrokeColor(ACCENT_GREEN)
    canvas.setLineWidth(0.8)
    canvas.line(80, 250, W - 80, 250)

    # Metadata block
    canvas.setFont("Helvetica", 9.5)
    meta = [
        ("Theme:", "AI for Society — Smart Agriculture & Digital Inclusion"),
        ("Document:", "Phase 1 Project Report"),
        ("Team:", "5 Members — Software, Network, Environment, Agriculture, Microbiology"),
        ("Universities:", "University of Buea & University of Bamenda, Cameroon"),
        ("Organization:", "Youths & Contemporary Development (YCD)"),
        ("Team Lead:", "Ikome Johnson"),
        ("Date:", "March 2026"),
    ]
    x_label = 170
    x_value = 280
    y_start = 215
    for i, (label, value) in enumerate(meta):
        y = y_start - i * 19
        canvas.setFillColor(SOFT_GREEN)
        canvas.setFont("Helvetica-Bold", 9)
        canvas.drawRightString(x_label, y, label)
        canvas.setFillColor(WHITE)
        canvas.setFont("Helvetica", 9)
        canvas.drawString(x_value, y, value)

    # Footer
    canvas.setFont("Helvetica", 7.5)
    canvas.setFillColor(colors.HexColor("#88B888"))
    canvas.drawCentredString(W / 2, 50,
        "Youths & Contemporary Development  |  Yaoundé, Cameroon  |  www.youth-contemporary-development.com")

    canvas.restoreState()


# ─── LATER PAGES HEADER/FOOTER ──────────────────────────────────────────────

def draw_later_pages(canvas, doc):
    canvas.saveState()
    # Top bar
    canvas.setFillColor(DEEP_GREEN)
    canvas.rect(0, H - 28, W, 28, fill=1, stroke=0)
    canvas.setFillColor(WHITE)
    canvas.setFont("Helvetica-Bold", 8)
    canvas.drawString(50, H - 20, "YCD Farmer Guide — GCD4F 2026 Project Report")
    canvas.setFont("Helvetica", 8)
    canvas.drawRightString(W - 50, H - 20, "AI for Society  |  Cameroon")
    # Green accent under header
    canvas.setFillColor(ACCENT_GREEN)
    canvas.rect(0, H - 30, W, 2, fill=1, stroke=0)
    # Bottom
    canvas.setStrokeColor(MID_GREEN)
    canvas.setLineWidth(0.5)
    canvas.line(50, 36, W - 50, 36)
    canvas.setFont("Helvetica", 7.5)
    canvas.setFillColor(MID_GREY)
    canvas.drawString(50, 24, "Youths & Contemporary Development")
    canvas.drawRightString(W - 50, 24, f"Page {doc.page}")
    canvas.restoreState()


# ─── STYLES ──────────────────────────────────────────────────────────────────

def get_styles():
    base = getSampleStyleSheet()

    base.add(ParagraphStyle("Body", fontSize=10, leading=14, textColor=DARK_GREY,
        fontName="Helvetica", alignment=TA_JUSTIFY, spaceBefore=2, spaceAfter=6))

    base.add(ParagraphStyle("BodyBold", fontSize=10, leading=14, textColor=BLACK,
        fontName="Helvetica-Bold", alignment=TA_JUSTIFY, spaceBefore=2, spaceAfter=6))

    base.add(ParagraphStyle("BodySmall", fontSize=9, leading=12.5, textColor=DARK_GREY,
        fontName="Helvetica", alignment=TA_JUSTIFY, spaceBefore=1, spaceAfter=4))

    base.add(ParagraphStyle("SubHead", fontSize=11, leading=14, textColor=DEEP_GREEN,
        fontName="Helvetica-Bold", spaceBefore=10, spaceAfter=4))

    base.add(ParagraphStyle("BulletBody", fontSize=9.5, leading=13, textColor=DARK_GREY,
        fontName="Helvetica", alignment=TA_JUSTIFY, spaceBefore=1, spaceAfter=3,
        leftIndent=14, bulletIndent=0))

    base.add(ParagraphStyle("Caption", fontSize=8, leading=10, textColor=MID_GREY,
        fontName="Helvetica-Oblique", alignment=TA_CENTER, spaceBefore=2, spaceAfter=8))

    base.add(ParagraphStyle("TOCEntry", fontSize=10, leading=16, textColor=DARK_GREY,
        fontName="Helvetica", spaceBefore=0, spaceAfter=0))

    base.add(ParagraphStyle("TOCTitle", fontSize=10, leading=16, textColor=DEEP_GREEN,
        fontName="Helvetica-Bold", spaceBefore=0, spaceAfter=0))

    base.add(ParagraphStyle("TeamName", fontSize=10, leading=13, textColor=DEEP_GREEN,
        fontName="Helvetica-Bold", spaceBefore=0, spaceAfter=0))

    base.add(ParagraphStyle("TeamInfo", fontSize=8.5, leading=11, textColor=DARK_GREY,
        fontName="Helvetica", spaceBefore=0, spaceAfter=1))

    base.add(ParagraphStyle("FootNote", fontSize=7.5, leading=10, textColor=MID_GREY,
        fontName="Helvetica", alignment=TA_CENTER, spaceBefore=4, spaceAfter=2))

    base.add(ParagraphStyle("QuoteStyle", fontSize=10, leading=14, textColor=MID_GREEN,
        fontName="Helvetica-Oblique", alignment=TA_CENTER, spaceBefore=8, spaceAfter=8,
        leftIndent=30, rightIndent=30))

    return base


def section_line():
    return HRFlowable(width="100%", thickness=0.5, color=ACCENT_GREEN,
                       spaceBefore=2, spaceAfter=6)


def green_line():
    return HRFlowable(width="50%", thickness=0.5, color=MID_GREEN,
                       spaceBefore=4, spaceAfter=6)


# ─── DOCUMENT BUILDER ────────────────────────────────────────────────────────

def build_document():
    print("=" * 60)
    print("  GCD4F 2026 — YCD Farmer Guide — Project Report")
    print("=" * 60)

    doc = SimpleDocTemplate(
        OUTPUT_PDF, pagesize=A4,
        rightMargin=0.7 * inch, leftMargin=0.7 * inch,
        topMargin=0.6 * inch, bottomMargin=0.55 * inch,
        title="YCD Farmer Guide — GCD4F 2026 Project Report",
        author="Youths & Contemporary Development",
        subject="AI for Society — Smart Agriculture",
    )

    s = get_styles()
    story = []
    usable_w = W - 1.4 * inch  # ~480 points

    # =====================================================================
    #  PAGE BREAK — push TOC to page 2 (cover fills page 1 via draw_cover)
    # =====================================================================
    story.append(PageBreak())

    # =====================================================================
    #  TABLE OF CONTENTS
    # =====================================================================
    story.append(Spacer(1, 20))
    story.append(Paragraph("<b>TABLE OF CONTENTS</b>", s["SubHead"]))
    story.append(section_line())
    toc_entries = [
        ("1", "Executive Summary"),
        ("2", "The Problem"),
        ("3", "Our Solution — YCD Farmer Guide"),
        ("4", "Technology & Architecture"),
        ("5", "Complete Feature Catalog"),
        ("6", "AI & Machine Learning Pipeline"),
        ("7", "Innovation & Differentiation"),
        ("8", "Social Impact & SDG Alignment"),
        ("9", "Implementation Status & Scalability"),
        ("10", "The Team"),
    ]
    for num, title in toc_entries:
        story.append(Paragraph(
            f'<font color="{ACCENT_GREEN.hexval()}">{num}.</font>  '
            f'<font color="{DARK_GREY.hexval()}">{title}</font>',
            s["TOCEntry"]
        ))
    story.append(PageBreak())

    # =====================================================================
    #  1. EXECUTIVE SUMMARY
    # =====================================================================
    story.append(SectionHeader(1, "EXECUTIVE SUMMARY"))
    story.append(Spacer(1, 14))

    story.append(Paragraph(
        "Cameroon's agricultural sector sustains over 70% of the rural population, yet smallholder "
        "farmers — who produce the majority of the country's food — remain trapped in a cycle of "
        "low productivity, high post-harvest losses, and limited market access. Plant diseases alone "
        "destroy up to 40% of harvests annually, while fewer than 10% of farming communities have "
        "access to trained agronomists.",
        s["Body"]
    ))
    story.append(Paragraph(
        "<b>YCD Farmer Guide</b> is a fully functional, AI-powered mobile application that places "
        "advanced agricultural intelligence directly in the hands of smallholder farmers. Built by "
        "a team of five young Cameroonians under <b>Youths &amp; Contemporary Development (YCD)</b>, "
        "the platform combines <b>computer vision for crop disease identification</b>, a "
        "<b>bilingual voice-enabled AI assistant</b>, a <b>farmer-to-buyer marketplace with mobile "
        "money payments</b>, <b>expert agronomist consultations</b>, <b>community forums</b>, and "
        "<b>hyperlocal weather intelligence</b> — all within a single mobile application that works "
        "on basic Android smartphones in low-bandwidth areas.",
        s["Body"]
    ))
    story.append(Paragraph(
        "This is not a concept or prototype. YCD Farmer Guide is a production-grade application with "
        "29 frontend screens, 34 backend API controllers, 43 database models, and 8 external API "
        "integrations — already deployed and running on cloud infrastructure.",
        s["Body"]
    ))

    # Impact stat boxes
    stats_data = [
        ("40%", "Harvest losses\nfrom disease"),
        ("70%+", "Rural population\nin agriculture"),
        ("<10%", "Farmers with\nexpert access"),
        ("50K+", "Target farmers\nin 2 years"),
    ]
    stat_boxes = []
    stat_colors = [ACCENT_GREEN, MID_GREEN, DEEP_GREEN, TEAL]
    for (num, label), col in zip(stats_data, stat_colors):
        stat_boxes.append(StatBox(num, label, color=col, width=usable_w / 4 - 6))
    stat_table = Table([stat_boxes], colWidths=[usable_w / 4] * 4)
    stat_table.setStyle(TableStyle([
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
    ]))
    story.append(Spacer(1, 8))
    story.append(stat_table)
    story.append(Spacer(1, 4))

    # =====================================================================
    #  2. THE PROBLEM
    # =====================================================================
    story.append(PageBreak())
    story.append(SectionHeader(2, "THE PROBLEM"))
    story.append(Spacer(1, 14))

    story.append(Paragraph(
        "Smallholder farmers in Cameroon face a convergence of interconnected challenges that "
        "perpetuate poverty and food insecurity across rural communities:",
        s["Body"]
    ))

    problems = [
        ("<b>Crop Disease Devastation:</b> Diseases such as Cassava Mosaic Virus, Black Sigatoka "
         "on plantain, Cocoa Black Pod, Maize Streak Virus, and Tomato Late Blight destroy up to "
         "40% of harvests annually. Farmers lack tools to identify what is affecting their crops "
         "and cannot access timely, reliable treatment advice."),
        ("<b>Knowledge Gap:</b> Fewer than 10% of farming communities have access to trained "
         "agronomists or government extension services. The gap between agricultural research "
         "and the farmers who need practical guidance remains vast."),
        ("<b>Climate Vulnerability:</b> Increasingly unpredictable weather patterns disrupt "
         "planting and harvesting cycles. Farmers make critical decisions — when to plant, when "
         "to harvest, when to apply treatments — without access to localized weather data."),
        ("<b>Market Exploitation:</b> After a successful harvest, farmers are often forced to "
         "sell through exploitative middlemen at prices well below fair market value. They lack "
         "direct access to buyers and transparent pricing information."),
        ("<b>Digital Exclusion:</b> Existing agricultural technology solutions are designed for "
         "literate, connected, and technologically savvy users. Farmers with limited literacy, "
         "who speak primarily French or local languages, and who operate in low-bandwidth "
         "environments are excluded from the digital revolution."),
        ("<b>Isolation:</b> Farmers work in isolation, unable to share knowledge, learn from "
         "peers in their region, or access collective wisdom that could improve their practices."),
    ]
    for p in problems:
        story.append(Paragraph(f"•  {p}", s["BulletBody"]))

    story.append(Spacer(1, 4))
    story.append(Paragraph(
        '<i>"A farmer in Bafut who discovers brown spots on her cassava leaves has no one to ask, '
        'no tool to consult, and no way to know if her entire harvest is at risk — until it is too late."</i>',
        s["QuoteStyle"]
    ))

    # =====================================================================
    #  3. OUR SOLUTION
    # =====================================================================
    story.append(SectionHeader(3, "OUR SOLUTION — YCD FARMER GUIDE"))
    story.append(Spacer(1, 14))

    story.append(Paragraph(
        "YCD Farmer Guide is a <b>comprehensive mobile application</b> that serves as an "
        "<b>all-in-one digital companion</b> for smallholder farmers. Rather than addressing "
        "a single pain point, the platform integrates six core capabilities into a unified "
        "experience that accompanies the farmer from field to market:",
        s["Body"]
    ))

    # Feature cards in grid
    features_grid = [
        ("🔬", "AI Disease Identification", "Photograph a sick plant; within seconds the AI identifies the disease, provides treatment steps, and prevention advice — all in the farmer's language. Saves weeks of guesswork."),
        ("🗣️", "Voice-Enabled AI Assistant", "Speak to the app in French or English and receive spoken responses. No typing, no reading required — farmers with limited literacy can access AI-powered advice instantly."),
        ("🛒", "Farmer-to-Buyer Marketplace", "Buy seeds, fertilizers, and farm inputs; sell produce directly to buyers at fair prices with MTN MoMo / Orange Money. Eliminates exploitative middlemen."),
        ("👨‍🌾", "Expert Consultations", "Book sessions with certified agronomists who verify AI diagnoses and advise farmers on correct use of fertilizers and inputs purchased on the marketplace."),
        ("🌤️", "Hyperlocal Weather Intelligence", "7-day GPS-based forecasts tell farmers exactly when to plant, harvest, or apply treatments. Automatic severe weather alerts protect crops before damage occurs."),
        ("💬", "Community Forums", "Location-based forums where farmers share tips, ask questions, and learn from peers. Breaks isolation and builds collective knowledge across regions."),
    ]

    story.append(Spacer(1, 6))
    for i in range(0, len(features_grid), 2):
        row = []
        for j in range(2):
            if i + j < len(features_grid):
                icon, title, desc = features_grid[i + j]
                row.append(FeatureBox(icon[0] if len(icon) == 1 else "●", title, desc, width=usable_w / 2 - 8))
            else:
                row.append(Spacer(1, 1))
        ft = Table([row], colWidths=[usable_w / 2] * 2)
        ft.setStyle(TableStyle([
            ('VALIGN', (0, 0), (-1, -1), 'TOP'),
            ('LEFTPADDING', (0, 0), (-1, -1), 2),
            ('RIGHTPADDING', (0, 0), (-1, -1), 2),
        ]))
        story.append(ft)
        story.append(Spacer(1, 4))

    story.append(Spacer(1, 4))
    story.append(Paragraph(
        "Beyond these six pillars, the application includes <b>farm profile management</b> with "
        "GIS mapping (PostGIS), a <b>comprehensive crop database</b> with region-specific "
        "recommendations, <b>AI-generated personalized farm guidelines</b>, a <b>digital wallet "
        "system</b> with escrow payments, an <b>educational guidance library</b>, a full "
        "<b>admin dashboard</b> with analytics, and <b>offline capabilities</b> with automatic "
        "data synchronization — totaling over 40 distinct features.",
        s["Body"]
    ))

    # =====================================================================
    #  4. TECHNOLOGY & ARCHITECTURE
    # =====================================================================
    story.append(SectionHeader(4, "TECHNOLOGY & ARCHITECTURE"))
    story.append(Spacer(1, 14))

    story.append(Paragraph(
        "YCD Farmer Guide is built on a modern, production-grade technology stack designed for "
        "reliability, scalability, and performance in low-resource environments:",
        s["Body"]
    ))

    # Tech stack table
    tech_data = [
        ["Layer", "Technology", "Purpose"],
        ["Mobile App", "React Native + Expo SDK 54", "Cross-platform mobile app (Android/iOS)"],
        ["UI Framework", "React Native Paper + i18next", "Material Design UI with full FR/EN localization"],
        ["Backend API", "Node.js + Express.js", "RESTful API server with 34 controller modules"],
        ["Database", "PostgreSQL + PostGIS + Sequelize", "Relational DB with geospatial queries (43 models)"],
        ["AI Vision", "Groq API — LLaMA 4 Scout 17B", "Real-time plant disease identification from photos"],
        ["AI Chat", "Groq API — LLaMA 3.3 70B", "Context-aware agricultural chatbot"],
        ["Speech-to-Text", "Groq API — Whisper Large V3", "Voice input transcription (FR/EN)"],
        ["Text-to-Speech", "Google Cloud TTS", "Spoken AI responses with audio caching"],
        ["Weather", "Tomorrow.io + Open-Meteo", "Hyperlocal forecasts with automatic failover"],
        ["Maps", "MapTiler + OpenStreetMap Overpass", "Farm mapping and nearby market discovery"],
        ["Payments", "MTN MoMo + Orange Money", "Mobile money integration + digital wallet + escrow"],
        ["Real-time", "Socket.IO", "Live updates for orders, forums, products, consultations"],
        ["Email", "Brevo (Sendinblue)", "Transactional emails: verification, alerts, notifications"],
        ["Images", "Cloudinary", "Cloud image storage for products, profiles, certifications"],
        ["Caching", "Redis (Upstash) + MMKV", "Server-side and client-side caching layers"],
        ["Hosting", "Railway Cloud", "Production deployment with CI/CD"],
        ["ML Backup", "YOLOv8 (Python)", "Offline batch disease detection pipeline"],
    ]

    tech_table = Table(tech_data, colWidths=[70, 150, usable_w - 220])
    tech_table.setStyle(TableStyle([
        # Header row
        ('BACKGROUND', (0, 0), (-1, 0), DEEP_GREEN),
        ('TEXTCOLOR', (0, 0), (-1, 0), WHITE),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 8.5),
        # Body rows
        ('FONTNAME', (0, 1), (0, -1), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 1), (-1, -1), 8),
        ('TEXTCOLOR', (0, 1), (-1, -1), DARK_GREY),
        ('FONTNAME', (1, 1), (1, -1), 'Helvetica-Bold'),
        ('TEXTCOLOR', (1, 1), (1, -1), DEEP_GREEN),
        # Alternating rows
        *[('BACKGROUND', (0, i), (-1, i), LIGHT_GREEN if i % 2 == 0 else WHITE)
          for i in range(1, len(tech_data))],
        # Grid
        ('GRID', (0, 0), (-1, -1), 0.3, colors.HexColor("#D0D0D0")),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('TOPPADDING', (0, 0), (-1, -1), 4),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
        ('LEFTPADDING', (0, 0), (-1, -1), 6),
    ]))
    story.append(tech_table)

    # Architecture description
    story.append(Spacer(1, 10))
    story.append(Paragraph("<b>Architecture Overview</b>", s["SubHead"]))
    story.append(Paragraph(
        "The system follows a <b>client-server architecture</b> with the React Native mobile "
        "app communicating with the Node.js backend via RESTful APIs and WebSocket connections. "
        "The backend orchestrates all AI services through the Groq API, manages the PostgreSQL "
        "database with PostGIS for geospatial operations, and handles real-time event "
        "distribution via Socket.IO. A two-tier caching strategy (Redis server-side + MMKV "
        "client-side) ensures fast response times even in low-bandwidth conditions. The "
        "offline data manager with SQLite provides full functionality when connectivity is "
        "unavailable, with automatic synchronization when the network returns.",
        s["Body"]
    ))

    # =====================================================================
    #  5. COMPLETE FEATURE CATALOG
    # =====================================================================
    story.append(PageBreak())
    story.append(SectionHeader(5, "COMPLETE FEATURE CATALOG"))
    story.append(Spacer(1, 14))

    story.append(Paragraph(
        "YCD Farmer Guide includes over 40 features across 29 screens. Below is the complete "
        "catalog organized by domain:",
        s["Body"]
    ))

    feature_categories = [
        ("🔐 Authentication & Security", [
            "Multi-role registration (Farmer, Expert, Admin) with email verification — ensures trusted users on the platform",
            "JWT token-based authentication with role-based access control — protects sensitive farm and financial data",
            "Google and Facebook OAuth social sign-in — simplifies onboarding for farmers already using social media",
            "Secure password reset with email-based tokens",
            "Admin approval workflow — ensures only verified experts can offer consultations",
            "Brute-force protection (auto-block after 5 failed attempts) and tiered rate limiting",
            "Input sanitization against XSS/injection and comprehensive audit logging with IP tracking",
        ]),
        ("🤖 AI & Machine Learning", [
            "AI plant disease identification via LLaMA 4 Scout vision model — farmers photograph a sick plant and get a diagnosis in seconds, saving weeks of uncertainty",
            "Disease database: 7 conditions across 6 crop families with specific treatments for Cameroon",
            "Camera capture and gallery image selection — works with any Android smartphone camera",
            "Multi-language AI results (auto-translation EN↔FR) — the farmer always receives results in their preferred language",
            "Farm-context-aware AI chatbot (LLaMA 3.3 70B) — answers any farming question using the farmer's actual crop, soil, weather, and advisory data",
            "Voice input via Whisper Large V3 speech-to-text (FR/EN) — farmers speak their questions instead of typing, essential for low-literacy users",
            "Voice output via Google Cloud TTS with audio caching — the app reads answers aloud so farmers can listen while working in the field",
            "Voice command system with intent detection — hands-free navigation of the entire app",
            "YOLOv8 offline ML pipeline — batch disease detection even without internet connectivity",
            "AI-generated personalized farm guidelines per soil type, region, and crop — tailored advice, not generic tips",
            "Smart suggestion engine combining weather + crop + market data for optimal farming decisions",
        ]),
        ("🌤️ Weather System", [
            "Real-time weather: temperature, humidity, wind, UV, precipitation — farmers know conditions before going to the field",
            "7-day hyperlocal forecast with hourly granularity — helps plan planting, spraying, and harvesting at the right time",
            "GPS-based automatic location detection — no manual setup needed",
            "Severe weather alerts with push notifications — protects crops by giving advance warning of storms and droughts",
            "Crop-weather impact analysis with actionable advisories — the app explains what the weather means for each specific crop",
            "Scheduled auto-updates: hourly weather, daily forecasts (5 AM) — fresh data every morning before fieldwork",
            "Dual API strategy: Tomorrow.io (primary) + Open-Meteo (fallback) — ensures weather data is always available",
        ]),
        ("🌾 Farm Management", [
            "Farm profiles with GPS coordinates, region, soil type, water source — the digital identity of each farm",
            "Multi-farm support — manage several farms per account, ideal for farmers with dispersed plots",
            "Crop tracking with planting dates and growth stages — never lose track of what was planted when",
            "Comprehensive crop database with growing guides and disease info — a farming encyclopedia in every pocket",
            "PostGIS-powered farm mapping with plot subdivisions — visualize farm boundaries on a real map",
            "Interactive MapTiler map for farm location selection — tap to set your farm's exact position",
            "Soil data service with cached lookups by coordinates — understand your soil before planting",
            "Region-specific crop recommendations with fuzzy matching — know which crops thrive in your area",
        ]),
        ("🛒 Marketplace & E-Commerce", [
            "Product listings with images (Cloudinary), categories, and pricing — farmers browse and buy seeds, fertilizers, and tools",
            "Full shopping cart: add, update, remove items with delivery fees — familiar online shopping experience",
            "Checkout flow with address selection (10 Cameroon regions) — nationwide delivery coverage",
            "MTN Mobile Money and Orange Money payment integration — the payment methods 99% of users already have",
            "Cash on Delivery payment option — builds trust for first-time buyers",
            "Digital wallet system (XAF currency) with deposit/withdraw — a secure in-app financial account",
            "Escrow payment system with release conditions — protects both buyers and sellers from fraud",
            "Order management with real-time Socket.IO status updates — track every order from purchase to delivery",
            "Tiered commission system: virtual 15%, on-site 20%, emergency 25% — transparent and fair",
            "Nearby market discovery via OpenStreetMap Overpass API — find physical markets around you",
        ]),
        ("👨‍🌾 Expert Consultations", [
            "Expert profiles with specializations, certifications, and languages — farmers choose the right expert for their problem",
            "Consultation booking with date, duration, type (remote/on-site) — flexible scheduling",
            "Real-time chat between farmer and expert with image sharing — show the expert exactly what the crop looks like",
            "Experts advise on correct use of fertilizers and inputs purchased on the marketplace — ensuring products are applied properly",
            "Voice-enabled consultation requests — speak the problem, no typing required",
            "Admin review workflow before expert assignment — quality assurance on every consultation",
            "Expert rating and review system — community-driven quality tracking",
            "Cost estimation with real-time commission breakdown — full price transparency",
        ]),
        ("💬 Community Forums", [
            "Create and browse forum topics with categories — organized knowledge sharing",
            "Location-based forum discovery by GPS and radius — find discussions relevant to your area",
            "Region-based filtering (10 Cameroon regions) — connect with farmers facing similar conditions",
            "Threaded discussions with posts and replies — structured conversations for easy follow-up",
            "Real-time forum chat within topics — instant peer-to-peer help",
            "Forum membership, join/leave functionality — curate your community",
            "Content moderation system — ensures discussions remain helpful and respectful",
        ]),
        ("📚 Education & Guidance", [
            "Built-in knowledge library: crop planning, soil management, pest control — learn anytime, even offline",
            "Farm-specific guidelines generated from soil, region, and crop data — advice tailored to your exact farm",
            "Swipeable guidelines carousel for easy browsing — intuitive touch navigation",
            "Drill-down navigation from categories to subsections — find specific information quickly",
        ]),
        ("🌐 Internationalization", [
            "Full bilingual UI: French and English across all 29 screens — no feature is language-locked",
            "One-tap language switching (FR↔EN) stored persistently — switch anytime without losing your place",
            "Backend language-aware responses via Accept-Language headers — AI and system messages adapt automatically",
            "Downloadable language packs for offline TTS content — listen to advice even without internet",
        ]),
        ("📡 Real-Time & Offline", [
            "Socket.IO real-time updates for orders, products, forums, consultations — everything stays current",
            "Offline data manager with SQLite local database — full app functionality without internet",
            "Priority-based sync queue with retry on reconnection — no data is ever lost",
            "Two-tier cache: MMKV (client) + Redis (server) with stale-while-revalidate — fast access even on slow networks",
            "Offline status indicator with pending sync count — farmers know exactly what's waiting to sync",
            "Connectivity monitoring with automatic sync trigger — seamless transition between online and offline",
        ]),
        ("🛡️ Admin Dashboard", [
            "Analytics dashboard: users, products, farms, advisories, experts — real-time platform health at a glance",
            "User management and approval/rejection workflow — maintain platform quality",
            "Expert management with certification upload review — verify credentials before experts advise farmers",
            "Product management for marketplace curation — ensure only quality inputs are listed",
            "Forum management and topic creation — guide community discussions",
            "E-commerce analytics: carts, orders, payments, revenue tracking — full business intelligence",
            "Activity monitoring and audit log viewer — security and accountability",
        ]),
    ]

    for cat_title, items in feature_categories:
        story.append(Paragraph(f"<b>{cat_title}</b>", s["SubHead"]))
        for item in items:
            story.append(Paragraph(
                f'<font color="{ACCENT_GREEN.hexval()}">▸</font>  {item}',
                s["BulletBody"]
            ))
        story.append(Spacer(1, 2))

    # =====================================================================
    #  6. AI & ML PIPELINE (Deep Dive)
    # =====================================================================
    story.append(Spacer(1, 16))
    story.append(SectionHeader(6, "AI & MACHINE LEARNING PIPELINE"))
    story.append(Spacer(1, 14))

    story.append(Paragraph(
        "Artificial intelligence is at the core of YCD Farmer Guide. The platform leverages "
        "three distinct AI models through the Groq API, each serving a specific role in the "
        "farmer's journey:",
        s["Body"]
    ))

    ai_models = [
        ["Model", "Provider", "Role", "Details"],
        ["LLaMA 4 Scout\n17B 16E Instruct", "Groq (Meta)", "Disease\nIdentification",
         "Vision model analyzes plant photos. Returns JSON: disease name, confidence score, "
         "severity (mild/moderate/severe), treatment steps, and prevention tips. Trained on "
         "African crop diseases. Handles noisy field photos with multiple plants."],
        ["LLaMA 3.3\n70B Versatile", "Groq (Meta)", "AI Chatbot\n& Translation",
         "Farm-context-aware chatbot that loads the farmer's crops, soil type, weather, and "
         "recent advisories into its context window. Answers farming questions in EN/FR. Also "
         "used for translating disease detection results between languages."],
        ["Whisper\nLarge V3", "Groq (OpenAI)", "Speech-to-Text",
         "Transcribes voice recordings (M4A/WAV) to text in French and English. Enables "
         "farmers with limited literacy to interact with the entire platform using voice."],
        ["Google Cloud\nTTS", "Google", "Text-to-Speech",
         "Converts AI responses to spoken audio (MP3). Supports male/female/neutral voices "
         "in EN/FR. Cached audio reduces repeated API calls."],
        ["YOLOv8\n(Backup)", "Ultralytics", "Batch Detection",
         "Python-based offline detection pipeline using YOLOv8 for environments without "
         "reliable internet. Serves as a fallback to the cloud-based Groq vision model."],
    ]

    ai_table = Table(ai_models, colWidths=[75, 55, 60, usable_w - 190])
    ai_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), DEEP_GREEN),
        ('TEXTCOLOR', (0, 0), (-1, 0), WHITE),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 8.5),
        ('FONTNAME', (0, 1), (0, -1), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 1), (-1, -1), 7.5),
        ('TEXTCOLOR', (0, 1), (-1, -1), DARK_GREY),
        ('TEXTCOLOR', (0, 1), (0, -1), DEEP_GREEN),
        *[('BACKGROUND', (0, i), (-1, i), LIGHT_GREEN if i % 2 == 0 else WHITE) for i in range(1, 6)],
        ('GRID', (0, 0), (-1, -1), 0.3, colors.HexColor("#D0D0D0")),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('TOPPADDING', (0, 0), (-1, -1), 5),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
        ('LEFTPADDING', (0, 0), (-1, -1), 5),
    ]))
    story.append(ai_table)

    story.append(Spacer(1, 10))
    story.append(Paragraph("<b>Disease Detection Workflow</b>", s["SubHead"]))
    story.append(Paragraph(
        "1. The farmer opens the Disease Detection screen and either captures a photo with "
        "the device camera or selects one from the gallery.",
        s["Body"]
    ))
    story.append(Paragraph(
        "2. The image is encoded as base64 and sent to the backend API, which forwards it to "
        "the Groq Vision API with a specialized prompt for African crop pathology.",
        s["Body"]
    ))
    story.append(Paragraph(
        "3. The LLaMA 4 Scout model analyzes the image and returns a structured JSON response "
        "including the disease name, confidence score (0-1), severity level, specific treatment "
        "steps for Cameroon, and prevention advice.",
        s["Body"]
    ))
    story.append(Paragraph(
        "4. The backend enriches this result with curated data from the local disease database "
        "(7 diseases with detailed treatments). If the farmer's language is French, the result "
        "is automatically translated by the LLM.",
        s["Body"]
    ))
    story.append(Paragraph(
        "5. The farmer receives the complete diagnosis on screen. They can then consult the "
        "AI chatbot for follow-up questions or book an expert consultation for human verification.",
        s["Body"]
    ))

    # =====================================================================
    #  7. INNOVATION & DIFFERENTIATION
    # =====================================================================
    story.append(Spacer(1, 16))
    story.append(SectionHeader(7, "INNOVATION & DIFFERENTIATION"))
    story.append(Spacer(1, 14))

    story.append(Paragraph(
        "YCD Farmer Guide is distinguished by several innovations that set it apart from "
        "existing agricultural technology solutions:",
        s["Body"]
    ))

    innovations = [
        ("<b>Voice-First Design for Inclusivity:</b> While most agritech apps assume literate, "
         "tech-savvy users, YCD Farmer Guide was designed voice-first. Farmers can speak to "
         "the app in French or English and receive spoken responses — no typing, no reading "
         "required. This makes advanced AI accessible to users with limited literacy, a "
         "population entirely excluded by existing solutions."),
        ("<b>All-in-One Ecosystem:</b> Rather than offering a single feature (disease detection "
         "OR marketplace OR weather), YCD Farmer Guide integrates the entire farmer journey — "
         "from crop health monitoring to expert consultations to selling produce — in one app. "
         "This reduces the burden of downloading and learning multiple tools."),
        ("<b>Human-AI Collaboration:</b> The app does not position AI as a replacement for "
         "human expertise. Instead, farmers can verify AI-generated diagnoses by booking "
         "consultations with certified agronomists directly within the same app. Experts also "
         "advise farmers on the correct use of fertilizers and inputs purchased through the "
         "marketplace, ensuring products are applied safely and effectively. This builds "
         "trust and ensures accuracy."),
        ("<b>Offline-First Architecture:</b> SQLite local database with priority-based sync "
         "queue means the app works without internet. When connectivity returns, data "
         "automatically synchronizes. A stale-while-revalidate cache pattern ensures farmers "
         "always see data even in network dead zones."),
        ("<b>Local Payment Integration:</b> Instead of international payment gateways, the app "
         "integrates MTN Mobile Money and Orange Money — the payment methods actually used by "
         "99% of the target population. An escrow system protects both buyers and sellers."),
        ("<b>Geospatial Intelligence:</b> PostGIS-powered farm mapping, OpenStreetMap market "
         "discovery, GPS-based weather, and location-aware community forums — all leveraging "
         "geolocation to provide contextually relevant information."),
    ]
    for inn in innovations:
        story.append(Paragraph(f"•  {inn}", s["BulletBody"]))

    # =====================================================================
    #  8. SOCIAL IMPACT & SDGs
    # =====================================================================
    story.append(PageBreak())
    story.append(SectionHeader(8, "SOCIAL IMPACT & SDG ALIGNMENT"))
    story.append(Spacer(1, 14))

    story.append(Paragraph(
        "YCD Farmer Guide directly contributes to multiple United Nations Sustainable Development "
        "Goals, making measurable impact in the communities it serves:",
        s["Body"]
    ))

    sdg_data = [
        ["SDG", "Goal", "Contribution"],
        ["SDG 1", "No Poverty", "Increases farmer income through direct market access, fair pricing, "
         "and elimination of exploitative middlemen."],
        ["SDG 2", "Zero Hunger", "Reduces crop losses through AI disease identification, weather "
         "alerts, and expert agricultural guidance — improving food security."],
        ["SDG 4", "Quality Education", "Provides an educational platform with farming knowledge "
         "base, AI-powered guidance, and peer-to-peer learning via community forums."],
        ["SDG 8", "Decent Work", "Creates economic opportunities: experts earn from consultations, "
         "farmers sell at fair prices, and digital jobs emerge around the platform."],
        ["SDG 9", "Industry & Innovation", "Applies cutting-edge AI (LLaMA 4, Whisper) to solve "
         "traditional agricultural challenges — technology innovation for societal good."],
        ["SDG 10", "Reduced Inequality", "Voice interface and bilingual design ensure digital "
         "inclusion for low-literacy and marginalized farming communities."],
        ["SDG 12", "Responsible Consumption", "AI-guided treatments reduce pesticide overuse; "
         "marketplace reduces food waste by connecting supply to demand."],
        ["SDG 13", "Climate Action", "Weather intelligence and crop-weather impact analysis help "
         "farmers adapt to climate change and extreme weather events."],
        ["SDG 17", "Partnerships", "Built by a multidisciplinary team under a social enterprise, "
         "engaging universities, communities, and technology partners."],
    ]

    sdg_table = Table(sdg_data, colWidths=[42, 80, usable_w - 122])
    sdg_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), DEEP_GREEN),
        ('TEXTCOLOR', (0, 0), (-1, 0), WHITE),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 8.5),
        ('FONTNAME', (0, 1), (0, -1), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 1), (-1, -1), 8),
        ('TEXTCOLOR', (0, 1), (0, -1), ACCENT_GREEN),
        ('TEXTCOLOR', (1, 1), (-1, -1), DARK_GREY),
        *[('BACKGROUND', (0, i), (-1, i), LIGHT_GREEN if i % 2 == 0 else WHITE)
          for i in range(1, len(sdg_data))],
        ('GRID', (0, 0), (-1, -1), 0.3, colors.HexColor("#D0D0D0")),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('TOPPADDING', (0, 0), (-1, -1), 4),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
        ('LEFTPADDING', (0, 0), (-1, -1), 5),
    ]))
    story.append(sdg_table)

    story.append(Spacer(1, 10))
    story.append(Paragraph("<b>Measurable Impact Targets</b>", s["SubHead"]))
    impact_targets = [
        "50,000+ smallholder farmers reached across all 10 regions of Cameroon within 2 years",
        "200 rural digital ambassadors trained to help farmers adopt the technology",
        "30% reduction in crop losses for active users through AI-guided disease management",
        "Direct market access for farmers, reducing dependency on middlemen by 50%",
        "100+ certified agronomists onboarded to provide expert consultations",
    ]
    for it in impact_targets:
        story.append(Paragraph(
            f'<font color="{ACCENT_GREEN.hexval()}">▸</font>  {it}',
            s["BulletBody"]
        ))

    # =====================================================================
    #  9. IMPLEMENTATION STATUS & SCALABILITY
    # =====================================================================
    story.append(PageBreak())
    story.append(SectionHeader(9, "IMPLEMENTATION STATUS & SCALABILITY"))
    story.append(Spacer(1, 14))

    story.append(Paragraph(
        "YCD Farmer Guide is <b>not a concept or mockup</b>. The application is fully built, "
        "tested, and deployed:",
        s["Body"]
    ))

    status_data = [
        ["Metric", "Status"],
        ["Frontend Screens", "29 screens (18 main + 11 admin) — fully implemented"],
        ["Backend Controllers", "34 API controller modules — all operational"],
        ["Database Models", "43 Sequelize models with PostGIS — production-ready"],
        ["Database Migrations", "Full migration suite for automated deployment"],
        ["AI Integration", "3 Groq models + Google TTS — live and tested"],
        ["Payment System", "MTN MoMo + Orange Money + Wallet + Escrow — integrated"],
        ["Real-Time", "Socket.IO with 10+ event types — operational"],
        ["Deployment", "Railway Cloud (backend) + EAS Build (mobile) — deployed"],
        ["Version Control", "Git with 2 remote repositories on GitHub"],
        ["Code Volume", "34 controllers, 34 services, 32 components, 43 models, 35 routes"],
    ]

    status_table = Table(status_data, colWidths=[120, usable_w - 120])
    status_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), DEEP_GREEN),
        ('TEXTCOLOR', (0, 0), (-1, 0), WHITE),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 9),
        ('FONTNAME', (0, 1), (0, -1), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 1), (-1, -1), 8.5),
        ('TEXTCOLOR', (0, 1), (0, -1), DEEP_GREEN),
        *[('BACKGROUND', (0, i), (-1, i), LIGHT_GREEN if i % 2 == 0 else WHITE)
          for i in range(1, len(status_data))],
        ('GRID', (0, 0), (-1, -1), 0.3, colors.HexColor("#D0D0D0")),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('TOPPADDING', (0, 0), (-1, -1), 4),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
        ('LEFTPADDING', (0, 0), (-1, -1), 6),
    ]))
    story.append(status_table)

    story.append(Spacer(1, 10))
    story.append(Paragraph("<b>Scalability Roadmap</b>", s["SubHead"]))
    story.append(Paragraph(
        "The platform is architected for progressive expansion across multiple dimensions:",
        s["Body"]
    ))

    scaling_items = [
        "<b>Voice in Local Languages:</b> The voice interface currently supports French and English. "
        "The next phase will extend speech-to-text and text-to-speech to major Cameroonian languages "
        "(Pidgin English, Ewondo, Fulfulde, Duala, Bamiléké) — enabling the 60%+ of rural farmers "
        "who communicate primarily in local languages to use the app in their mother tongue.",
        "<b>Video & Audio Calls with Experts:</b> Expert consultations currently use real-time "
        "text chat with image sharing. The planned upgrade introduces in-app video and audio "
        "calling, allowing farmers to show their fields live and receive immediate verbal guidance "
        "from agronomists — critical for urgent crop emergencies.",
        "<b>Pan-African Expansion:</b> The crop disease database and regional intelligence can be "
        "populated with data from any African country. The mobile money integration can be adapted "
        "to M-Pesa, Airtel Money, and other regional providers.",
        "<b>Infrastructure Scaling:</b> Railway Cloud auto-scales based on demand. PostgreSQL "
        "supports horizontal read replicas. The architecture is designed to serve 100,000+ "
        "concurrent users without redesign.",
    ]
    for item in scaling_items:
        story.append(Paragraph(
            f'<font color="{ACCENT_GREEN.hexval()}">▸</font>  {item}',
            s["BulletBody"]
        ))

    # =====================================================================
    #  10. THE TEAM
    # =====================================================================
    story.append(PageBreak())
    story.append(SectionHeader(10, "THE TEAM"))
    story.append(Spacer(1, 14))

    story.append(Paragraph(
        "YCD Farmer Guide is built by a <b>multidisciplinary team of five Cameroonians</b> "
        "working under <b>Youths &amp; Contemporary Development (YCD)</b>, a social enterprise "
        "based in Yaoundé dedicated to empowering youth through innovation and sustainable "
        "development. The team spans five disciplines across multiple institutions:",
        s["Body"]
    ))
    story.append(Spacer(1, 6))

    for i, member in enumerate(TEAM):
        leader_tag = "  (Team Lead)" if i == 0 else ""
        # Member card
        member_data = [
            [
                Paragraph(f'<b>{member["name"]}</b>{leader_tag}', s["TeamName"]),
            ],
            [
                Paragraph(
                    f'<font color="{ACCENT_GREEN.hexval()}">{member["role"]}</font><br/>'
                    f'<font color="{MID_GREY.hexval()}">{member["field"]}  —  {member["uni"]}</font>',
                    s["TeamInfo"]
                ),
            ],
            [
                Paragraph(member["contrib"], s["TeamInfo"]),
            ],
        ]

        member_table = Table(member_data, colWidths=[usable_w - 10])
        member_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, -1), CARD_BG if i % 2 == 0 else WHITE),
            ('TOPPADDING', (0, 0), (-1, -1), 3),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 2),
            ('LEFTPADDING', (0, 0), (-1, -1), 10),
            ('LINEAFTER', (0, 0), (0, -1), 3, ACCENT_GREEN if i == 0 else MID_GREEN),
        ]))
        story.append(KeepTogether([member_table, Spacer(1, 6)]))

    # ── CLOSING ──────────────────────────────────────────────────────────
    story.append(Spacer(1, 16))
    story.append(HRFlowable(width="60%", thickness=1, color=ACCENT_GREEN,
                              spaceBefore=4, spaceAfter=8))
    story.append(Paragraph(
        '<b>Youths &amp; Contemporary Development (YCD)</b><br/>'
        'Mfandena, Yaoundé, Cameroon<br/>'
        'info@youth-contemporary-development.com  |  (+237) 674 510 163<br/>'
        'www.youth-contemporary-development.com',
        s["FootNote"]
    ))
    story.append(Spacer(1, 8))
    story.append(Paragraph(
        '<i>"Technology that speaks the language of farmers and solves real problems in the field."</i>',
        s["QuoteStyle"]
    ))

    # ── BUILD ────────────────────────────────────────────────────────────
    print("  Building PDF...")
    doc.build(story, onFirstPage=draw_cover, onLaterPages=draw_later_pages)

    size_kb = os.path.getsize(OUTPUT_PDF) / 1024
    print(f"\n  ✓ Output: {OUTPUT_PDF}")
    print(f"  ✓ Size: {size_kb:.1f} KB")

    # Page count
    try:
        import fitz
        pdoc = fitz.open(OUTPUT_PDF)
        print(f"  ✓ Pages: {len(pdoc)}")
        pdoc.close()
    except ImportError:
        pass

    print("=" * 60)


if __name__ == "__main__":
    build_document()
