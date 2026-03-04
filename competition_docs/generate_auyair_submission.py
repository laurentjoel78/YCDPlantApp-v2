#!/usr/bin/env python3
"""
YCD Farmer Guide — Project Introduction PDF
Presidential African Youth in AI & Robotics Competition 2026

Simple, clean, professional document.
"""

from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch, cm
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
    HRFlowable, KeepTogether, PageBreak
)
from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_JUSTIFY, TA_LEFT, TA_RIGHT
from reportlab.platypus.flowables import Flowable
import os, re

OUTPUT_DIR = os.path.dirname(os.path.abspath(__file__))
OUTPUT_PDF = os.path.join(OUTPUT_DIR, "YCD_FarmerGuide_AUYAIR_2026.pdf")

# ─── COLORS ──────────────────────────────────────────────────────────────────
DEEP_GREEN   = colors.HexColor("#0B3D2E")
MID_GREEN    = colors.HexColor("#14713D")
LIGHT_GREEN  = colors.HexColor("#E8F5E9")
SOFT_GREEN   = colors.HexColor("#A8D5A2")
WHITE        = colors.white
BLACK        = colors.HexColor("#1A1A1A")
GREY         = colors.HexColor("#555555")
DARK_GREY    = colors.HexColor("#333333")

W, H = A4

# ─── TEAM ────────────────────────────────────────────────────────────────────
TEAM = [
    ("Ikome Johnson", "Team Lead / Systems & Connectivity", "20", "03/06/2005", "Limbe", "Network Engineering (Level 500)"),
    ("Mkounga Tatchum Laurent Joël", "Technical Lead / Core Development", "21", "10/08/2004", "Bandjoun", "Software Engineering"),
    ("Njobeka Boris Beyieh", "Software Developer", "20", "29/12/2005", "Cameroon", "Software Engineering (Level 300)"),
    ("Awambeng Sylvie Mankambe", "Post-Harvest & Value Chain Advisor", "30", "24/07/1995", "Nsem-Bafut", "Food Science"),
    ("Tata Stanley Lem-Mola", "Crop Health & Biological Systems", "18", "23/07/2007", "Shisong", "Microbiology"),
]


# ─── COVER PAGE ──────────────────────────────────────────────────────────────
def draw_cover(canvas, doc):
    canvas.saveState()

    # Full deep green background
    canvas.setFillColor(DEEP_GREEN)
    canvas.rect(0, 0, W, H, fill=1, stroke=0)

    # Thin accent lines
    canvas.setStrokeColor(SOFT_GREEN)
    canvas.setLineWidth(0.8)
    canvas.line(80, H - 260, W - 80, H - 260)
    canvas.line(80, 230, W - 80, 230)

    # Competition name
    canvas.setFillColor(SOFT_GREEN)
    canvas.setFont("Helvetica", 11)
    canvas.drawCentredString(W / 2, H - 130,
        "Presidential African Youth in Artificial Intelligence & Robotics Competition")
    canvas.setFont("Helvetica", 10)
    canvas.drawCentredString(W / 2, H - 148,
        "Co-convened by AUDA-NEPAD & Ele-vate AI Africa  |  2026 Edition")

    # Project title
    canvas.setFillColor(WHITE)
    canvas.setFont("Helvetica-Bold", 36)
    canvas.drawCentredString(W / 2, H - 340, "YCD Farmer Guide")

    canvas.setFont("Helvetica", 15)
    canvas.setFillColor(SOFT_GREEN)
    canvas.drawCentredString(W / 2, H - 370,
        "AI-Powered Agricultural Support Platform")

    # Tagline
    canvas.setFont("Helvetica-Oblique", 11)
    canvas.setFillColor(colors.HexColor("#D0E8D0"))
    canvas.drawCentredString(W / 2, H - 420,
        '"Technology that speaks the language of farmers')
    canvas.drawCentredString(W / 2, H - 436,
        'and solves real problems in the field."')

    # Metadata
    canvas.setFont("Helvetica", 9.5)
    x_label = 170
    x_value = 295
    y_start = 380
    meta = [
        ("Category:", "Artificial Intelligence & Emerging Technologies"),
        ("Domain:", "AgriTech — Smart Agriculture"),
        ("Submission Type:", "Group Project (5 Members)"),
        ("Country:", "Cameroon"),
        ("Group Leader:", "Ikome Johnson"),
        ("Date:", "March 4, 2026"),
    ]
    for i, (label, value) in enumerate(meta):
        y = y_start - i * 22
        canvas.setFillColor(SOFT_GREEN)
        canvas.drawRightString(x_label, y, label)
        canvas.setFillColor(WHITE)
        canvas.drawString(x_value, y, value)

    # Bottom
    canvas.setFont("Helvetica", 8)
    canvas.setFillColor(colors.HexColor("#88B888"))
    canvas.drawCentredString(W / 2, 60, "www.youth-contemporary-development.com")

    canvas.restoreState()


