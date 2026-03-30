document.addEventListener('DOMContentLoaded', () => {
  const header = document.querySelector('.header');
  if (header) window.addEventListener('scroll', () => { header.classList.toggle('scrolled', window.scrollY > 60); });
  const hamburger = document.querySelector('.hamburger');
  const nav = document.querySelector('.nav');
  if (hamburger && nav) hamburger.addEventListener('click', () => { nav.classList.toggle('open'); });
  document.querySelectorAll('.form-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.form-tab').forEach(t => t.classList.remove('active'));
      document.querySelectorAll('.form-panel').forEach(p => p.classList.remove('active'));
      tab.classList.add('active');
      document.getElementById(tab.dataset.tab)?.classList.add('active');
    });
  });
  function applyFilter(cat) {
    document.querySelectorAll('.category-filter').forEach(f => f.classList.remove('active'));
    const btn = document.querySelector(`.category-filter[data-category="${cat}"]`);
    if (btn) btn.classList.add('active');
    document.querySelectorAll('.insight-card').forEach(card => { card.style.display = (cat === 'all' || card.dataset.category === cat) ? '' : 'none'; });
  }
  document.querySelectorAll('.category-filter').forEach(filter => {
    filter.addEventListener('click', () => {
      const cat = filter.dataset.category;
      history.replaceState(null, '', cat === 'all' ? location.pathname : '#' + cat);
      applyFilter(cat);
    });
  });
  const hash = location.hash.replace('#', '');
  if (hash) applyFilter(hash);
});
