// Categorías de psicología más comunes en Mendoza.
// Fuente: consultorios activos en área metropolitana Mendoza (GBA, Godoy Cruz,
// Las Heras, Luján de Cuyo, Maipú).
// Usar para filtros en HomeScreen y SearchScreen.

export const PSYCHOLOGY_CATEGORIES = [
  { id: 'todos',        label: 'Todos' },
  { id: 'ansiedad',     label: 'Ansiedad' },
  { id: 'depresion',    label: 'Depresión' },
  { id: 'pareja',       label: 'Pareja' },
  { id: 'ninos',        label: 'Niños' },
  { id: 'adolescentes', label: 'Adolescentes' },
  { id: 'duelo',        label: 'Duelo' },
  { id: 'trauma',       label: 'Trauma' },
  { id: 'tcc',          label: 'TCC' },
  { id: 'online',       label: 'Solo Online' },
] as const;

export type PsychologyCategoryId = typeof PSYCHOLOGY_CATEGORIES[number]['id'];
