// Marks the nav link of the section in view. The page works without it.
(function () {
  var links = document.querySelectorAll('.bar nav a');
  if (!('IntersectionObserver' in window) || !links.length) return;
  var map = {};
  links.forEach(function (a) { map[a.getAttribute('href').slice(1)] = a; });
  var current = null;
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (en) {
      if (!en.isIntersecting) return;
      var id = en.target.id;
      var link = map[id] || (id === 'skills' || id === 'education' ? map.about : null);
      if (current) current.removeAttribute('aria-current');
      current = link || null;
      if (current) current.setAttribute('aria-current', 'true');
    });
  }, { rootMargin: '-45% 0px -50% 0px' });
  document.querySelectorAll('main > section[id]').forEach(function (s) { io.observe(s); });
})();
