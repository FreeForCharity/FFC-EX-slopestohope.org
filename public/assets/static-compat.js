// Keep the existing BuddyX menu's accessibility state in sync with its classes.
document.addEventListener('DOMContentLoaded', () => {
  const button = document.querySelector('#menu-toggle');
  if (!button) return;
  const sync = () => {
    const open = document.body.classList.contains('mobile-menu-opened');
    button.setAttribute('aria-expanded', String(open));
    button.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  };
  new MutationObserver(sync).observe(document.body, {attributes: true, attributeFilter: ['class']});
  const setOpen = open => {
    document.body.classList.toggle('mobile-menu-opened', open);
    sync();
  };
  // Use a local handler so the menu does not depend on a delayed WordPress bundle.
  button.addEventListener('click', event => {
    if (!matchMedia('(max-width: 767px)').matches) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    setOpen(!document.body.classList.contains('mobile-menu-opened'));
  }, true);
  document.querySelectorAll('.menu-close, .mobile-menu-close').forEach(close => close.addEventListener('click', event => {
    event.preventDefault();
    event.stopImmediatePropagation();
    setOpen(false);
  }, true));
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape') setOpen(false);
  });
  sync();
});
