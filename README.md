# Daybreak AI: Your Daily AI News Source

An AI news aggregation site that pulls and updates daily headlines about AI-related news stories from major sources — including BBC, CBS News, Fox News, NPR, TechCrunch, Wired, and MIT Technology Review — and links directly to the original articles.

Updated automatically every morning. Wake up to AI.

## Try it live
👉 [https://daybreak-ai.vercel.app/](https://daybreak-ai.vercel.app/)

## How it works
A Python script (`scripts/fetch_news.py`) pulls headlines daily from a curated list of public RSS feeds across major news and tech outlets, filters for AI-related stories, and updates `data/headlines.json`. The site itself is a static front end (HTML/CSS/JS) that reads from this data file and deploys automatically on Vercel.

## Tech Stack
- Python (`feedparser` for RSS parsing)
- HTML / CSS / JavaScript (front end)
- Vercel (hosting + automated daily deployment)
- GitHub Actions (scheduled daily headline updates)

## Run it yourself locally (optional)

pip install feedparser
python scripts/fetch_news.py

No API key required — this project pulls exclusively from public RSS feeds.
