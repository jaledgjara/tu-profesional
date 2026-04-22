// ─────────────────────────────────────────────────────────────────────────────
// Z-INDEX LAYERS
//
// Documentar esto es no-negociable. Los conflictos de z-index producen bugs
// visuales que no se pueden reproducir fácilmente (dependen del orden de render
// y del árbol de componentes). Tener una escala centralizada elimina el
// "pruebo 999 hasta que funcione".
//
// En React Native, zIndex funciona igual que en CSS pero aplica por "grupo
// de apilamiento" (stacking context). Un View con position: 'absolute' crea
// su propio contexto.
// ─────────────────────────────────────────────────────────────────────────────

export const zIndex = {
  base:        0,    // contenido normal en flujo
  card:        1,    // cards con elevation (para sombras correctas)
  raised:      5,    // elementos levemente elevados
  sticky:      10,   // headers fijos, section headers sticky
  tabBar:      20,   // bottom tab bar — siempre visible
  fab:         25,   // FAB del tab bar — sobre el tab bar
  dropdown:    30,   // dropdowns, selects, autocomplete
  bottomSheet: 40,   // bottom sheets — sobre tab bar
  modal:       50,   // modals y dialogs — sobre todo el contenido
  toast:       60,   // toasts y snackbars — siempre encima de modals
  tooltip:     70,   // tooltips
  overlay:     80,   // overlays oscuros de fondo de modal
} as const;

export type ZIndexKey = keyof typeof zIndex;
