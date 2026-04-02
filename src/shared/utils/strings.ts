// ─────────────────────────────────────────────────────────────────────────────
// STRINGS CENTRALIZADOS
// Todo el copy visible para el usuario vive aquí.
// Razón: facilita correcciones de copy sin tocar componentes,
// y prepara la arquitectura para i18n sin refactor posterior.
// ─────────────────────────────────────────────────────────────────────────────

export const strings = {
  // AUTH
  auth: {
    splashTitle: "Encontrá tu\nprofesional",
    splashSubtitle:
      "Tu Profesional te conecta con expertos de confianza en tu zona.",
    splashCta: "Continuar con Email",
    splashSecurity: "Seguridad y Privacidad",
    splashPrivacyNote:
      "Al continuar, aceptás nuestros Términos de Servicio y Política de Privacidad.",
    emailLabel: "Ingresá tu email",
    emailDesc: "Te enviamos un código de verificación a tu casilla. Sin contraseña.",
    emailPlaceholder: "tu@email.com",
    emailCta: "Enviar Código",
    otpTitle: "Verificar código",
    otpSubtitle: "Revisá tu bandeja de entrada para el código.",
    otpResend: "Reenviar código",
    otpCta: "Confirmar",
    roleTitle: "Seleccioná tu perfil",
    roleSubtitle:
      "Personalizaremos tu experiencia según cómo quieras usar la plataforma.",
    roleUser: "Cliente",
    roleUserDesc: "Busco profesionales para mis necesidades personales.",
    rolePro: "Profesional",
    roleProDesc: "Quiero ofrecer mis servicios y conectar con nuevos clientes.",
    stepIndicator: "PASO {current} DE {total}",
    continueCta: "Continuar",
  },

  // HOME (usuario)
  home: {
    greeting: "Buen día,",
    searchPlaceholder: "Buscar profesionales, especialidades...",
    sectionExplore: "Explorar por Enfoque",
    sectionNearby: "Destacados cerca tuyo",
    seeAll: "Ver todos",
    filterAll: "Todos",
    filterOnline: "Online",
    filterPresencial: "Presencial",
    filterDisponible: "Disponible",
    comingSoon: "PRONTO",
  },

  // PROFESSIONAL CARD
  card: {
    contact: "Contactar",
    contactWhatsApp: "Contactar por WhatsApp",
    viewProfile: "Ver perfil",
    distanceFormat: "{distance} km",
    ratingFormat: "{rating} ({count})",
    yearsExp: "{years} Años",
    reviews: "Reseñas",
    exp: "Exp.",
    rating: "Calificación",
    seeAllReviews: "Ver todas las reseñas",
  },

  // PERFIL PÚBLICO (vista usuario)
  publicProfile: {
    aboutMe: "Sobre mí",
    specialties: "Especialidades",
    reviews: "Reseñas de pacientes",
    weeksAgo: "Hace {n} semanas",
    monthAgo: "Hace {n} mes",
    monthsAgo: "Hace {n} meses",
    verified: "Matrícula verificada",
  },

  // PERFIL (usuario)
  userProfile: {
    title: "Mi perfil",
    personalInfo: "Información Personal",
    notifications: "Notificaciones",
    platformNews: "Novedades de la plataforma",
    platformNewsDesc: "Recibí actualizaciones sobre nuevos servicios.",
    name: "Nombre",
    email: "Email",
    phone: "Teléfono",
    phoneEmpty: "No configurado",
    edit: "Editar",
    logout: "Cerrar sesión",
  },

  // PERFIL (profesional — vista propia)
  proProfile: {
    title: "Mi Perfil",
    presentation: "Presentación",
    specialization: "Especialización",
    modality: "Modalidad y Contacto",
    attendOnline: "Atención Online",
    attendPresencial: "Presencial",
    whatsapp: "WhatsApp",
    active: "ACTIVO",
    subscription: "Suscripción Profesional",
    subscriptionActive: "ACTIVA",
    nextBilling: "Próximo cobro:",
    manageBilling: "Gestionar facturación",
    viewAsPatient: "Ver como paciente",
    logout: "Cerrar sesión",
    edit: "EDITAR",
    verifiedBadge: "MATRÍCULA VERIFICADA",
  },

  // DASHBOARD (profesional)
  dashboard: {
    profileViews: "Vistas de Perfil",
    networkClicks: "Clicks en Redes",
    vsLastWeek: "+{n}% vs sem. ant.",
    quickActions: "ACCIONES RÁPIDAS",
    viewPublicProfile: "Ver mi perfil público",
    editBio: "Editar biografía profesional",
    promoTitle: "Impulsa tu presencia digital hoy mismo.",
    promoCta: "CONTRATAR DESTACADO",
  },

  // SETUP PROFESIONAL
  proSetup: {
    category: "CATEGORÍA",
    configLabel: "CONFIGURACIÓN",
    personalInfo: "INFORMACIÓN PERSONAL",
    fullName: "NOMBRE COMPLETO",
    dni: "DNI",
    phone: "TELÉFONO",
    description: "DESCRIPCIÓN PROFESIONAL",
    descriptionPlaceholder:
      "Contanos sobre tu formación, especialidades y enfoque terapéutico...",
    inspiration: "INSPIRACIÓN (OPCIONAL)",
    quote: "FRASE QUE TE DEFINE",
    quoteAuthor: "AUTOR/ORIGEN",
    socialNetworks: "REDES SOCIALES",
    saveCta: "GUARDAR PERFIL",
    locationTitle: "Ubicación",
    useCurrentLocation: "Usar mi ubicación en tiempo real",
    addressDetail: "DETALLE DE DIRECCIÓN",
    street: "CALLE",
    streetPlaceholder: "Ej: Av. Aristides Villanueva",
    number: "NÚMERO",
    floor: "PISO (OPCIONAL)",
    apartment: "DEPARTAMENTO",
    postalCode: "CÓDIGO POSTAL",
    province: "PROVINCIA Y PAÍS",
    saveAndFinish: "GUARDAR Y FINALIZAR",
    sslNote: "TUS DATOS ESTÁN PROTEGIDOS POR SSL",
  },

  // COMMON
  common: {
    loading: "Cargando...",
    error: "Algo salió mal. Intentá de nuevo.",
    retry: "Reintentar",
    cancel: "Cancelar",
    save: "Guardar",
    back: "Volver",
    appName: "Tu Profesional",
    professionals: "{n} profesionales",
    kmAway: "a {km} km",
    online: "Online",
    presencial: "Presencial",
    available: "Disponible",
    noResults: "No encontramos profesionales con esos filtros.",
    tryOtherFilters: "Probá cambiando la zona o la especialidad.",
  },
} as const;

// Helper para reemplazar variables en strings
// Uso: interpolate(strings.common.professionals, { n: 24 }) → "24 profesionales"
export function interpolate(
  template: string,
  vars: Record<string, string | number>,
): string {
  return Object.entries(vars).reduce(
    (str, [key, value]) => str.replace(`{${key}}`, String(value)),
    template,
  );
}
