#!/usr/bin/env python3
"""
Convert YCD Farmer Guide Pitch Deck Markdown to PDF with embedded graphics
"""

import os
import re
from pathlib import Path
from markdown2 import markdown
from weasyprint import HTML, CSS
from io import BytesIO

# Project paths
PROJECT_ROOT = Path("C:/Users/laure/Desktop/YCD_App")
PITCH_DECK_MD = PROJECT_ROOT / "YCD_FARMER_GUIDE_PITCH.md"
GRAPHICS_DIR = PROJECT_ROOT / "graphics"
OUTPUT_PDF = PROJECT_ROOT / "YCD_FARMER_GUIDE_PITCH_DECK.pdf"

def read_markdown_file(filepath):
    """Read markdown file"""
    with open(filepath, 'r', encoding='utf-8') as f:
        return f.read()

def process_graphics_paths(html_content):
    """Convert relative graphics paths to absolute file paths for WeasyPrint"""
    # Convert markdown image references to proper HTML with absolute paths
    pattern = r'<img alt="([^"]*)" src="graphics/([^"]*)"'
    
    def replace_path(match):
        alt_text = match.group(1)
        filename = match.group(2)
        abs_path = GRAPHICS_DIR / filename
        # WeasyPrint works with file:// URLs
        file_url = f"file:///{abs_path.as_posix()}"
        return f'<img alt="{alt_text}" src="{file_url}" style="max-width: 100%; height: auto;"'
    
    return re.sub(pattern, replace_path, html_content)

def create_pdf():
    """Create PDF from markdown pitch deck"""
    
    print("📖 Reading pitch deck markdown...")
    md_content = read_markdown_file(PITCH_DECK_MD)
    
    print("🔄 Converting markdown to HTML...")
    html_content = markdown(md_content, extras=['fenced-code-blocks', 'tables', 'toc'])
    
    print("🖼️  Processing graphics paths...")
    html_content = process_graphics_paths(html_content)
    
    # Create comprehensive HTML document with styling
    full_html = f"""<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>YCD Farmer Guide - Professional Pitch Deck</title>
    <style>
        * {{
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }}
        
        html, body {{
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            line-height: 1.6;
            color: #1a1a1a;
            background: white;
        }}
        
        body {{
            padding: 40px;
            max-width: 1000px;
            margin: 0 auto;
        }}
        
        h1 {{
            font-size: 32px;
            font-weight: 700;
            margin-bottom: 20px;
            color: #1a1a1a;
            border-bottom: 3px solid #00a878;
            padding-bottom: 15px;
            page-break-after: avoid;
        }}
        
        h2 {{
            font-size: 24px;
            font-weight: 700;
            margin-top: 40px;
            margin-bottom: 20px;
            color: #1a1a1a;
            border-bottom: 2px solid #4c6ef5;
            padding-bottom: 10px;
            page-break-after: avoid;
        }}
        
        h3 {{
            font-size: 18px;
            font-weight: 600;
            margin-top: 25px;
            margin-bottom: 15px;
            color: #333;
            page-break-after: avoid;
        }}
        
        h4 {{
            font-size: 16px;
            font-weight: 600;
            margin-top: 15px;
            margin-bottom: 10px;
            color: #333;
            page-break-after: avoid;
        }}
        
        p {{
            margin-bottom: 12px;
            text-align: justify;
        }}
        
        ul, ol {{
            margin-left: 30px;
            margin-bottom: 15px;
        }}
        
        li {{
            margin-bottom: 8px;
        }}
        
        strong {{
            font-weight: 600;
            color: #1a1a1a;
        }}
        
        em {{
            font-style: italic;
            color: #666;
        }}
        
        table {{
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
            page-break-inside: avoid;
            border: 1px solid #ddd;
        }}
        
        th {{
            background: #f0f0f0;
            padding: 12px;
            text-align: left;
            font-weight: 600;
            border: 1px solid #ddd;
            color: #1a1a1a;
        }}
        
        td {{
            padding: 10px 12px;
            border: 1px solid #ddd;
        }}
        
        tr:nth-child(even) {{
            background: #fafafa;
        }}
        
        img {{
            max-width: 100%;
            height: auto;
            margin: 20px 0;
            display: block;
            page-break-inside: avoid;
        }}
        
        hr {{
            border: none;
            border-top: 2px solid #ddd;
            margin: 40px 0;
            page-break-after: avoid;
        }}
        
        code {{
            background: #f4f4f4;
            padding: 2px 6px;
            border-radius: 3px;
            font-family: 'Courier New', monospace;
            font-size: 0.9em;
        }}
        
        pre {{
            background: #f4f4f4;
            padding: 15px;
            border-radius: 5px;
            overflow-x: auto;
            margin: 15px 0;
            border-left: 4px solid #4c6ef5;
        }}
        
        pre code {{
            background: none;
            padding: 0;
            font-size: 0.85em;
        }}
        
        blockquote {{
            border-left: 4px solid #4c6ef5;
            padding-left: 15px;
            margin: 15px 0;
            color: #666;
            font-style: italic;
        }}
        
        @page {{
            size: A4;
            margin: 25mm 20mm;
            @bottom-center {{
                content: "Page " counter(page) " of " counter(pages);
                font-size: 10pt;
                color: #999;
            }}
        }}
        
        @page :first {{
            @bottom-center {{
                content: "";
            }}
        }}
    </style>
</head>
<body>
    {html_content}
</body>
</html>"""
    
    print("📝 Generating PDF...")
    try:
        HTML(string=full_html).write_pdf(str(OUTPUT_PDF))
        print(f"✅ PDF created successfully: {OUTPUT_PDF}")
        print(f"📊 File size: {OUTPUT_PDF.stat().st_size / 1024 / 1024:.2f} MB")
        return True
    except Exception as e:
        print(f"❌ Error creating PDF: {e}")
        return False

if __name__ == "__main__":
    print("=" * 60)
    print("YCD Farmer Guide - Pitch Deck to PDF Converter")
    print("=" * 60)
    print()
    
    if not PITCH_DECK_MD.exists():
        print(f"❌ Error: Pitch deck not found at {PITCH_DECK_MD}")
        exit(1)
    
    if not GRAPHICS_DIR.exists():
        print(f"⚠️  Warning: Graphics directory not found at {GRAPHICS_DIR}")
        print("   Continuing without graphics...")
    
    success = create_pdf()
    
    print()
    if success:
        print("=" * 60)
        print("✨ PDF Generation Complete!")
        print("=" * 60)
        print(f"\n📥 Output: {OUTPUT_PDF}")
        print("\n✅ Your professional pitch deck is ready for investors!")
    else:
        print("❌ PDF generation failed. Please check the errors above.")
        exit(1)
