export function containFocus(event: { key: string; shiftKey: boolean; preventDefault: () => void }, container: HTMLElement) {
  if (event.key !== 'Tab') return;
  const controls = [...container.querySelectorAll<HTMLElement>('a[href], button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex]:not([tabindex="-1"])')]
    .filter(element => element.tabIndex >= 0 && element.getClientRects().length && getComputedStyle(element).visibility !== 'hidden' && !element.closest('[inert]'));
  const first = controls[0], last = controls.at(-1);
  if (!first) { event.preventDefault(); container.focus(); return; }
  if (event.shiftKey && (document.activeElement === first || !container.contains(document.activeElement))) { event.preventDefault(); last?.focus(); }
  else if (!event.shiftKey && (document.activeElement === last || !container.contains(document.activeElement))) { event.preventDefault(); first.focus(); }
}
