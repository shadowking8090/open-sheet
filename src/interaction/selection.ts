export function selectNoteFromClick(event: MouseEvent): string | null {
  const target = event.target as SVGElement;
  const noteGroup = target.closest('g.note');
  if (!noteGroup) return null;

  document.querySelectorAll('g.note.selected').forEach(el =>
    el.classList.remove('selected')
  );
  noteGroup.classList.add('selected');
  return noteGroup.id;
}