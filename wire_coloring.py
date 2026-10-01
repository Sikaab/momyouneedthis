#!/usr/bin/env python3
"""Wire original coloring printables into category pages (v2).

- 27 competitor-link pages: remove external links, insert printable card with
  download + print buttons and 'more coming soon', rewrite stale roundup/FAQ
  copy (visible + JSON-LD), fix meta description + og:image.
- feelings: replace coming-soon block with printable card.
- five-senses: swap old jpg preview/download for the new original PNG.
- sound: add original printable card without breaking the Letter A hub.
"""
import re, os, json

LINK_THEMES = {
    "animal": "Animal", "back-to-school": "Back-to-School", "bug-insect": "Bug & Insect",
    "christmas": "Christmas", "dinosaur": "Dinosaur", "easter": "Easter", "eid": "Eid",
    "fairy": "Fairy", "fall": "Fall", "farm": "Farm", "food": "Food",
    "halloween": "Halloween", "july-4th": "July 4th", "mermaid": "Mermaid",
    "ocean": "Ocean", "pirate": "Pirate", "prehistoric-animal": "Prehistoric Animal",
    "princess": "Princess", "space": "Space", "spring": "Spring", "summer": "Summer",
    "superhero": "Superhero", "toddler": "Toddler", "transportation": "Transportation",
    "unicorn": "Unicorn", "valentines-day": "Valentine's Day", "vehicle": "Vehicle",
}

EXTRA_STYLE = """<style>
.coloring-more{margin:14px 0 0;color:#a0556b;font-size:15px;font-weight:800}
.print-btn{background:#fff!important;color:#d05a7d!important;border:2px solid #e89aaa!important;margin-left:10px}
.print-btn:hover{background:#fdf3f5!important;transform:translateY(-3px)}
@media(max-width:600px){.print-btn{margin-left:0;margin-top:10px}}
</style>"""

def printable_card(theme, display, headline, blurb):
    img = f"assets/coloring/{theme}-1.png"
    return f"""<div class="printable-preview">
<img src="{img}" alt="Free printable {display} coloring page for kids" loading="lazy">
</div>
<section class="generator-bottom-cta">
<h2>{headline}</h2>
<p>{blurb}</p>
<a href="{img}" download="{theme}-coloring-page.png" class="download-button">⬇️ Download Free Coloring Page</a>
<a href="{img}" target="_blank" rel="noopener" class="download-button print-btn">🖨️ Print</a>
<p class="free-note">🎁 Free printable for toddlers &amp; preschoolers</p>
<p class="coloring-more">🎨 More {display} coloring pages coming soon — check back!</p>
</section>"""

def rewrite_copy(html, display):
    # intro variant 1: "Here are some of the best free X coloring pages from trusted websites. Perfect for ..."
    html = re.sub(
        r'Here are some of the best free .*? coloring pages from trusted websites\.',
        f'Download our free original {display} coloring page below — no signup needed. Just tap download, print, and let the coloring fun begin!',
        html, flags=re.I)
    # intro variant 2: "This page rounds up the best free printable X coloring pages from trusted coloring sites. Browse the list, tap a link, and print your favorites at home — ..."
    html = re.sub(
        r'This page rounds up the best free printable .*? coloring pages from trusted coloring sites\. Browse the list, tap a link, and print your favorites at home —[^<]*',
        f'Download our free original {display} coloring page below — no signup needed. Just tap download, print at home, and let the coloring fun begin!',
        html, flags=re.I)
    # FAQ answer (visible + JSON-LD share the same text): stale external-link claim
    html = html.replace(
        "Yes — every link on this page leads to a free printable from the publisher’s own site. Nothing here costs anything.",
        f"Yes — the coloring page on this page is a free original printable from MomYouNeedThis. Nothing here costs anything.")
    html = html.replace(
        "Yes — every link on this page leads to a free printable from the publisher's own site. Nothing here costs anything.",
        f"Yes — the coloring page on this page is a free original printable from MomYouNeedThis. Nothing here costs anything.")
    # meta description roundup claim
    html = re.sub(
        r'a hand-picked roundup of printable pages from top coloring sites\. Browse, print &amp; color today!|a hand-picked roundup of printable pages from top coloring sites\. Browse, print & color today!',
        'a free original printable made for little hands. Download, print &amp; color today!',
        html)
    return html

