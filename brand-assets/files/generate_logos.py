#!/usr/bin/env python3
"""
Alpmera Logo Concept Generator
Following brand rules: geometric, restrained, suggests containment/aggregation/completion
Forbidden: shopping metaphors, arrows, carts, price tags, badges, flames
"""

from PIL import Image, ImageDraw, ImageFont
import math
import os

# Alpmera Brand Colors
DEEP_FOREST = (27, 77, 62)      # #1B4D3E - Primary
WARM_STONE = (232, 222, 209)    # #E8DED1 - Secondary/Canvas
MUTED_GOLD = (201, 169, 98)     # #C9A962 - Accent
FOREST_LIGHT = (58, 107, 90)    # #3A6B5A - Success
SOFT_BLACK = (45, 45, 45)       # #2D2D2D - Text

# Canvas size for logo concepts
SIZE = 800
CENTER = SIZE // 2

def create_canvas(bg_color=WARM_STONE):
    """Create a new canvas with background color"""
    img = Image.new('RGB', (SIZE, SIZE), bg_color)
    return img, ImageDraw.Draw(img)

def concept_1_nested_rings():
    """
    Concept 1: Nested Rings
    Three concentric rings suggesting protection layers and collective containment
    """
    img, draw = create_canvas()
    
    # Three nested rings with decreasing thickness
    rings = [
        (280, 12),  # Outer ring: radius, thickness
        (200, 10),  # Middle ring
        (120, 8),   # Inner ring
    ]
    
    for radius, thickness in rings:
        # Draw ring as difference of two circles
        for i in range(thickness):
            r = radius - i
            bbox = [CENTER - r, CENTER - r, CENTER + r, CENTER + r]
            draw.ellipse(bbox, outline=DEEP_FOREST, width=1)
    
    # Solid core circle
    core_radius = 50
    draw.ellipse(
        [CENTER - core_radius, CENTER - core_radius, 
         CENTER + core_radius, CENTER + core_radius],
        fill=DEEP_FOREST
    )
    
    return img

def concept_2_orbital_aggregation():
    """
    Concept 2: Orbital Aggregation
    Multiple elements in orbit around a protected center
    Suggests collective participation converging
    """
    img, draw = create_canvas()
    
    # Central protected core
    core_radius = 60
    draw.ellipse(
        [CENTER - core_radius, CENTER - core_radius,
         CENTER + core_radius, CENTER + core_radius],
        fill=DEEP_FOREST
    )
    
    # Orbital ring (thin line)
    orbit_radius = 180
    draw.ellipse(
        [CENTER - orbit_radius, CENTER - orbit_radius,
         CENTER + orbit_radius, CENTER + orbit_radius],
        outline=DEEP_FOREST, width=2
    )
    
    # Orbital elements (participants in the collective)
    num_orbitals = 7
    orbital_radius = 18
    for i in range(num_orbitals):
        angle = (2 * math.pi * i / num_orbitals) - math.pi/2  # Start from top
        x = CENTER + orbit_radius * math.cos(angle)
        y = CENTER + orbit_radius * math.sin(angle)
        draw.ellipse(
            [x - orbital_radius, y - orbital_radius,
             x + orbital_radius, y + orbital_radius],
            fill=DEEP_FOREST
        )
    
    # Outer containment ring
    outer_radius = 280
    draw.ellipse(
        [CENTER - outer_radius, CENTER - outer_radius,
         CENTER + outer_radius, CENTER + outer_radius],
        outline=DEEP_FOREST, width=3
    )
    
    return img

def concept_3_convergence():
    """
    Concept 3: Convergence
    Abstract shapes converging toward a center point
    Suggests demand aggregation without arrows
    """
    img, draw = create_canvas()
    
    # Central point of convergence
    center_radius = 40
    draw.ellipse(
        [CENTER - center_radius, CENTER - center_radius,
         CENTER + center_radius, CENTER + center_radius],
        fill=DEEP_FOREST
    )
    
    # Converging arc segments
    num_arcs = 6
    for i in range(num_arcs):
        angle_start = (360 / num_arcs) * i
        angle_end = angle_start + 40  # 40 degree arc
        
        # Inner arc
        inner_r = 100
        bbox_inner = [CENTER - inner_r, CENTER - inner_r, CENTER + inner_r, CENTER + inner_r]
        draw.arc(bbox_inner, angle_start, angle_end, fill=DEEP_FOREST, width=20)
        
        # Outer arc (thinner)
        outer_r = 200
        bbox_outer = [CENTER - outer_r, CENTER - outer_r, CENTER + outer_r, CENTER + outer_r]
        draw.arc(bbox_outer, angle_start + 5, angle_end - 5, fill=DEEP_FOREST, width=12)
        
        # Outermost arc (thinnest)
        outermost_r = 280
        bbox_outermost = [CENTER - outermost_r, CENTER - outermost_r, CENTER + outermost_r, CENTER + outermost_r]
        draw.arc(bbox_outermost, angle_start + 10, angle_end - 10, fill=DEEP_FOREST, width=6)
    
    return img

