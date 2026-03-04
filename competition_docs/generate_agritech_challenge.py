#!/usr/bin/env python3
"""
YCD Farmer Guide — Presentation of the Solution
AgriTech Innovation Challenge 2026 (PATNUC / Banque Mondiale)

Requirements:
  - Maximum 3 pages
  - Font size 12
  - Line spacing 1.15
  - Sections: Problem, Innovation, Summary, Beneficiaries, Revenue, Team
"""

from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
    HRFlowable, KeepTogether, PageBreak
)
from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_JUSTIFY, TA_LEFT
import os

OUTPUT_DIR = os.path.dirname(os.path.abspath(__file__))
OUTPUT_PDF = os.path.join(OUTPUT_DIR, "YCD_FarmerGuide_AgriTechChallenge_2026.pdf")

# Colors — understated, professional
DEEP_GREEN  = colors.HexColor("#0B3D2E")
MID_GREEN   = colors.HexColor("#14713D")
BLACK       = colors.HexColor("#1A1A1A")
GREY        = colors.HexColor("#666666")
WHITE       = colors.white

W, H = A4
FONT_SIZE = 12
LEADING = FONT_SIZE * 1.15  # line spacing 1.15

# Team (5 members max)
TEAM = [
    ("Ikome Johnson", "Team Lead — Network Engineering", "Project coordination, systems integration, and connectivity strategy."),
    ("Mkounga Tatchum Laurent Joël", "Technical Lead — Software Engineering", "System architecture, full-stack development, AI integration, and platform design."),
    ("Njobeka Boris Beyieh", "Software Developer — Software Engineering", "Mobile application development, feature implementation, and testing."),
    ("Awambeng Sylvie Mankambe", "Value Chain Advisor — Food Science", "Post-harvest advisory, food preservation strategies, and marketplace feature design."),
    ("Tata Stanley Lem-Mola", "Crop Health Support — Microbiology", "Disease detection domain knowledge and biological systems validation."),
]


def draw_header_footer(canvas, doc):
    """Minimal header/footer on every page."""
    canvas.saveState()
    # Top line
    canvas.setStrokeColor(MID_GREEN)
    canvas.setLineWidth(0.7)
    canvas.line(50, H - 38, W - 50, H - 38)
    # Header text
    canvas.setFont("Helvetica", 8)
    canvas.setFillColor(GREY)
    canvas.drawString(52, H - 34, "YCD Farmer Guide — AgriTech Innovation Challenge 2026")
    canvas.drawRightString(W - 52, H - 34, "Youths & Contemporary Development")
    # Bottom line
    canvas.setLineWidth(0.5)
    canvas.line(50, 40, W - 50, 40)
    # Page number
    canvas.drawCentredString(W / 2, 28, f"Page {doc.page} / 3")
    canvas.restoreState()


def get_styles():
    base = getSampleStyleSheet()

    # Document title (used once, centered)
    base.add(ParagraphStyle("DocTitle",
        fontSize=16, leading=16 * 1.15, textColor=DEEP_GREEN,
        fontName="Helvetica-Bold", alignment=TA_CENTER,
        spaceBefore=0, spaceAfter=2))

    base.add(ParagraphStyle("DocSubtitle",
        fontSize=11, leading=11 * 1.15, textColor=MID_GREEN,
        fontName="Helvetica", alignment=TA_CENTER,
        spaceBefore=0, spaceAfter=4))

    # Section headings
    base.add(ParagraphStyle("SH",
        fontSize=FONT_SIZE, leading=LEADING, textColor=DEEP_GREEN,
        fontName="Helvetica-Bold", spaceBefore=10, spaceAfter=3))

    # Body text — font 12, line spacing 1.15, justified
    base.add(ParagraphStyle("B",
        fontSize=FONT_SIZE, leading=LEADING, textColor=BLACK,
        fontName="Helvetica", alignment=TA_JUSTIFY,
        spaceBefore=0, spaceAfter=5))

    # Body bold
    base.add(ParagraphStyle("BB",
        fontSize=FONT_SIZE, leading=LEADING, textColor=BLACK,
        fontName="Helvetica-Bold", alignment=TA_JUSTIFY,
        spaceBefore=0, spaceAfter=5))

    # Small (team details)
    base.add(ParagraphStyle("TeamName",
        fontSize=11, leading=11 * 1.15, textColor=DEEP_GREEN,
        fontName="Helvetica-Bold", spaceBefore=0, spaceAfter=0))

    base.add(ParagraphStyle("TeamInfo",
        fontSize=10.5, leading=10.5 * 1.15, textColor=BLACK,
        fontName="Helvetica", spaceBefore=0, spaceAfter=1))

    base.add(ParagraphStyle("SmallCenter",
        fontSize=9, leading=9 * 1.15, textColor=GREY,
        fontName="Helvetica", alignment=TA_CENTER))

    return base


