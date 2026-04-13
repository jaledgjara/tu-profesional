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

    // LocationFormScreen — títulos por modo
    clientLocationTitle: "¿Dónde vivís?",
    clientLocationDesc:  "Usamos tu ubicación para mostrarte profesionales cerca tuyo.",
    proLocationTitle:    "¿Dónde atendés?",
    proLocationDesc:     "Ingresá la dirección de tu consultorio. Solo la usamos para calcular distancias.",

    roleTitle: "Seleccioná tu perfil",
    roleSubtitle:
      "Personalizaremos tu experiencia según cómo quieras usar la plataforma.",
    roleUser: "Cliente",
    roleUserDesc: "Busco profesionales para mis necesidades personales.",
    rolePro: "Profesional",
    roleProDesc: "Quiero ofrecer mis servicios y conectar con nuevos clientes.",
    stepIndicator: "PASO {current} DE {total}",
    continueCta: "Continuar",

    // Alerts de auth
    alertClose:              "Cerrar",
    alertSendErrorTitle:     "No pudimos enviar el código",
    alertVerifyErrorTitle:   "Código inválido",
    alertResendCooldownTitle: "Esperá un momento",
    alertResendCooldownMsg:  "Podés reenviar el código en {seconds} segundos.",
    alertResendSuccessTitle: "Código reenviado",
    alertResendSuccessMsg:   "Te mandamos un nuevo código a {email}.",
    alertResendErrorTitle:   "No pudimos reenviar",
    alertProfileErrorTitle:  "No pudimos guardar tu perfil",
    alertLocationErrorTitle: "No pudimos guardar tu ubicación",
    alertGpsErrorTitle:      "No pudimos obtener tu ubicación",
    alertProfessionalErrorTitle: "No pudimos guardar tu perfil",
    alertGenericMsg:         "Probá de nuevo.",
  },

  // HOME (usuario)
  home: {
    welcomeLabel: "BIENVENIDO/A",
    greeting: "Buen día,",
    searchPlaceholder: "Buscar profesionales, especialidades...",
    sectionExplore: "Explorar por Enfoque",
    sectionNearby: "Más cercanos",
    seeAll: "Ver todos",
    filterAll: "Todos",
    filterOnline: "Online",
    filterPresencial: "Presencial",
    filterDisponible: "Disponible",
    comingSoon: "PRONTO",
    emptyTitle: "Sin resultados",
    emptyDesc: "No encontramos profesionales cerca tuyo. Probá cambiando los filtros.",
    errorTitle: "Algo salió mal",
    errorDesc: "No pudimos cargar los profesionales. Revisá tu conexión.",
    retry: "Reintentar",
  },

  // SEARCH
  search: {
    title: "Buscar",
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
    socialNetworks: "Redes sociales",
    seeAllReviews: "Ver todas las reseñas",
    experience: "Experiencia",
    rating: "Calificación",
    reviews_label: "Reseñas",
    leaveAppTitle: "¿Salir de la app?",
    leaveAppDesc: "Serás redirigido a una aplicación externa.",
    leaveAppConfirm: "Ir",
    distance: "de tu casa",
  },

  // PERFIL (usuario)
  userProfile: {
    title: "Mi Perfil",
    personalInfo: "Información Personal",
    notifications: "Notificaciones",
    platformNews: "Novedades de la plataforma",
    platformNewsDesc: "Recibí actualizaciones sobre nuevos servicios.",
    name: "Nombre",
    email: "EMAIL",
    phone: "Teléfono",
    phoneEmpty: "No configurado",
    edit: "Editar",
    logout: "Cerrar sesión",
    privacy: "Privacidad",
    moreOptions: "Más opciones",
    mockEmail: "miNombre@email.com",
    mockName: "Nombre Usuario",
    logoutAlertTitle: "¿Cerrar sesión?",
    logoutAlertMessage: "Vas a tener que iniciar sesión de nuevo para volver a entrar.",
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
    logoutAlertTitle: "¿Cerrar sesión?",
    logoutAlertMessage: "Vas a tener que iniciar sesión de nuevo. Tu perfil seguirá visible para los pacientes.",
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

    // ProfessionalFormScreen
    profileTitle:              "Perfil Profesional",
    photoPickerMsg:            "Tocá para subir tu foto de perfil",
    photoPermissionMsg:        "Tu Profesional necesita acceso a tu galería de fotos para que puedas subir tu imagen de perfil.",
    descriptionPersonal:       "DESCRIPCIÓN PERSONAL",
    verifiedLicense:           "MATRÍCULA VERIFICADA",
    specialty:                 "ESPECIALIDAD",
    specialtyPlaceholder:      "Ej: Psicoanálisis",
    subSpecialties:            "SUB-ESPECIALIDADES",
    subSpecialtiesPlaceholder: "Ej: niños, pareja, duelo...",
    personalization:           "PERSONALIZACIÓN",
    attendOnline:              "Atención Online",
    attendPresencial:          "Presencial",
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
