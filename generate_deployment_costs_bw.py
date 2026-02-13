#!/usr/bin/env python3
"""
YCD App - Simple black & white deployment cost document
"""

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, HRFlowable
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_JUSTIFY
from datetime import datetime
import os

W, H = A4
BLACK = colors.black
GREY = colors.HexColor('#555555')
LIGHT_GREY = colors.HexColor('#E0E0E0')
WHITE = colors.white

def hf(canvas, doc):
    canvas.saveState()
    canvas.setFont('Helvetica', 9)
    canvas.setFillColor(GREY)
    canvas.line(40, H - 50, W - 40, H - 50)
    canvas.drawString(40, H - 45, "YCD Plant Health App — Deployment Costs")
    canvas.drawRightString(W - 40, H - 45, f"Page {doc.page}")
    canvas.line(40, 35, W - 40, 35)
    canvas.drawString(40, 22, f"Prepared {datetime.now().strftime('%B %d, %Y')}")
    canvas.restoreState()

def tbl(data, widths, bold_last=False):
    t = Table(data, colWidths=widths)
    cmds = [
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 9),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 7),
        ('TOPPADDING', (0, 0), (-1, -1), 7),
        ('ALIGN', (1, 0), (-1, -1), 'CENTER'),
        ('ALIGN', (0, 0), (0, -1), 'LEFT'),
        ('GRID', (0, 0), (-1, -1), 0.5, GREY),
        ('BACKGROUND', (0, 0), (-1, 0), LIGHT_GREY),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [WHITE, colors.HexColor('#F5F5F5')]),
    ]
    if bold_last:
        cmds += [
            ('FONTNAME', (0, -1), (-1, -1), 'Helvetica-Bold'),
            ('BACKGROUND', (0, -1), (-1, -1), LIGHT_GREY),
        ]
    t.setStyle(TableStyle(cmds))
    return t

