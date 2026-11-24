(() => {
  'use strict';

  function enablePosterPreview() {
    const dialog = document.querySelector('#preview');
    const links = [...document.querySelectorAll('a[data-preview][href]')];
    if (!links.length || !dialog || typeof dialog.showModal !== 'function') return;

    const image = dialog.querySelector('[data-full-image]');
    const title = dialog.querySelector('[data-image-title]');
    const count = dialog.querySelector('[data-count]');
    const close = dialog.querySelector('[data-close]');
    if (!image || !close) return;

    let index = 0;
    let opener = null;

    function showPoster(nextIndex) {
      index = (nextIndex + links.length) % links.length;
      const link = links[index];
      const caption = link.dataset.caption || link.querySelector('img')?.alt || '';
      image.src = link.href;
      image.alt = caption;
      if (title) title.textContent = caption;
      if (count) count.textContent = `${index + 1} / ${links.length}`;
    }

    links.forEach((link, linkIndex) => {
      link.addEventListener('click', (event) => {
        if (event.defaultPrevented || event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
        opener = link;
        showPoster(linkIndex);
        dialog.showModal();
        event.preventDefault();
        close.focus({ preventScroll: true });
      });
    });

    close.addEventListener('click', () => dialog.close());
    dialog.querySelector('[data-prev]')?.addEventListener('click', () => showPoster(index - 1));
    dialog.querySelector('[data-next]')?.addEventListener('click', () => showPoster(index + 1));
    dialog.addEventListener('keydown', (event) => {
      if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
        event.preventDefault();
        showPoster(index + (event.key === 'ArrowLeft' ? -1 : 1));
      }
    });
    dialog.addEventListener('click', (event) => {
      if (event.target === dialog) dialog.close();
    });
    dialog.addEventListener('close', () => {
      if (opener?.isConnected) opener.focus({ preventScroll: true });
      opener = null;
    });
  }

  function enableRegistrationWindow(container) {
    const start = Date.parse(container.dataset.start || '');
    const end = Date.parse(container.dataset.end || '');
    if (!Number.isFinite(start) && !Number.isFinite(end)) return;
    if (Number.isFinite(start) && Number.isFinite(end) && end <= start) return;

    const status = container.querySelector('[data-reg-status]');
    const openStatus = status?.textContent;
    const registrationCode = container.querySelector('[data-apply-code]');
    const actions = [...container.querySelectorAll('a[data-apply][href]')].map((link) => {
      const label = link.querySelector('[data-apply-label]') ||
        [...link.childNodes].find((child) => child.nodeType === Node.TEXT_NODE && child.textContent.trim()) || link;
      return { link, label, openLabel: label.textContent, href: link.getAttribute('href') };
    });
    let timer;

    function refresh() {
      window.clearTimeout(timer);
      const now = Date.now();
      const upcoming = now < start;
      const closed = now >= end;
      if (registrationCode) registrationCode.hidden = upcoming || closed;

      for (const { link, label, openLabel, href } of actions) {
        if (upcoming || closed) {
          link.removeAttribute('href');
          link.setAttribute('aria-disabled', 'true');
          label.textContent = upcoming ? (link.dataset.upcomingText || '报名尚未开始') : (link.dataset.closedText || '报名已结束');
        } else {
          link.setAttribute('href', href);
          link.removeAttribute('aria-disabled');
          label.textContent = openLabel;
        }
      }

      if (status) {
        if (upcoming) status.textContent = status.dataset.upcomingText || '报名尚未开始';
        else if (closed) status.textContent = status.dataset.closedText || '报名已结束';
        else status.textContent = openStatus;
      }

      const nextChange = upcoming ? start : end;
      if (nextChange > now) timer = window.setTimeout(refresh, Math.min(nextChange - now, 2_147_483_647));
    }

    refresh();
    window.addEventListener('pageshow', refresh);
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) refresh();
    });
  }

  function initialize() {
    enablePosterPreview();
    document.querySelectorAll('[data-registration]').forEach(enableRegistrationWindow);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initialize, { once: true });
  else initialize();
})();

