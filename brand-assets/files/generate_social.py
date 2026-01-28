#!/usr/bin/env python3
"""
Alpmera Social Media Asset Generator
Creates headers and profile images for X and LinkedIn
"""

from PIL import Image, ImageDraw, ImageFont
import math
import os

# Alpmera Brand Colors
DEEP_FOREST = (27, 77, 62)      # #1B4D3E
WARM_STONE = (232, 222, 209)    # #E8DED1
MUTED_GOLD = (201, 169, 98)     # #C9A962
FOREST_LIGHT = (58, 107, 90)    # #3A6B5A
OFF_WHITE = (250, 250, 248)     # #FAFAF8

# Font path
FONT_PATH = "/mnt/skills/examples/canvas-design/canvas-fonts/LibreBaskerville-Regular.ttf"

def load_font(size):
    """Load Libre Baskerville or fallback"""
    try:
        return ImageFont.truetype(FONT_PATH, size)
    except:
        return ImageFont.load_default()

def draw_orbital_mark(draw, cx, cy, scale=1.0, color=DEEP_FOREST):
    """
    Draw the orbital aggregation logo mark
    cx, cy = center coordinates
    scale = size multiplier
    """
    # Central core
    core_r = int(30 * scale)
    draw.ellipse(
        [cx - core_r, cy - core_r, cx + core_r, cy + core_r],
        fill=color
    )
    
    # Orbital ring
    orbit_r = int(90 * scale)
    ring_width = max(1, int(2 * scale))
    draw.ellipse(
        [cx - orbit_r, cy - orbit_r, cx + orbit_r, cy + orbit_r],
        outline=color, width=ring_width
    )
    
    # Orbital elements
    num_orbitals = 7
    orbital_r = int(9 * scale)
    for i in range(num_orbitals):
        angle = (2 * math.pi * i / num_orbitals) - math.pi/2
        x = cx + orbit_r * math.cos(angle)
        y = cy + orbit_r * math.sin(angle)
        draw.ellipse(
            [x - orbital_r, y - orbital_r, x + orbital_r, y + orbital_r],
            fill=color
        )
    
    # Outer containment
    outer_r = int(140 * scale)
    outer_width = max(2, int(3 * scale))
    draw.ellipse(
        [cx - outer_r, cy - outer_r, cx + outer_r, cy + outer_r],
        outline=color, width=outer_width
    )

def draw_pattern_dots(draw, width, height, color, opacity_color):
    """Draw subtle background pattern of small dots"""
    spacing = 60
    dot_r = 2
    for x in range(0, width, spacing):
        for y in range(0, height, spacing):
            # Offset every other row
            offset = spacing // 2 if (y // spacing) % 2 else 0
            draw.ellipse(
                [x + offset - dot_r, y - dot_r, x + offset + dot_r, y + dot_r],
                fill=opacity_color
            )

def create_x_header():
    """Create X/Twitter header: 1500x500"""
    width, height = 1500, 500
    img = Image.new('RGB', (width, height), WARM_STONE)
    draw = ImageDraw.Draw(img)
    
    # Subtle background pattern
    pattern_color = (222, 212, 199)  # Slightly darker than WARM_STONE
    draw_pattern_dots(draw, width, height, WARM_STONE, pattern_color)
    
    # Logo mark on left side
    mark_x = 250
    mark_y = height // 2
    draw_orbital_mark(draw, mark_x, mark_y, scale=1.4, color=DEEP_FOREST)
    
    # Wordmark
    font = load_font(72)
    text = "ALPMERA"
    bbox = draw.textbbox((0, 0), text, font=font)
    text_height = bbox[3] - bbox[1]
    
    text_x = 480
    text_y = (height - text_height) // 2 - 10
    draw.text((text_x, text_y), text, fill=DEEP_FOREST, font=font)
    
    # Tagline
    tagline_font = load_font(28)
    tagline = "Trust-first collective buying"
    draw.text((text_x, text_y + 85), tagline, fill=FOREST_LIGHT, font=tagline_font)
    
    # Decorative line
    line_y = height - 40
    draw.rectangle([100, line_y, width - 100, line_y + 4], fill=MUTED_GOLD)
    
    return img