def draw_later_pages(canvas, doc):
    canvas.saveState()
    canvas.setStrokeColor(MID_GREEN)
    canvas.setLineWidth(0.5)
    canvas.line(50, 42, W - 50, 42)
    canvas.setFont("Helvetica", 8)
    canvas.setFillColor(GREY)
    canvas.drawCentredString(W / 2, 28,
        f"YCD Farmer Guide — AUYAIR 2026  |  Page {doc.page}")
    canvas.restoreState()


# ─── STYLES ──────────────────────────────────────────────────────────────────
def get_styles():
    base = getSampleStyleSheet()

    base.add(ParagraphStyle("H1", parent=base["Heading1"],
        fontSize=16, leading=20, textColor=DEEP_GREEN,
        fontName="Helvetica-Bold", spaceBefore=18, spaceAfter=6))

    base.add(ParagraphStyle("H2", parent=base["Heading2"],
        fontSize=12, leading=16, textColor=MID_GREEN,
        fontName="Helvetica-Bold", spaceBefore=12, spaceAfter=4))

    base.add(ParagraphStyle("Body", parent=base["Normal"],
        fontSize=10.5, leading=15, textColor=BLACK,
        fontName="Helvetica", alignment=TA_JUSTIFY, spaceAfter=8))

    base.add(ParagraphStyle("Small", parent=base["Normal"],
        fontSize=9, leading=13, textColor=GREY,
        fontName="Helvetica", spaceAfter=2))

    base.add(ParagraphStyle("SmallCenter", parent=base["Normal"],
        fontSize=9, leading=13, textColor=GREY,
        fontName="Helvetica", alignment=TA_CENTER))

    base.add(ParagraphStyle("MemberName", parent=base["Normal"],
        fontSize=10.5, leading=14, textColor=DEEP_GREEN,
        fontName="Helvetica-Bold", spaceAfter=0))

    base.add(ParagraphStyle("MemberInfo", parent=base["Normal"],
        fontSize=9.5, leading=13, textColor=DARK_GREY,
        fontName="Helvetica", spaceAfter=1))

    return base


def green_line():
    return HRFlowable(width="100%", thickness=1, color=MID_GREEN, spaceBefore=2, spaceAfter=6)


def count_words(text):
    clean = re.sub(r'<[^>]+>', '', text)
    return len(clean.split())


# ─── ESSAY (~800 words) ─────────────────────────────────────────────────────

