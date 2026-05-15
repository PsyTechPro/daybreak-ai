"""
Daybreak AI — daily headline fetcher.
Run once per day to update data/headlines.json with AI-related articles.

Requirements:
    pip install feedparser

Usage:
    python scripts/fetch_news.py
"""

import feedparser
import json
import re
from datetime import datetime, timezone, timedelta
from pathlib import Path

# ── RSS sources ──────────────────────────────────────────────────────────────

SOURCES = [
    # Mainstream
    ("Reuters",              "https://feeds.reuters.com/reuters/technologyNews"),
    ("BBC",                  "http://feeds.bbci.co.uk/news/technology/rss.xml"),
    ("NPR",                  "https://feeds.npr.org/1019/rss.xml"),
    ("CNN",                  "http://rss.cnn.com/rss/edition_technology.rss"),
    ("CBS News",             "https://www.cbsnews.com/latest/rss/technology"),
    ("Fox News",             "https://moxie.foxnews.com/google-publisher/tech.xml"),
    # Tech
    ("TechCrunch",           "https://techcrunch.com/feed/"),
    ("The Verge",            "https://www.theverge.com/rss/index.xml"),
    ("Ars Technica",         "https://feeds.arstechnica.com/arstechnica/index"),
    ("Wired",                "https://www.wired.com/feed/rss"),
    ("MIT Technology Review","https://www.technologyreview.com/feed/"),
    ("VentureBeat",          "https://venturebeat.com/feed/"),
]

# ── AI keyword filter ────────────────────────────────────────────────────────

AI_PATTERNS = re.compile(
    r'\b('
    r'AI|artificial intelligence|machine learning|deep learning|'
    r'neural network|ChatGPT|GPT-?[0-9]|LLM|large language model|'
    r'generative AI|gen AI|OpenAI|Anthropic|DeepMind|Google DeepMind|'
    r'Gemini|Claude|Mistral|Llama|Grok|Copilot|'
    r'AGI|foundation model|diffusion model|'
    r'text.to.image|image generation|'
    r'Stable Diffusion|Midjourney|DALL-?E|Sora|'
    r'Perplexity|Hugging Face|xAI|'
    r'autonomous vehicle|self.driving|robotics|'
    r'natural language processing|NLP|computer vision'
    r')\b',
    re.IGNORECASE,
)

# ── Helpers ──────────────────────────────────────────────────────────────────

def is_ai_related(text: str) -> bool:
    return bool(AI_PATTERNS.search(text or ""))


def parse_date(entry) -> str:
    """Return ISO date string YYYY-MM-DD from a feedparser entry."""
    for attr in ("published_parsed", "updated_parsed"):
        t = getattr(entry, attr, None)
        if t:
            try:
                dt = datetime(*t[:6], tzinfo=timezone.utc)
                return dt.strftime("%Y-%m-%d")
            except Exception:
                pass
    return datetime.now(timezone.utc).strftime("%Y-%m-%d")


def fetch_source(name: str, url: str) -> list[dict]:
    print(f"  Fetching {name}…", end=" ", flush=True)
    try:
        feed = feedparser.parse(url)
        articles = []
        for entry in feed.entries:
            title = entry.get("title", "").strip()
            link  = entry.get("link", "").strip()
            summary = entry.get("summary", "") or entry.get("description", "")
            if not title or not link:
                continue
            if is_ai_related(title) or is_ai_related(summary):
                articles.append({
                    "title":  title,
                    "url":    link,
                    "source": name,
                    "date":   parse_date(entry),
                })
        print(f"{len(articles)} AI articles found")
        return articles
    except Exception as e:
        print(f"FAILED ({e})")
        return []

# ── Main ─────────────────────────────────────────────────────────────────────

def main():
    script_dir = Path(__file__).parent
    data_file  = script_dir.parent / "data" / "headlines.json"

    # Load existing data
    if data_file.exists():
        existing = json.loads(data_file.read_text(encoding="utf-8"))
    else:
        existing = []

    # Index existing articles by date → set of URLs (for deduplication)
    existing_by_date: dict[str, list] = {}
    seen_urls: dict[str, set] = {}
    for day in existing:
        d = day["date"]
        existing_by_date[d] = day["articles"]
        seen_urls[d] = {a["url"] for a in day["articles"]}

    # Fetch all sources
    print("Fetching RSS feeds…")
    fresh: list[dict] = []
    for name, url in SOURCES:
        fresh.extend(fetch_source(name, url))

    # Merge new articles into existing_by_date
    added = 0
    for article in fresh:
        d = article["date"]
        if d not in existing_by_date:
            existing_by_date[d] = []
            seen_urls[d] = set()
        if article["url"] not in seen_urls[d]:
            existing_by_date[d].append(article)
            seen_urls[d].add(article["url"])
            added += 1

    # Drop days older than 30 days
    cutoff = (datetime.now(timezone.utc) - timedelta(days=30)).strftime("%Y-%m-%d")
    kept = {d: arts for d, arts in existing_by_date.items() if d >= cutoff}

    # Sort newest-first; sort articles within each day by source then title
    output = []
    for d in sorted(kept.keys(), reverse=True):
        articles = sorted(kept[d], key=lambda a: (a["source"], a["title"]))
        output.append({"date": d, "articles": articles})

    data_file.write_text(json.dumps(output, indent=2, ensure_ascii=False), encoding="utf-8")
    print(f"\nDone. Added {added} new articles. {len(output)} day(s) in archive.")
    print(f"Saved -> {data_file}")


if __name__ == "__main__":
    main()