def create_x_profile():
    """Create X/Twitter profile image: 400x400"""
    size = 400
    img = Image.new('RGB', (size, size), DEEP_FOREST)
    draw = ImageDraw.Draw(img)
    
    # Draw the mark in warm stone color (inverted for dark bg)
    draw_orbital_mark(draw, size//2, size//2, scale=1.2, color=WARM_STONE)
    
    return img

def create_linkedin_banner():
    """Create LinkedIn banner: 1584x396"""
    width, height = 1584, 396
    img = Image.new('RGB', (width, height), WARM_STONE)
    draw = ImageDraw.Draw(img)
    
    # Background pattern
    pattern_color = (222, 212, 199)
    draw_pattern_dots(draw, width, height, WARM_STONE, pattern_color)
    
    # Logo mark
    mark_x = 200
    mark_y = height // 2
    draw_orbital_mark(draw, mark_x, mark_y, scale=1.1, color=DEEP_FOREST)
    
    # Wordmark
    font = load_font(64)
    text = "ALPMERA"
    bbox = draw.textbbox((0, 0), text, font=font)
    text_height = bbox[3] - bbox[1]
    
    text_x = 400
    text_y = (height - text_height) // 2 - 20
    draw.text((text_x, text_y), text, fill=DEEP_FOREST, font=font)
    
    # Tagline
    tagline_font = load_font(24)
    tagline = "Trust-first collective buying operator"
    draw.text((text_x, text_y + 70), tagline, fill=FOREST_LIGHT, font=tagline_font)
    
    # Right side: key message
    msg_font = load_font(20)
    messages = [
        "Escrow-protected campaigns",
        "Community-driven pricing",
        "Seattle, WA"
    ]
    msg_x = width - 380
    msg_y = 120
    soft_black = (45, 45, 45)
    for i, msg in enumerate(messages):
        draw.text((msg_x, msg_y + i * 40), msg, fill=soft_black, font=msg_font)
    
    # Bottom accent line
    draw.rectangle([80, height - 30, width - 80, height - 26], fill=MUTED_GOLD)
    
    return img

def create_linkedin_profile():
    """Create LinkedIn profile image: 400x400"""
    size = 400
    img = Image.new('RGB', (size, size), DEEP_FOREST)
    draw = ImageDraw.Draw(img)
    
    # Draw the mark in warm stone color
    draw_orbital_mark(draw, size//2, size//2, scale=1.2, color=WARM_STONE)
    
    return img

def create_alternate_profile_light():
    """Alternative profile image with light background"""
    size = 400
    img = Image.new('RGB', (size, size), WARM_STONE)
    draw = ImageDraw.Draw(img)
    
    # Draw the mark in deep forest
    draw_orbital_mark(draw, size//2, size//2, scale=1.2, color=DEEP_FOREST)
    
    return img

def main():
    base_dir = "/home/claude/alpmera-brand-assets/social"
    
    # Create directories
    os.makedirs(f"{base_dir}/x", exist_ok=True)
    os.makedirs(f"{base_dir}/linkedin", exist_ok=True)
    
    print("Generating social media assets...")
    print("=" * 50)
    
    # X/Twitter
    print("\n📱 X (Twitter)")
    
    header = create_x_header()
    header.save(f"{base_dir}/x/header_1500x500.png")
    print(f"  ✓ Header: 1500x500")
    
    profile = create_x_profile()
    profile.save(f"{base_dir}/x/profile_400x400.png")
    print(f"  ✓ Profile (dark): 400x400")
    
    profile_light = create_alternate_profile_light()
    profile_light.save(f"{base_dir}/x/profile_light_400x400.png")
    print(f"  ✓ Profile (light): 400x400")
    
    # LinkedIn
    print("\n💼 LinkedIn")
    
    banner = create_linkedin_banner()
    banner.save(f"{base_dir}/linkedin/banner_1584x396.png")
    print(f"  ✓ Banner: 1584x396")
    
    li_profile = create_linkedin_profile()
    li_profile.save(f"{base_dir}/linkedin/profile_400x400.png")
    print(f"  ✓ Profile (dark): 400x400")
    
    li_profile_light = create_alternate_profile_light()
    li_profile_light.save(f"{base_dir}/linkedin/profile_light_400x400.png")
    print(f"  ✓ Profile (light): 400x400")
    
    print("\n" + "=" * 50)
    print("✅ All social media assets generated!")
    print(f"\nOutput directory: {base_dir}")

if __name__ == "__main__":
    main()
