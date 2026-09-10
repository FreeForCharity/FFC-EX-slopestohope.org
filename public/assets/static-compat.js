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
  sync();
});