def section_line():
    return HRFlowable(width="100%", thickness=0.7, color=MID_GREEN,
                       spaceBefore=1, spaceAfter=4)


def build_document():
    print("=" * 55)
    print("  AgriTech Innovation Challenge 2026 — PDF")
    print("=" * 55)

    doc = SimpleDocTemplate(
        OUTPUT_PDF, pagesize=A4,
        rightMargin=0.75 * inch, leftMargin=0.75 * inch,
        topMargin=0.6 * inch, bottomMargin=0.65 * inch,
        title="YCD Farmer Guide — Presentation of the Solution",
        author="Youths & Contemporary Development",
        subject="AgriTech Innovation Challenge 2026",
    )

    s = get_styles()
    story = []

    # ── TITLE BLOCK ──────────────────────────────────────────────────────
    story.append(Spacer(1, 8))
    story.append(Paragraph("PRESENTATION OF THE SOLUTION", s["DocTitle"]))
    story.append(Paragraph(
        "YCD Farmer Guide — AI-Powered Agricultural Support Platform", s["DocSubtitle"]))
    story.append(Paragraph(
        "Submitted by Youths &amp; Contemporary Development (YCD)  |  Yaoundé, Cameroon",
        s["DocSubtitle"]))
    story.append(HRFlowable(width="100%", thickness=1.2, color=DEEP_GREEN,
                              spaceBefore=6, spaceAfter=10))

    # ── ABOUT THE STARTUP ────────────────────────────────────────────────
    story.append(Paragraph("About the Startup", s["SH"]))
    story.append(section_line())
    story.append(Paragraph(
        "<b>Youths &amp; Contemporary Development (YCD)</b> is a social enterprise based in "
        "Yaoundé, Cameroon, dedicated to empowering young people and promoting sustainable "
        "development. Founded with the belief that today's youth are active changemakers — not "
        "just leaders of tomorrow — YCD operates at the intersection of education, innovation, "
        "and community engagement. The organisation's mission is to nurture the potential of "
        "young Cameroonians through skills development, entrepreneurship, mentorship, and civic "
        "engagement, ensuring that every young person has the tools and confidence to shape a "
        "brighter future.",
        s["B"]
    ))
    story.append(Paragraph(
        "YCD's core values are <b>Sustainability, Innovation, Equity, Collaboration, and "
        "Education</b>. Through its programs, YCD equips young people with essential skills in "
        "environmental stewardship, agricultural technology, and leadership. The organisation "
        "conducts hands-on workshops and training sessions, leads awareness campaigns on climate "
        "change and biodiversity conservation, mobilises communities around sustainable agriculture, "
        "and provides mentorship platforms where young leaders connect and collaborate. YCD Farmer "
        "Guide is the organisation's flagship digital product — a direct expression of its mission "
        "to use technology to solve real problems in Cameroon's agricultural sector.",
        s["B"]
    ))
    story.append(Paragraph(
        "<b>Headquarters:</b> Mfandena, Yaoundé, Cameroon  |  "
        "<b>Email:</b> info@youth-contemporary-development.com  |  "
        "<b>Tel:</b> (+237) 674 510 163  |  "
        "<b>Web:</b> www.youth-contemporary-development.com",
        s["B"]
    ))

    # ── 1. THE PROBLEM ───────────────────────────────────────────────────
    story.append(Paragraph("1. The Problem to Be Solved", s["SH"]))
    story.append(section_line())
    story.append(Paragraph(
        "Cameroon's agricultural sector employs over 70% of the rural population, yet smallholder "
        "farmers — who produce the majority of the country's food — remain trapped in a cycle of "
        "low productivity, high losses, and limited market access. Plant diseases destroy up to "
        "40% of harvests annually because farmers lack the tools to identify what is affecting "
        "their crops or access reliable treatment advice. Unpredictable and increasingly severe "
        "weather patterns disrupt planting and harvesting cycles. Fewer than 10% of farming "
        "communities have access to trained agronomists or government extension services. When "
        "farmers do manage a good harvest, they are often forced to sell through exploitative "
        "middlemen at prices well below market value. The knowledge gap between agricultural "
        "research and the farmers who need it most remains vast. Farmers need not only intelligent "
        "digital tools but also the ability to connect with real agricultural experts who can "
        "verify and complement AI-generated diagnoses — ensuring that technology supports, rather "
        "than replaces, trusted human expertise. There is a clear and urgent need for a digital "
        "platform that brings agricultural knowledge, expert validation, fair market access, and "
        "professional support directly to farmers on their smartphones.",
        s["B"]
    ))

    # ── 2. THE INNOVATIVE FACTOR ─────────────────────────────────────────
    story.append(Paragraph("2. The Innovative Factor", s["SH"]))
    story.append(section_line())
    story.append(Paragraph(
        "YCD Farmer Guide's core innovation is <b>AI-powered crop disease detection</b>. A farmer "
        "photographs a sick plant with their phone; within seconds, the AI analyses the image and "
        "provides an accurate diagnosis, a treatment plan, and prevention advice — delivered in "
        "both French and English. A built-in <b>voice interface</b> allows farmers to speak to "
        "the app in their preferred language and receive spoken responses, making the technology "
        "accessible even to users with limited literacy. Unlike any existing tool available to "
        "Cameroonian farmers, YCD Farmer Guide combines real-time AI diagnosis, voice interaction, "
        "expert consultation booking, a farmer-to-buyer marketplace, community forums, and "
        "hyperlocal weather intelligence — all within a single mobile application that works on "
        "basic Android smartphones in low-bandwidth areas.",
        s["B"]
    ))

    # ── 3. THE SUMMARY OF THE SOLUTION ───────────────────────────────────
    story.append(Paragraph("3. Summary of the Solution", s["SH"]))
    story.append(section_line())
    story.append(Paragraph(
        "YCD Farmer Guide is a mobile application that serves as an all-in-one digital companion "
        "for smallholder farmers. The platform includes six key features:",
        s["B"]
    ))

    features = [
        "<b>Disease Detection</b> — photograph a plant and get an instant AI diagnosis with treatment advice.",
        "<b>Weather Forecasts</b> — seven-day hyperlocal forecasts with planting and harvesting advisories.",
        "<b>Marketplace</b> — buy farm inputs and sell produce directly to buyers at fair prices.",
        "<b>Expert Consultations</b> — book chat or video sessions with certified agronomists.",
        "<b>Community Forums</b> — share tips and learn from other farmers in the same region.",
        "<b>Voice Interface</b> — speak to the app in French or English instead of typing.",
    ]
    for f in features:
        story.append(Paragraph(f"–  {f}", s["B"]))

    story.append(Paragraph(
        "The app is built with React Native (Expo), Node.js, PostgreSQL, and Groq AI, deployed "
        "on Railway Cloud. It runs on basic Android smartphones and works in low-bandwidth areas.",
        s["B"]
    ))

    # ── 4. TARGET / BENEFICIARIES ────────────────────────────────────────
    story.append(Paragraph("4. Target and Beneficiaries", s["SH"]))
    story.append(section_line())
    story.append(Paragraph(
        "The primary beneficiaries are <b>smallholder farmers across Cameroon</b>, particularly "
        "those in rural and peri-urban areas with limited access to agricultural extension services. "
        "These farmers typically cultivate crops such as cassava, maize, plantain, cocoa, and "
        "vegetables on small plots and face daily challenges related to crop health, weather "
        "unpredictability, and market access. Secondary beneficiaries include certified agronomists "
        "(who gain visibility and a direct channel to reach farmers), agricultural input suppliers "
        "(who access a wider customer base through the marketplace), and produce buyers seeking "
        "quality goods directly from producers. We aim to serve <b>50,000+ farmers across all 10 "
        "regions of Cameroon</b> within two years of full deployment.",
        s["B"]
    ))

    # ── 5. REVENUE MODEL ─────────────────────────────────────────────────
    story.append(Paragraph("5. How the Solution Generates Revenue", s["SH"]))
    story.append(section_line())
    story.append(Paragraph(
        "YCD Farmer Guide generates revenue through the following streams:",
        s["B"]
    ))
    revenue = [
        "<b>Marketplace Transaction Fees</b> — a small commission is applied on each sale "
        "completed through the platform when farmers sell produce or buyers purchase inputs.",
        "<b>Expert Consultation Fees</b> — agronomists offering paid advisory sessions through "
        "chat or video; the platform retains a service fee per consultation booked.",
        "<b>Partnerships and Sponsorships</b> — collaborations with agricultural cooperatives, "
        "NGOs, government programmes, and agribusiness companies that sponsor farmer onboarding, "
        "advertise agricultural inputs, or fund platform features for specific regions.",
        "<b>Data and Insight Services</b> — anonymised, aggregated agricultural data (crop health "
        "trends, regional demand patterns) offered to research institutions and development "
        "organisations to support evidence-based policy and programme design.",
    ]
    for r in revenue:
        story.append(Paragraph(f"–  {r}", s["B"]))

    story.append(Paragraph(
        "All core features of the application — disease detection, weather forecasts, community "
        "forums — remain freely accessible to every farmer. The revenue model is designed to "
        "sustain the platform financially without placing a financial burden on the smallholder "
        "farmers it serves.",
        s["B"]
    ))

    # ── 6. THE WORKING TEAM ──────────────────────────────────────────────
    story.append(Paragraph("6. The Working Team", s["SH"]))
    story.append(section_line())
    story.append(Paragraph(
        "The YCD Farmer Guide team is a multidisciplinary group of five young Cameroonians "
        "working under the umbrella of Youths &amp; Contemporary Development. The team combines "
        "expertise in software engineering, network systems, food science, and microbiology:",
        s["B"]
    ))

    for i, (name, title, contrib) in enumerate(TEAM):
        tag = "  (Group Leader)" if i == 0 else ""
        block = [
            Paragraph(f"{i+1}. {name}{tag}", s["TeamName"]),
            Paragraph(f"<i>{title}</i>   —   {contrib}", s["TeamInfo"]),
            Spacer(1, 5),
        ]
        story.append(KeepTogether(block))

    # ── CLOSING ──────────────────────────────────────────────────────────
    story.append(Spacer(1, 10))
    story.append(HRFlowable(width="50%", thickness=0.5, color=MID_GREEN,
                              spaceBefore=2, spaceAfter=6))
    story.append(Paragraph(
        "Youths &amp; Contemporary Development  |  Yaoundé, Cameroon  |  "
        "info@youth-contemporary-development.com  |  (+237) 674 510 163",
        s["SmallCenter"]
    ))
    story.append(Paragraph(
        "www.youth-contemporary-development.com",
        s["SmallCenter"]
    ))

    # ── BUILD ────────────────────────────────────────────────────────────
    print("  Building PDF...")
    doc.build(story, onFirstPage=draw_header_footer, onLaterPages=draw_header_footer)

    size_kb = os.path.getsize(OUTPUT_PDF) / 1024
    print(f"\n  Done! {OUTPUT_PDF}")
    print(f"  Size: {size_kb:.1f} KB")
    print("=" * 55)


if __name__ == "__main__":
    build_document()