def add_style(html):
    if 'coloring-more' not in html.split('</head>')[0]:
        html = html.replace('</head>', EXTRA_STYLE + '\n</head>', 1)
    return html

def set_og_image(html, theme):
    return re.sub(r'<meta property="og:image" content="[^"]*">',
                  f'<meta property="og:image" content="https://momyouneedthis.com/assets/coloring/{theme}-1.png">',
                  html, count=1)

def external_links(html):
    return [u for u in re.findall(r'href="(https?://[^"]+)"', html)
            if 'momyouneedthis.com' not in u and 'fonts.googleapis' not in u and 'schema.org' not in u]

def process_link_page(fname, theme, display):
    html = open(fname, encoding='utf-8').read()
    new, n = re.subn(r'<ul class="resource-links">.*?</ul>',
                     printable_card(theme, display,
                                    f"🎨 Download Your Free {display} Coloring Page",
                                    f"A cute, original {display.lower()} coloring page made for little hands — bold outlines, big spaces, zero signup."),
                     html, flags=re.S)
    if n == 0:
        print(f"WARN: no resource-links UL in {fname}")
        return False
    html = rewrite_copy(new, display)
    html = add_style(html)
    html = set_og_image(html, theme)
    ext = external_links(html)
    if ext:
        print(f"WARN: {fname} still has external links: {ext[:3]}")
    open(fname, 'w', encoding='utf-8').write(html)
    print(f"OK: {fname}")
    return True

def process_feelings():
    fname = "feelings-coloring-pages.html"
    html = open(fname, encoding='utf-8').read()
    card = printable_card("feelings", "Feelings",
                          "🎨 Download Your Free Feelings Coloring Page",
                          "A sweet emotions coloring page that helps toddlers name big feelings — happy, sad, silly and more.")
    html, n = re.subn(r'<div class="myf-photo-soon".*?</div>', card, html, count=1, flags=re.S)
    assert n == 1, "feelings coming-soon block not found"
    html = add_style(html)
    html = set_og_image(html, "feelings")
    open(fname, 'w', encoding='utf-8').write(html)
    print("OK: feelings-coloring-pages.html")

def process_five_senses():
    fname = "five-senses-coloring-pages.html"
    html = open(fname, encoding='utf-8').read()
    old = "assets/five-senses-activities-explore.jpg"
    new = "assets/coloring/five-senses-1.png"
    assert old in html, "five-senses old asset not found"
    html = html.replace(old, new)
    # add more-coming-soon note after the preview
    if 'coloring-more' not in html:
        html = re.sub(r'(<div class="printable-preview">.*?</div>)',
                      r'\1\n<p class="coloring-more" style="text-align:center">🎨 More Five Senses coloring pages coming soon — check back!</p>',
                      html, count=1, flags=re.S)
    html = add_style(html)
    html = set_og_image(html, "five-senses")
    open(fname, 'w', encoding='utf-8').write(html)
    print("OK: five-senses-coloring-pages.html")

def process_sound():
    fname = "sound-coloring.html"
    html = open(fname, encoding='utf-8').read()
    assert 'assets/coloring/sound-1.png' not in html
    card = printable_card("sound", "Beginning Sounds",
                          "🎨 Download Your Free Beginning Sounds Coloring Page",
                          "A playful original coloring page that pairs pictures with their beginning sounds — a gentle first step into phonics.")
    m = re.search(r'(<p class="intro"[^>]*>.*?</p>)', html, re.S)
    assert m, "sound intro not found"
    html = html[:m.end()] + "\n" + card + html[m.end():]
    html = add_style(html)
    html = set_og_image(html, "sound")
    open(fname, 'w', encoding='utf-8').write(html)
    print("OK: sound-coloring.html")

def main():
    os.chdir(os.path.dirname(os.path.abspath(__file__)))
    done = 0
    for theme, display in LINK_THEMES.items():
        fname = f"{theme}-coloring-pages.html"
        img = f"assets/coloring/{theme}-1.png"
        if not os.path.exists(fname):
            print(f"SKIP (missing page): {fname}"); continue
        if not os.path.exists(img):
            print(f"SKIP (no image): {fname}"); continue
        if process_link_page(fname, theme, display):
            done += 1
    process_feelings()
    process_five_senses()
    process_sound()
    print(f"\nDone: {done} link pages + 3 special pages wired.")

if __name__ == '__main__':
    main()