def build():
    out = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'YCD_Deployment_Costs_FCFA.pdf')
    doc = SimpleDocTemplate(out, pagesize=A4, topMargin=65, bottomMargin=50, leftMargin=50, rightMargin=50)
    s = getSampleStyleSheet()

    ttl = ParagraphStyle('T', parent=s['Heading1'], fontSize=22, alignment=TA_CENTER, fontName='Helvetica-Bold', spaceAfter=5)
    sub = ParagraphStyle('S', parent=s['Normal'], fontSize=11, alignment=TA_CENTER, textColor=GREY, spaceAfter=20)
    sec = ParagraphStyle('Sec', parent=s['Heading2'], fontSize=13, fontName='Helvetica-Bold', spaceBefore=18, spaceAfter=6)
    bd = ParagraphStyle('Bd', parent=s['Normal'], fontSize=10, alignment=TA_JUSTIFY, leading=14, spaceAfter=8)
    nt = ParagraphStyle('Nt', parent=s['Normal'], fontSize=9, textColor=GREY, leading=12, spaceAfter=6)

    el = []

    # === COVER ===
    el.append(Spacer(1, 2.5*inch))
    el.append(Paragraph("YCD Plant Health App", ttl))
    el.append(Paragraph("Deployment Costs & Financial Projections", sub))
    el.append(HRFlowable(width="40%", thickness=1, color=BLACK, hAlign='CENTER', spaceAfter=20))
    el.append(Paragraph("All amounts in FCFA (1 USD = 600 FCFA)", ParagraphStyle('fx', parent=s['Normal'], fontSize=10, alignment=TA_CENTER, textColor=GREY)))
    el.append(Spacer(1, 10))
    el.append(Paragraph(f"{datetime.now().strftime('%B %d, %Y')}", ParagraphStyle('d', parent=s['Normal'], fontSize=10, alignment=TA_CENTER)))
    el.append(PageBreak())

    # === 1. WHAT IT COSTS TO START ===
    el.append(Paragraph("1. What It Costs to Start", sec))
    el.append(HRFlowable(width="100%", thickness=0.5, color=BLACK, spaceAfter=10))
    el.append(Paragraph(
        "The YCD App is ready to deploy. Below is the exact cost to publish the app on Google Play Store, "
        "host the backend on Railway, and run the database on Neon PostgreSQL.", bd))

    d1 = [
        ['Item', 'Cost (FCFA)', 'Type'],
        ['Google Play Developer Account', '15,000 FCFA', 'One-time (lifetime)'],
        ['Railway — Backend Hosting (Hobby Plan)', '3,000 FCFA/month', 'Monthly'],
        ['Neon PostgreSQL — Database', '0 FCFA', 'Free tier'],
        ['Groq API — AI Chatbot + Voice Transcription', '0 FCFA', 'Free tier'],
        ['Expo / EAS — App Build Service', '0 FCFA', 'Free tier'],
        ['Cloudinary — Image Storage', '0 FCFA', 'Free tier'],
        ['Brevo — Email Service', '0 FCFA', 'Free tier'],
    ]
    el.append(tbl(d1, [2.8*inch, 1.2*inch, 1.3*inch]))
    el.append(Spacer(1, 15))

    box = [
        ['Total to launch (first month)', '18,000 FCFA'],
        ['Ongoing monthly cost', '3,000 FCFA/month'],
    ]
    b = Table(box, colWidths=[3.2*inch, 1.5*inch])
    b.setStyle(TableStyle([
        ('FONTNAME', (0, 0), (-1, -1), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 12),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('BOX', (0, 0), (-1, -1), 1.5, BLACK),
        ('GRID', (0, 0), (-1, -1), 0.5, GREY),
        ('PADDING', (0, 0), (-1, -1), 10),
    ]))
    el.append(b)
    el.append(Spacer(1, 20))

    # === 2. FREE TIER LIMITS ===
    el.append(Paragraph("2. Free Tier Limits", sec))
    el.append(HRFlowable(width="100%", thickness=0.5, color=BLACK, spaceAfter=10))
    el.append(Paragraph(
        "Most services start free. Below are the limits and how many users they support before an upgrade is needed.", bd))

    d2 = [
        ['Service', 'Free Tier Limit', 'Users Supported'],
        ['Neon Database', '0.5 GB storage, 190 compute hours/month', '~5,000'],
        ['Groq AI', '14,400 requests/day, 6,000 tokens/min', '~2,000 daily active'],
        ['Cloudinary', '25 GB storage, 25,000 transforms/month', '~10,000'],
        ['Brevo Email', '300 emails/day', '~5,000'],
        ['Expo/EAS Builds', '30 builds/month', 'Unlimited app users'],
    ]
    el.append(tbl(d2, [1.4*inch, 2.3*inch, 1.5*inch]))
    el.append(Spacer(1, 10))
    el.append(Paragraph("Free tiers comfortably support 2,000 to 5,000 users before any upgrades are needed.", nt))

    # === 3. YEARLY SUBSCRIPTION COSTS ===
    el.append(Paragraph("3. Yearly Subscription Costs to Pay", sec))
    el.append(HRFlowable(width="100%", thickness=0.5, color=BLACK, spaceAfter=10))
    el.append(Paragraph(
        "Below are the actual yearly expenses you need to pay to keep the app running. "
        "These are the subscription costs for each service.", bd))

    d3 = [
        ['Service', 'Monthly Plan', 'Yearly Cost (FCFA)'],
        ['Railway — Backend Hosting', '3,000 FCFA/month', '36,000 FCFA/year'],
        ['Neon PostgreSQL — Database', '0 FCFA (free tier)', '0 FCFA/year'],
        ['Groq API — AI Services', '0 FCFA (free tier)', '0 FCFA/year'],
        ['Cloudinary — Image Storage', '0 FCFA (free tier)', '0 FCFA/year'],
        ['Brevo — Email Service', '0 FCFA (free tier)', '0 FCFA/year'],
        ['Expo / EAS — Build Service', '0 FCFA (free tier)', '0 FCFA/year'],
        ['Domain Name (optional)', '600 FCFA/month', '7,200 FCFA/year'],
        ['TOTAL YEARLY SUBSCRIPTIONS', '', '43,200 FCFA/year'],
    ]
    el.append(tbl(d3, [2.2*inch, 1.3*inch, 1.5*inch], bold_last=True))
    el.append(Spacer(1, 10))
    el.append(Paragraph(
        "Add 15,000 FCFA one-time for Google Play Store registration in the first year only.", nt))
    el.append(Spacer(1, 10))

    # Total first year box
    fy = [
        ['FIRST YEAR TOTAL EXPENSE', ''],
        ['Google Play registration (one-time)', '15,000 FCFA'],
        ['Railway hosting (12 months x 3,000)', '36,000 FCFA'],
        ['Domain name (optional, 12 months x 600)', '7,200 FCFA'],
        ['All other services', '0 FCFA (free)'],
        ['TOTAL FIRST YEAR', '58,200 FCFA'],
    ]
    fyb = Table(fy, colWidths=[3.2*inch, 1.5*inch])
    fyb.setStyle(TableStyle([
        ('FONTNAME', (0, 0), (-1, -1), 'Helvetica'),
        ('FONTSIZE', (0, 0), (-1, -1), 10),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('ALIGN', (1, 0), (1, -1), 'RIGHT'),
        ('PADDING', (0, 0), (-1, -1), 8),
        ('BOX', (0, 0), (-1, -1), 1, BLACK),
        ('GRID', (0, 0), (-1, -1), 0.5, LIGHT_GREY),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('BACKGROUND', (0, 0), (-1, 0), LIGHT_GREY),
        ('FONTNAME', (0, -1), (-1, -1), 'Helvetica-Bold'),
        ('BACKGROUND', (0, -1), (-1, -1), LIGHT_GREY),
        ('FONTSIZE', (0, -1), (-1, -1), 11),
    ]))
    el.append(fyb)
    el.append(Spacer(1, 15))

    el.append(Paragraph(
        "Note: Neon PostgreSQL is currently on the free tier (0.5 GB storage, 190 compute hours/month). "
        "If the number of users increases significantly beyond 5,000, the database will need to be upgraded "
        "to a paid plan. Neon Launch plan costs 11,400 FCFA/month (136,800 FCFA/year) for 10 GB storage. "
        "Neon Scale plan costs 41,400 FCFA/month (496,800 FCFA/year) for 50 GB storage. "
        "This upgrade will only be necessary when the app grows substantially.", bd))
    el.append(PageBreak())

    # === 4. UPGRADE PRICING ===
    el.append(Paragraph("4. Service Pricing Details", sec))
    el.append(HRFlowable(width="100%", thickness=0.5, color=BLACK, spaceAfter=10))

    el.append(Paragraph("Railway (Backend Hosting)", ParagraphStyle('h1', parent=s['Normal'],
        fontSize=11, fontName='Helvetica-Bold', spaceBefore=10, spaceAfter=5)))
    el.append(tbl([
        ['Plan', 'Monthly (FCFA)', 'Yearly (FCFA)', 'Includes'],
        ['Hobby (current)', '3,000', '36,000', '8 GB RAM, auto-deploy'],
        ['Pro', '12,000', '144,000', 'Team features, priority'],
    ], [1.2*inch, 1*inch, 1*inch, 2.1*inch]))
    el.append(Spacer(1, 12))

    el.append(Paragraph("Neon PostgreSQL (Database)", ParagraphStyle('h2', parent=s['Normal'],
        fontSize=11, fontName='Helvetica-Bold', spaceBefore=10, spaceAfter=5)))
    el.append(tbl([
        ['Plan', 'Monthly (FCFA)', 'Yearly (FCFA)', 'Storage'],
        ['Free (current)', '0', '0', '0.5 GB'],
        ['Launch', '11,400', '136,800', '10 GB'],
        ['Scale', '41,400', '496,800', '50 GB'],
        ['Business', '89,400', '1,072,800', '500 GB'],
    ], [1.2*inch, 1.1*inch, 1.1*inch, 1*inch]))
    el.append(Spacer(1, 12))

    el.append(Paragraph("Groq AI (Chatbot + Voice)", ParagraphStyle('h3', parent=s['Normal'],
        fontSize=11, fontName='Helvetica-Bold', spaceBefore=10, spaceAfter=5)))
    el.append(tbl([
        ['Model', 'Free Tier', 'Paid Price', 'Used For'],
        ['Llama 3.1 8B', '14,400 req/day', '30 FCFA / 1M tokens', 'AI Chatbot'],
        ['Whisper Large V3', '2,000 req/day', '67 FCFA / hour', 'Voice-to-text'],
    ], [1.3*inch, 1.2*inch, 1.3*inch, 1.5*inch]))
    el.append(Spacer(1, 12))

    el.append(Paragraph("Google Play Store", ParagraphStyle('h4', parent=s['Normal'],
        fontSize=11, fontName='Helvetica-Bold', spaceBefore=10, spaceAfter=5)))
    el.append(tbl([
        ['Item', 'Cost (FCFA)', 'Notes'],
        ['Developer Account', '15,000 (one-time)', 'Lifetime access, unlimited apps'],
        ['Commission on sales', '15%', 'Google takes 15% on first $1M revenue/year'],
        ['App hosting', '0', 'Free, unlimited downloads'],
    ], [1.5*inch, 1.2*inch, 2.6*inch]))
    el.append(PageBreak())

    # === SUMMARY ===
    el.append(Spacer(1, 0.5*inch))
    el.append(Paragraph("Summary", sec))
    el.append(HRFlowable(width="100%", thickness=0.5, color=BLACK, spaceAfter=15))

    sm = [
        ['TO START', ''],
        ['Google Play Store registration', '15,000 FCFA (one-time)'],
        ['Railway backend hosting', '3,000 FCFA/month'],
        ['Database, AI, images, email', '0 FCFA (free tiers)'],
        ['', ''],
        ['TOTAL FIRST MONTH', '18,000 FCFA'],
        ['', ''],
        ['YEARLY SUBSCRIPTION COSTS', ''],
        ['Railway hosting (12 months)', '36,000 FCFA/year'],
        ['Domain name (12 months)', '7,200 FCFA/year'],
        ['All other services', '0 FCFA (free tiers)'],
        ['TOTAL FIRST YEAR (+ Play Store)', '58,200 FCFA'],
        ['TOTAL FOLLOWING YEARS', '43,200 FCFA/year'],
    ]
    st = Table(sm, colWidths=[3.2*inch, 1.5*inch])
    st.setStyle(TableStyle([
        ('FONTNAME', (0, 0), (-1, -1), 'Helvetica'),
        ('FONTSIZE', (0, 0), (-1, -1), 10),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('ALIGN', (1, 0), (1, -1), 'RIGHT'),
        ('PADDING', (0, 0), (-1, -1), 8),
        ('BOX', (0, 0), (-1, -1), 1, BLACK),
        ('GRID', (0, 0), (-1, -1), 0.5, LIGHT_GREY),
        # Section headers
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 11),
        ('BACKGROUND', (0, 0), (-1, 0), LIGHT_GREY),
        ('FONTNAME', (0, 6), (-1, 6), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 6), (-1, 6), 11),
        ('BACKGROUND', (0, 6), (-1, 6), LIGHT_GREY),
        ('FONTNAME', (0, 8), (-1, 8), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 8), (-1, 8), 11),
        ('BACKGROUND', (0, 8), (-1, 8), LIGHT_GREY),
        ('FONTNAME', (0, 12), (-1, 13), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 12), (-1, 13), 11),
        ('BACKGROUND', (0, 12), (-1, 13), LIGHT_GREY),
        # Spacer rows
        ('FONTSIZE', (0, 5), (-1, 5), 4),
        ('TOPPADDING', (0, 5), (-1, 5), 2),
        ('BOTTOMPADDING', (0, 5), (-1, 5), 2),
        ('FONTSIZE', (0, 7), (-1, 7), 4),
        ('TOPPADDING', (0, 7), (-1, 7), 2),
        ('BOTTOMPADDING', (0, 7), (-1, 7), 2),
    ]))
    el.append(st)
    el.append(Spacer(1, 25))
    el.append(Paragraph(
        "The app can be deployed commercially for 18,000 FCFA the first month, then 3,000 FCFA/month ongoing. "
        "The total first year expense is 58,200 FCFA. Free tiers support thousands of users. "
        "If users grow significantly, Neon database will need an upgrade (from 136,800 FCFA/year).", bd))

    doc.build(el, onFirstPage=hf, onLaterPages=hf)
    print(f"PDF generated: {out}")

if __name__ == "__main__":
    build()
