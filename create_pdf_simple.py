#!/usr/bin/env python3
"""
Convert Markdown with SVG graphics to PDF using reportlab and svglib
"""
import os
import re
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Image, PageBreak
from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_JUSTIFY
from svglib.svglib import svg2rlg
from reportlab.graphics import renderPDF

def convert_svg_to_pdf_image(svg_path):
    """Convert SVG to drawable using svglib"""
    try:
        drawing = svg2rlg(svg_path)
        if drawing:
            return drawing
    except Exception as e:
        print(f"Warning: Could not convert {svg_path}: {e}")
    return None

def md_to_pdf():
    # Read the markdown file
    with open('YCD_FARMER_GUIDE_PITCH.md', 'r', encoding='utf-8') as f:
        md_content = f.read()

    # Create PDF with tighter margins
    pdf_file = 'YCD_Pitch_Final_v2.pdf'
    doc = SimpleDocTemplate(pdf_file, pagesize=letter,
                            rightMargin=0.4*inch, leftMargin=0.4*inch,
                            topMargin=0.5*inch, bottomMargin=0.5*inch)

    # Container for PDF elements
    story = []

    # Get styles
    styles = getSampleStyleSheet()

    # Custom styles - compact
    title_style = ParagraphStyle(
        'CustomTitle',
        parent=styles['Heading1'],
        fontSize=20,
        textColor=colors.HexColor('#1a1a1a'),
        spaceAfter=4,
        spaceBefore=0,
        alignment=TA_CENTER,
        fontName='Helvetica-Bold'
    )

    heading2_style = ParagraphStyle(
        'CustomHeading2',
        parent=styles['Heading2'],
        fontSize=12,
        textColor=colors.HexColor('#1a1a1a'),
        spaceAfter=2,
        spaceBefore=4,
        fontName='Helvetica-Bold'
    )

    heading3_style = ParagraphStyle(
        'CustomHeading3',
        parent=styles['Heading3'],
        fontSize=10,
        textColor=colors.HexColor('#333333'),
        spaceAfter=1,
        spaceBefore=2,
        fontName='Helvetica-Bold'
    )

    body_style = ParagraphStyle(
        'CustomBody',
        parent=styles['BodyText'],
        fontSize=9,
        textColor=colors.HexColor('#333333'),
        alignment=TA_JUSTIFY,
        spaceAfter=2,
        leading=10
    )

    bullet_style = ParagraphStyle(
        'BulletStyle',
        parent=styles['BodyText'],
        fontSize=9,
        textColor=colors.HexColor('#333333'),
        spaceAfter=1,
        leftIndent=12,
        leading=10
    )

    # Split content into lines
    lines = md_content.split('\n')
    
    for line in lines:
        stripped = line.strip()
        
        # Skip empty lines
        if not stripped:
            continue
        
        # Title
        if stripped.startswith('# ') and not stripped.startswith('##'):
            title = stripped[2:].strip()
            story.append(Paragraph(title, title_style))
        
        # Heading 2 - NO page breaks
        elif stripped.startswith('## ') and not stripped.startswith('###'):
            heading = stripped[3:].strip()
            story.append(Paragraph(heading, heading2_style))
        
        # Heading 3
        elif stripped.startswith('### '):
            heading = stripped[4:].strip()
            story.append(Paragraph(heading, heading3_style))
        
        # Image reference
        elif stripped.startswith('![') and '.svg)' in stripped:
            match = re.search(r'!\[(.*?)\]\((.*?)\)', stripped)
            if match:
                img_caption = match.group(1)
                img_path = match.group(2)
                
                if os.path.exists(img_path):
                    try:
                        drawing = convert_svg_to_pdf_image(img_path)
                        if drawing:
                            # Scale to fit nicely
                            target_width = 4.5 * inch
                            target_height = 2.5 * inch
                            orig_width = drawing.width
                            orig_height = drawing.height
                            scale_x = target_width / orig_width if orig_width else 1
                            scale_y = target_height / orig_height if orig_height else 1
                            scale = min(scale_x, scale_y)
                            drawing.width = orig_width * scale
                            drawing.height = orig_height * scale
                            drawing.scale(scale, scale)
                            story.append(drawing)
                            if img_caption:
                                cap_style = ParagraphStyle('Caption', parent=styles['Normal'], fontSize=7, textColor=colors.HexColor('#666'), alignment=TA_CENTER, spaceAfter=2)
                                story.append(Paragraph(f"<i>{img_caption}</i>", cap_style))
                        else:
                            story.append(Paragraph(f"[Chart: {os.path.basename(img_path)}]", body_style))
                    except Exception as e:
                        story.append(Paragraph(f"[Chart: {img_path}]", body_style))
        
        # Bullet points
        elif stripped.startswith('- '):
            bullet_text = stripped[2:].strip()
            # Clean markdown formatting properly
            bullet_text = re.sub(r'\*\*(.*?)\*\*', r'<b>\1</b>', bullet_text)
            bullet_text = re.sub(r'__(.*?)__', r'<u>\1</u>', bullet_text)
            bullet_text = re.sub(r'_(.*?)_', r'<i>\1</i>', bullet_text)
            story.append(Paragraph(f"• {bullet_text}", bullet_style))
        
        # Page break - skip markdown separators
        elif stripped == '---':
            continue
        
        # Skip markers and tables
        elif (stripped.startswith('[INSERT') or stripped.startswith('_') or 
              stripped.startswith('|') or stripped.startswith('```')):
            continue
        
        # Regular text
        else:
            if not stripped.startswith('#') and stripped:
                # Clean markdown properly using regex
                text = re.sub(r'\*\*(.*?)\*\*', r'<b>\1</b>', stripped)
                text = re.sub(r'__(.*?)__', r'<u>\1</u>', text)
                text = re.sub(r'_(.*?)_', r'<i>\1</i>', text)
                
                try:
                    story.append(Paragraph(text, body_style))
                except:
                    pass

    # Build PDF
    try:
        doc.build(story)
        file_size = os.path.getsize(pdf_file) / (1024*1024)
        print(f"\n{'='*60}")
        print(f"✅ PDF CREATED SUCCESSFULLY!")
        print(f"{'='*60}")
        print(f"📄 File: {pdf_file}")
        print(f"📊 Size: {file_size:.2f} MB")
        print(f"📍 Location: {os.path.abspath(pdf_file)}")
        print(f"{'='*60}\n")
        return True
    except Exception as e:
        print(f"❌ Error building PDF: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == '__main__':
    md_to_pdf()
