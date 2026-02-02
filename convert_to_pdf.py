#!/usr/bin/env python3
"""
Convert Markdown with embedded SVG graphics to PDF
Uses markdown2 and WeasyPrint for professional PDF generation
"""

import os
import markdown2
from weasyprint import HTML, CSS
from pathlib import Path

def convert_markdown_to_pdf():
    """Convert YCD_FARMER_GUIDE_PITCH.md to PDF with graphics"""
    
    # File paths
    md_file = "YCD_FARMER_GUIDE_PITCH.md"
    output_pdf = "YCD_FARMER_GUIDE_PITCH.pdf"
    
    print(f"📄 Reading markdown file: {md_file}")
    
    # Read markdown file
    with open(md_file, 'r', encoding='utf-8') as f:
        markdown_content = f.read()
    
    print("🎨 Converting markdown to HTML...")
    
    # Convert markdown to HTML with extras
    html_content = markdown2.markdown(
        markdown_content,
        extras=['fenced-code-blocks', 'tables', 'footnotes']
    )
    
    # Create a complete HTML document with styling
    full_html = f"""
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>YCD Farmer Guide - Professional Pitch Deck</title>
        <style>
            @page {{
                size: A4;
                margin: 1.5cm;
                @bottom-center {{
                    content: "Page " counter(page) " of " counter(pages);
                    font-size: 10pt;
                    color: #999;
                }}
            }}
            
            body {{
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                line-height: 1.6;
                color: #1a1a1a;
                background: white;
                padding: 0;
                margin: 0;
            }}
            
            h1 {{
                color: #00a878;
                font-size: 32pt;
                margin-top: 40px;
                margin-bottom: 20px;
                border-bottom: 3px solid #00a878;
                padding-bottom: 10px;
                page-break-after: avoid;
            }}
            
            h2 {{
                color: #1a1a1a;
                font-size: 24pt;
                margin-top: 30px;
                margin-bottom: 15px;
                border-left: 5px solid #4c6ef5;
                padding-left: 15px;
                page-break-after: avoid;
            }}
            
            h3 {{
                color: #333;
                font-size: 18pt;
                margin-top: 20px;
                margin-bottom: 12px;
                page-break-after: avoid;
            }}
            
            h4 {{
                color: #555;
                font-size: 14pt;
                margin-top: 15px;
                margin-bottom: 10px;
                page-break-after: avoid;
            }}
            
            p {{
                margin: 10px 0;
                text-align: justify;
            }}
            
            strong {{
                color: #00a878;
                font-weight: 600;
            }}
            
            table {{
                width: 100%;
                border-collapse: collapse;
                margin: 15px 0;
                page-break-inside: avoid;
            }}
            
            th {{
                background: #f0f0f0;
                border: 1px solid #ddd;
                padding: 12px;
                text-align: left;
                font-weight: bold;
                color: #333;
            }}
            
            td {{
                border: 1px solid #e0e0e0;
                padding: 10px;
            }}
            
            tr:nth-child(even) {{
                background: #f9f9f9;
            }}
            
            img {{
                max-width: 100%;
                height: auto;
                margin: 20px 0;
                display: block;
                page-break-inside: avoid;
            }}
            
            ul, ol {{
                margin: 10px 0;
                padding-left: 30px;
            }}
            
            li {{
                margin: 8px 0;
            }}
            
            hr {{
                border: none;
                border-top: 2px solid #e0e0e0;
                margin: 30px 0;
                page-break-after: avoid;
            }}
            
            .highlight {{
                background: #fff3cd;
                padding: 2px 6px;
                border-radius: 3px;
            }}
            
            code {{
                background: #f5f5f5;
                padding: 2px 6px;
                border-radius: 3px;
                font-family: 'Courier New', monospace;
                color: #d63384;
            }}
            
            pre {{
                background: #f5f5f5;
                padding: 15px;
                border-radius: 5px;
                overflow-x: auto;
                page-break-inside: avoid;
            }}
            
            blockquote {{
                border-left: 4px solid #4c6ef5;
                padding-left: 15px;
                margin: 15px 0;
                font-style: italic;
                color: #666;
            }}
            
            .title-page {{
                text-align: center;
                padding: 100px 0;
                page-break-after: always;
            }}
            
            .toc {{
                page-break-after: always;
            }}
        </style>
    </head>
    <body>
        {html_content}
    </body>
    </html>
    """
    
    print("🖨️  Generating PDF with WeasyPrint...")
    
    # Convert HTML to PDF
    try:
        HTML(string=full_html, base_url=os.getcwd()).write_pdf(output_pdf)
        
        # Get file size
        file_size = os.path.getsize(output_pdf) / (1024 * 1024)  # Convert to MB
        
        print(f"\n✅ SUCCESS! PDF created: {output_pdf}")
        print(f"📊 File size: {file_size:.2f} MB")
        print(f"📍 Location: {os.path.abspath(output_pdf)}")
        
    except Exception as e:
        print(f"❌ ERROR creating PDF: {str(e)}")
        raise

if __name__ == "__main__":
    print("=" * 60)
    print("YCD FARMER GUIDE - PITCH DECK PDF CONVERTER")
    print("=" * 60)
    print()
    
    convert_markdown_to_pdf()
    
    print()
    print("=" * 60)
    print("Conversion Complete!")
    print("=" * 60)