def build_essay(story, s):
    story.append(Paragraph("Project Introduction", s["H1"]))
    story.append(green_line())

    paras = [
        # P1 — Context & Problem (~135 words)
        "Agriculture is the foundation of Africa's economy, employing over 60 percent of the population "
        "and sustaining millions of families across the continent. In Cameroon, more than 70 percent of "
        "rural households depend on smallholder farming for their livelihood. Despite this critical role, "
        "farmers face enormous challenges every single growing season. Plant diseases destroy up to 40 "
        "percent of harvests before crops ever reach the market. Unpredictable and increasingly severe "
        "weather patterns make it nearly impossible to plan planting and harvesting cycles with any "
        "confidence. Most farmers lack access to trained agronomists, and the few government agricultural "
        "extension services available reach fewer than one in ten farming communities. Meanwhile, "
        "exploitative middlemen control market access, forcing farmers to sell their hard-earned produce "
        "at unfairly low prices. The result is a persistent, devastating cycle of poverty, food "
        "insecurity, and lost economic potential that affects entire communities.",

        # P2 — Our Solution (111 words)
        "<b>YCD Farmer Guide</b> is a mobile application built to put powerful agricultural tools directly "
        "into the hands of smallholder farmers. Designed for basic Android smartphones, the app combines "
        "artificial intelligence, real-time information, and community support into one simple platform "
        "that any farmer can use. Our goal is to close the knowledge gap between what agricultural science "
        "knows and what farmers in the field can access. Whether a farmer needs to identify a disease on "
        "their cassava leaves, check the weather forecast before planting, find a fair buyer for their "
        "tomatoes, or ask an expert for advice, YCD Farmer Guide provides the answer — quickly, simply, "
        "and affordably.",

        # P3 — Innovation: AI Disease Detection (~130 words)
        "The most innovative feature of our platform is <b>AI-powered crop disease detection</b>. A farmer "
        "simply takes a photograph of a sick plant using their phone camera. Within seconds, our artificial "
        "intelligence system analyses the image and tells the farmer exactly what disease is affecting "
        "their crop, how confident the diagnosis is, what treatment to apply immediately, and how to "
        "prevent the disease from spreading to other plants. This guidance is provided in both French and "
        "English, the two official languages of Cameroon. For farmers who cannot read easily, a built-in "
        "<b>voice interface</b> allows them to speak to the app naturally in their preferred language and "
        "receive clear spoken responses. This single innovation makes advanced agricultural science truly "
        "accessible to every farmer across the country, regardless of their education or literacy level.",

        # P4 — Functionality: Features (121 words)
        "Beyond disease detection, YCD Farmer Guide offers several practical features that support the "
        "farmer's daily life. A <b>weather service</b> delivers seven-day forecasts specific to the "
        "farmer's location, with clear advice on when to plant, irrigate, or harvest. A built-in "
        "<b>marketplace</b> allows farmers to buy seeds, fertilizers, and tools, and to sell their "
        "produce directly to buyers without going through a middleman. An <b>expert consultation</b> "
        "service connects farmers with certified agronomists through chat or video calls, so they can "
        "get professional advice without travelling long distances. A <b>community forum</b> lets farmers "
        "from the same region share tips, ask questions, and learn from each other, building a network "
        "of shared knowledge that benefits everyone.",

        # P5 — Impact & Scale (~130 words)
        "The impact of YCD Farmer Guide is designed to be both measurable and deeply significant. We aim "
        "to reach over <b>50,000 farmers across all 10 regions of Cameroon</b> within two years of full "
        "deployment. By enabling early disease detection, we project a <b>30 percent reduction in crop "
        "losses</b> for active users, potentially saving thousands of tonnes of produce each season. By "
        "connecting farmers directly with buyers through the integrated marketplace, we expect income "
        "increases of <b>up to two times</b> their current earnings. The platform directly supports six "
        "United Nations Sustainable Development Goals: No Poverty, Zero Hunger, Decent Work and Economic "
        "Growth, Industry and Innovation, Responsible Consumption and Production, and Climate Action. Our "
        "freemium model keeps all essential features completely free for farmers, with revenue generated "
        "through premium consultations and small marketplace transaction fees.",

        # P6 — Sustainability & Team (~120 words)
        "YCD Farmer Guide is built to last and to grow. The cloud-based system can scale from hundreds "
        "to hundreds of thousands of users without any interruption in service. The AI models improve "
        "continuously as more farmers use the platform, becoming more accurate and reliable with every "
        "new diagnosis. Our business model is financially sustainable through consultation fees, "
        "marketplace commissions, and strategic partnerships with agricultural cooperatives and "
        "development organisations. The project is built by a dedicated team of five young Cameroonians "
        "with complementary backgrounds in software engineering, network systems, food science, and "
        "microbiology. We are united by a single powerful belief: that African youth can build technology "
        "that transforms lives, starting with the farmers who feed our continent.",

        # P7 — Closing (~50 words)
        "YCD Farmer Guide is not just an application. It is a bridge between the Fourth Industrial "
        "Revolution and the farms that sustain Africa. Our team is ready to prove that young Africans "
        "can design, build, and deploy world-class AI solutions that address the continent's most "
        "pressing challenges. We are building the future of agriculture, one farmer at a time.",
    ]

    total = 0
    for p in paras:
        total += count_words(p)
        story.append(Paragraph(p, s["Body"]))

    print(f"  Essay word count: {total}")
    story.append(PageBreak())


# ─── TEAM ────────────────────────────────────────────────────────────────────

def build_team(story, s):
    story.append(Paragraph("Team Members", s["H1"]))
    story.append(green_line())

    story.append(Paragraph(
        "This is a <b>group project</b> submitted by the group leader, <b>Ikome Johnson</b>. "
        "Our team of five young Cameroonians combines expertise in engineering, agriculture, "
        "food science, and biology.",
        s["Body"]
    ))
    story.append(Spacer(1, 8))

    for i, (name, role, age, dob, pob, field) in enumerate(TEAM):
        tag = "  [Group Leader]" if i == 0 else ""
        block = [
            Paragraph(f"{i+1}. {name}{tag}", s["MemberName"]),
            Paragraph(f"<b>Role:</b> {role}", s["MemberInfo"]),
            Paragraph(f"<b>Age:</b> {age}  |  <b>Date of Birth:</b> {dob}  |  <b>Place of Birth:</b> {pob}", s["MemberInfo"]),
            Paragraph(f"<b>Field of Study:</b> {field}", s["MemberInfo"]),
            Spacer(1, 10),
        ]
        story.append(KeepTogether(block))

    story.append(PageBreak())


# ─── FEATURES (farmer-friendly) ─────────────────────────────────────────────

