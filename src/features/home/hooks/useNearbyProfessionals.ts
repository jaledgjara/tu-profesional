// Hook: useNearbyProfessionals
// Capa: hook (orquesta loading/error/data)
// Cliente: usuario final
//
// TODO: reemplazar MOCK_PROFESSIONALS con query Supabase + PostGIS:
//   SELECT *, ST_Distance(location, user_point) AS distance_m
//   FROM professionals
//   WHERE is_active = true
//   ORDER BY distance_m ASC
//   LIMIT 10;

import { useState, useEffect } from 'react';
import type { Professional } from '@/features/professionals/types';

// ─────────────────────────────────────────────────────────────────────────────
// DATOS MOCK — profesionales reales de Mendoza (placeholder hasta Supabase)
// ─────────────────────────────────────────────────────────────────────────────

const MOCK_PROFESSIONALS: Professional[] = [
  {
    id: '1',
    name: 'Lic. Valentina Rodríguez',
    title: 'Psicóloga clínica',
    specialty: 'Ansiedad y Depresión',
    zone: 'Godoy Cruz, Mendoza',
    imageUrl: null,
    tags: ['ADULTOS', 'ANSIEDAD', 'TCC'],
    rating: 4.9,
    reviewCount: 42,
    distanceM: 1200,
    isAvailable: true,
    phone: '5492614001234',
  },
  {
    id: '2',
    name: 'Lic. Martín Flores',
    title: 'Psicólogo',
    specialty: 'Psicoanálisis',
    zone: 'Ciudad, Mendoza',
    imageUrl: null,
    tags: ['ADULTOS', 'PAREJA', 'ONLINE'],
    rating: 4.7,
    reviewCount: 28,
    distanceM: 2400,
    isAvailable: false,
    phone: '5492614002345',
  },
  {
    id: '3',
    name: 'Dra. Camila Sánchez',
    title: 'Psicóloga infanto-juvenil',
    specialty: 'Niños y Adolescentes',
    zone: 'Luján de Cuyo, Mendoza',
    imageUrl: null,
    tags: ['NIÑOS', 'ADOLESCENTES', 'PRESENCIAL'],
    rating: 5.0,
    reviewCount: 19,
    distanceM: 3800,
    isAvailable: true,
    phone: '5492614003456',
  },
  {
    id: '4',
    name: 'Lic. Diego Pereyra',
    title: 'Psicólogo clínico',
    specialty: 'Trauma y Estrés Postraumático',
    zone: 'Las Heras, Mendoza',
    imageUrl: null,
    tags: ['TRAUMA', 'TEPT', 'ONLINE'],
    rating: 4.8,
    reviewCount: 35,
    distanceM: 4600,
    isAvailable: true,
    phone: '5492614004567',
  },
  {
    id: '5',
    name: 'Lic. Sofía Gutiérrez',
    title: 'Psicóloga',
    specialty: 'Terapia de Pareja',
    zone: 'Maipú, Mendoza',
    imageUrl: null,
    tags: ['PAREJA', 'DUELO', 'TCC'],
    rating: 4.6,
    reviewCount: 23,
    distanceM: 5900,
    isAvailable: false,
    phone: '5492614005678',
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// HOOK
// ─────────────────────────────────────────────────────────────────────────────

export interface UseNearbyProfessionalsResult {
  professionals: Professional[];
  isLoading:     boolean;
  error:         string | null;
  refetch:       () => void;
}

export function useNearbyProfessionals(): UseNearbyProfessionalsResult {
  const [isLoading, setIsLoading]       = useState(true);
  const [error, setError]               = useState<string | null>(null);
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [fetchKey, setFetchKey]         = useState(0);

  useEffect(() => {
    let cancelled = false;

    setIsLoading(true);
    setError(null);

    // Simula latencia de red — reemplazar por supabase.rpc('nearby_professionals', ...)
    const timer = setTimeout(() => {
      if (cancelled) return;
      setProfessionals(MOCK_PROFESSIONALS);
      setIsLoading(false);
    }, 1200);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [fetchKey]);

  return {
    professionals,
    isLoading,
    error,
    refetch: () => setFetchKey((k) => k + 1),
  };
}
