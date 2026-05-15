const container = document.getElementById('headlines-container');

function formatDateLabel(dateStr) {
  const today = new Date().toISOString().slice(0, 10);
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  if (dateStr === today) return 'Today';
  if (dateStr === yesterday) return 'Yesterday';
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
}

function buildArticleList(articles) {
  const ul = document.createElement('ul');
  ul.className = 'article-list';
  articles.forEach(article => {
    const li = document.createElement('li');
    li.className = 'article-item';
    li.innerHTML = `
      <span class="article-source">${escapeHtml(article.source)}</span>
      <span class="article-title"><a href="${escapeHtml(article.url)}" target="_blank" rel="noopener">${escapeHtml(article.title)}</a></span>
    `;
    ul.appendChild(li);
  });
  return ul;
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function buildTodaySection(day) {
  const section = document.createElement('div');
  section.className = 'day-section today-section';
  const header = document.createElement('div');
  header.className = 'day-header';
  header.innerHTML = `
    <span class="day-label">Today — ${formatDateLabel(day.date)}</span>
    <span class="day-count">${day.articles.length} headline${day.articles.length !== 1 ? 's' : ''}</span>
  `;
  section.appendChild(header);
  section.appendChild(buildArticleList(day.articles));
  return section;
}

function buildPastSection(day) {
  const details = document.createElement('details');
  details.className = 'day-section';
  const summary = document.createElement('summary');
  summary.innerHTML = `
    <span class="day-label">${formatDateLabel(day.date)}</span>
    <span class="day-count">${day.articles.length} headline${day.articles.length !== 1 ? 's' : ''}</span>
  `;
  details.appendChild(summary);
  details.appendChild(buildArticleList(day.articles));
  return details;
}

async function loadHeadlines() {
  try {
    const res = await fetch('data/headlines.json');
    if (!res.ok) throw new Error('fetch failed');
    const days = await res.json();

    if (!days || days.length === 0) {
      container.innerHTML = '<p class="status-msg">No headlines yet. Run the fetch script to populate.</p>';
      return;
    }

    const today = new Date().toISOString().slice(0, 10);
    const sorted = [...days].sort((a, b) => b.date.localeCompare(a.date));

    sorted.forEach((day, i) => {
      const el = (i === 0 && day.date === today)
        ? buildTodaySection(day)
        : (i === 0)
          ? buildTodaySection(day)
          : buildPastSection(day);
      container.appendChild(el);
    });
  } catch (err) {
    container.innerHTML = '<p class="status-msg">Could not load headlines. Make sure you\'ve run the fetch script.</p>';
  }
}

loadHeadlines();