def build_features(story, s):
    story.append(Paragraph("What YCD Farmer Guide Does for Farmers", s["H1"]))
    story.append(green_line())

    features = [
        ("Identify Crop Diseases Instantly",
         "Take a photo of a sick plant with your phone. The app tells you what disease it is, "
         "how to treat it, and how to stop it from spreading — in French or English."),

        ("Get Weather Forecasts for Your Area",
         "See a seven-day weather forecast for your exact location. The app advises you on the "
         "best days to plant, water, or harvest your crops."),

        ("Buy and Sell on the Marketplace",
         "Buy seeds, fertilizers, and farming tools directly through the app. Sell your produce "
         "to buyers at fair prices without needing a middleman."),

        ("Talk to Agricultural Experts",
         "Book a consultation with a certified agronomist through chat or video call. Get "
         "professional advice from the comfort of your farm."),

        ("Learn from Other Farmers",
         "Join community discussions with farmers in your region. Share tips, ask questions, "
         "and discover what is working for others nearby."),

        ("Use Your Voice",
         "Speak to the app in French or English instead of typing. The app understands your "
         "voice and responds, making it easy for everyone to use."),
    ]

    for title, desc in features:
        story.append(Paragraph(title, s["H2"]))
        story.append(Paragraph(desc, s["Body"]))

    story.append(PageBreak())


# ─── IMPACT ──────────────────────────────────────────────────────────────────

def build_impact(story, s):
    story.append(Paragraph("Impact and Sustainability", s["H1"]))
    story.append(green_line())

    story.append(Paragraph("<b>Projected Impact</b>", s["H2"]))
    for item in [
        "Reach <b>50,000+ farmers</b> across all 10 regions of Cameroon within two years.",
        "Reduce crop losses by <b>30%</b> through early AI-powered disease detection.",
        "Increase farmer income by <b>up to 2x</b> through direct marketplace access.",
        "Provide instant agricultural advice, reducing response time from days to seconds.",
    ]:
        story.append(Paragraph(f"•  {item}", s["Body"]))

    story.append(Spacer(1, 4))
    story.append(Paragraph("<b>Sustainability</b>", s["H2"]))
    story.append(Paragraph(
        "All core features — disease detection, weather forecasts, and community forums — remain "
        "free for every farmer. The platform sustains itself through small fees on premium expert "
        "consultations and marketplace transactions, along with partnerships with agricultural "
        "cooperatives and development organisations.",
        s["Body"]
    ))

    story.append(Spacer(1, 4))
    story.append(Paragraph("<b>UN Sustainable Development Goals</b>", s["H2"]))
    story.append(Paragraph(
        "YCD Farmer Guide directly supports SDG 1 (No Poverty), SDG 2 (Zero Hunger), "
        "SDG 8 (Decent Work &amp; Economic Growth), SDG 9 (Industry &amp; Innovation), "
        "SDG 12 (Responsible Production), and SDG 13 (Climate Action).",
        s["Body"]
    ))

    story.append(Spacer(1, 24))
    story.append(HRFlowable(width="60%", thickness=0.5, color=MID_GREEN, spaceBefore=4, spaceAfter=8))
    story.append(Paragraph(
        "YCD Farmer Guide  |  Presidential African Youth in AI &amp; Robotics Competition 2026",
        s["SmallCenter"]
    ))
    story.append(Paragraph(
        "Contact: Ikome Johnson (Group Leader)  |  www.youth-contemporary-development.com",
        s["SmallCenter"]
    ))


# ─── MAIN ────────────────────────────────────────────────────────────────────

def generate():
    print("=" * 55)
    print("  YCD Farmer Guide — AUYAIR 2026 PDF")
    print("=" * 55)

    doc = SimpleDocTemplate(
        OUTPUT_PDF, pagesize=A4,
        rightMargin=0.75 * inch, leftMargin=0.75 * inch,
        topMargin=0.65 * inch, bottomMargin=0.7 * inch,
        title="YCD Farmer Guide — Project Introduction",
        author="Ikome Johnson & Team",
        subject="Presidential African Youth in AI & Robotics Competition 2026",
    )

    s = get_styles()
    story = []

    # Cover page — drawn via canvas callback, spacer pushes to page 2
    story.append(Spacer(1, 700))
    story.append(PageBreak())

    print("  [1/4] Writing project introduction essay...")
    build_essay(story, s)

    print("  [2/4] Adding team members...")
    build_team(story, s)

    print("  [3/4] Describing features for farmers...")
    build_features(story, s)

    print("  [4/4] Adding impact and sustainability...")
    build_impact(story, s)

    print("\n  Building PDF...")
    doc.build(story, onFirstPage=draw_cover, onLaterPages=draw_later_pages)

    size_kb = os.path.getsize(OUTPUT_PDF) / 1024
    print(f"\n  Done! {OUTPUT_PDF}")
    print(f"  Size: {size_kb:.1f} KB")
    print("=" * 55)


if __name__ == "__main__":
    generate()
