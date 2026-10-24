/** True when `requested` names exactly the `current` ids, each once, in any order. */
export function isSameIdSet(requested: string[], current: string[]) {
  const currentSet = new Set(current);
  return (
    requested.length === currentSet.size &&
    new Set(requested).size === currentSet.size &&
    requested.every((id) => currentSet.has(id))
  );
}
