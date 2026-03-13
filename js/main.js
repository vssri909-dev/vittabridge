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
  document.querySelectorAll('.category-filter').forEach(filter => {
    filter.addEventListener('click', () => {
      document.querySelectorAll('.category-filter').forEach(f => f.classList.remove('active'));
      filter.classList.add('active');
      const cat = filter.dataset.category;
      document.querySelectorAll('.insight-card').forEach(card => { card.style.display = (cat === 'all' || card.dataset.category === cat) ? '' : 'none'; });
    });
  });
});
