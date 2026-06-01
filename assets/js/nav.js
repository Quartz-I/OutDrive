(function () {
  var sidebar = document.getElementById('sidebarMenu');
  var overlay = document.getElementById('navOverlay');
  if (!sidebar) return;

  function openNav() {
    sidebar.classList.add('is-open');
    if (overlay) overlay.classList.add('is-open');
    document.body.style.overflow = 'hidden';
  }

  function closeNav() {
    sidebar.classList.remove('is-open');
    if (overlay) overlay.classList.remove('is-open');
    document.body.style.overflow = '';
  }

  document.querySelectorAll('[data-nav-open]').forEach(function (btn) {
    btn.addEventListener('click', openNav);
  });

  document.querySelectorAll('[data-nav-close]').forEach(function (btn) {
    btn.addEventListener('click', closeNav);
  });

  if (overlay) overlay.addEventListener('click', closeNav);

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') closeNav();
  });
})();