def concept_4_contained_a():
    """
    Concept 4: Contained A
    Abstract lettermark 'A' within a protective circle
    The A is geometric, suggesting a roof/shelter
    """
    img, draw = create_canvas()
    
    # Outer containment circle
    outer_r = 280
    draw.ellipse(
        [CENTER - outer_r, CENTER - outer_r,
         CENTER + outer_r, CENTER + outer_r],
        outline=DEEP_FOREST, width=4
    )
    
    # Abstract geometric A (triangular form with horizontal bar)
    # Triangle points
    top = (CENTER, CENTER - 160)
    bottom_left = (CENTER - 140, CENTER + 120)
    bottom_right = (CENTER + 140, CENTER + 120)
    
    # Draw triangle outline (thick lines)
    draw.line([top, bottom_left], fill=DEEP_FOREST, width=28)
    draw.line([top, bottom_right], fill=DEEP_FOREST, width=28)
    
    # Horizontal crossbar
    bar_y = CENTER + 20
    bar_left = (CENTER - 85, bar_y)
    bar_right = (CENTER + 85, bar_y)
    draw.line([bar_left, bar_right], fill=DEEP_FOREST, width=22)
    
    # Clean up the joints with circles
    draw.ellipse([top[0]-14, top[1]-14, top[0]+14, top[1]+14], fill=DEEP_FOREST)
    draw.ellipse([bottom_left[0]-14, bottom_left[1]-14, bottom_left[0]+14, bottom_left[1]+14], fill=DEEP_FOREST)
    draw.ellipse([bottom_right[0]-14, bottom_right[1]-14, bottom_right[0]+14, bottom_right[1]+14], fill=DEEP_FOREST)
    
    return img

def concept_5_completion_stages():
    """
    Concept 5: Completion Stages
    Segmented circle suggesting progress toward completion
    References the campaign progress stages without revealing numbers
    """
    img, draw = create_canvas()
    
    # Background circle (outline only)
    outer_r = 260
    draw.ellipse(
        [CENTER - outer_r, CENTER - outer_r,
         CENTER + outer_r, CENTER + outer_r],
        outline=DEEP_FOREST, width=3
    )
    
    # Filled segments representing stages (4 stages like the brand's progress system)
    # Draw as pie slices
    segment_r = 240
    bbox = [CENTER - segment_r, CENTER - segment_r, CENTER + segment_r, CENTER + segment_r]
    
    # Four segments with gaps between them
    segments = [
        (-90, -10),    # Top segment (filled)
        (0, 80),       # Right segment (filled)
        (90, 170),     # Bottom segment (filled)
        (180, 260),    # Left segment (filled) - this one represents "Goal Reached"
    ]
    
    for start, end in segments:
        draw.pieslice(bbox, start, end, fill=DEEP_FOREST)
    
    # Central circle (white/canvas color to create ring effect)
    inner_r = 140
    draw.ellipse(
        [CENTER - inner_r, CENTER - inner_r,
         CENTER + inner_r, CENTER + inner_r],
        fill=WARM_STONE
    )
    
    # Core solid circle
    core_r = 60
    draw.ellipse(
        [CENTER - core_r, CENTER - core_r,
         CENTER + core_r, CENTER + core_r],
        fill=DEEP_FOREST
    )
    
    return img

def add_wordmark(img, include_text=True):
    """Add ALPMERA wordmark below the logo mark"""
    if not include_text:
        return img
    
    # Create larger canvas to accommodate wordmark
    new_height = SIZE + 150
    new_img = Image.new('RGB', (SIZE, new_height), WARM_STONE)
    new_img.paste(img, (0, 0))
    
    draw = ImageDraw.Draw(new_img)
    
    # Try to load Libre Baskerville, fall back to default
    font_path = "/mnt/skills/examples/canvas-design/canvas-fonts/LibreBaskerville-Regular.ttf"
    try:
        font = ImageFont.truetype(font_path, 64)
    except:
        font = ImageFont.load_default()
    
    # Draw wordmark
    text = "ALPMERA"
    bbox = draw.textbbox((0, 0), text, font=font)
    text_width = bbox[2] - bbox[0]
    x = (SIZE - text_width) // 2
    y = SIZE + 30
    
    draw.text((x, y), text, fill=DEEP_FOREST, font=font)
    
    return new_img

def save_logo(img, filename, with_wordmark=False):
    """Save logo in multiple formats"""
    if with_wordmark:
        img = add_wordmark(img)
    
    # Save PNG
    img.save(filename)
    print(f"Saved: {filename}")

def main():
    output_dir = "/home/claude/alpmera-brand-assets/logos"
    os.makedirs(output_dir, exist_ok=True)
    
    concepts = [
        ("concept_1_nested_rings", concept_1_nested_rings, "Nested protection rings"),
        ("concept_2_orbital", concept_2_orbital_aggregation, "Orbital aggregation"),
        ("concept_3_convergence", concept_3_convergence, "Converging elements"),
        ("concept_4_contained_a", concept_4_contained_a, "Contained lettermark"),
        ("concept_5_completion", concept_5_completion_stages, "Completion stages"),
    ]
    
    print("Generating Alpmera logo concepts...")
    print("=" * 50)
    
    for name, func, description in concepts:
        img = func()
        
        # Save mark only
        save_logo(img, f"{output_dir}/{name}_mark.png", with_wordmark=False)
        
        # Save with wordmark
        save_logo(img, f"{output_dir}/{name}_full.png", with_wordmark=True)
        
        print(f"  → {description}")
    
    print("=" * 50)
    print(f"Generated {len(concepts)} concepts in {output_dir}")

if __name__ == "__main__":
    main()
