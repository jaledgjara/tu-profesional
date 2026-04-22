// Contenido legal — textos largos placeholder.
//
// ⚠️ IMPORTANTE: estos textos son un borrador estructural listo para que un
// abogado los revise, complete y/o reemplace. Usan un lenguaje neutro y
// estándar del rubro pero NO constituyen asesoramiento legal ni deben
// publicarse sin revisión profesional.
//
// Formato: cada documento es un array de secciones { heading, body }.
// El componente LegalTextScreen renderiza cada sección como H2 + párrafos.

export interface LegalSection {
  heading: string;
  body:    string;
}

export interface LegalDocument {
  title:        string;
  updatedAt:    string; // ISO date — se formatea en pantalla
  sections:     LegalSection[];
}

// Fecha placeholder — actualizar cuando el abogado finalice el texto.
const PLACEHOLDER_UPDATED = "2026-04-14";

// ─────────────────────────────────────────────────────────────────────────────
// TÉRMINOS Y CONDICIONES
// ─────────────────────────────────────────────────────────────────────────────

export const TERMS_DOCUMENT: LegalDocument = {
  title:     "Términos y Condiciones",
  updatedAt: PLACEHOLDER_UPDATED,
  sections: [
    {
      heading: "1. Aceptación de los términos",
      body:
        "Al crear una cuenta en Tu Profesional, el usuario manifiesta haber leído, " +
        "comprendido y aceptado los presentes Términos y Condiciones, así como la " +
        "Política de Privacidad que forma parte integrante del presente documento. " +
        "Si el usuario no está de acuerdo con alguna de las disposiciones aquí " +
        "establecidas, deberá abstenerse de utilizar la plataforma.",
    },
    {
      heading: "2. Descripción del servicio",
      body:
        "Tu Profesional es una plataforma digital que conecta a usuarios con " +
        "profesionales de la salud mental en la República Argentina. La plataforma " +
        "actúa exclusivamente como intermediaria tecnológica, facilitando el contacto " +
        "entre las partes. Tu Profesional NO presta servicios de salud mental, no " +
        "ofrece diagnósticos ni tratamientos, y no participa en la relación " +
        "terapéutica que se establece entre el profesional y el paciente.",
    },
    {
      heading: "3. Cuentas de usuario",
      body:
        "Existen dos tipos de cuenta: (a) Cuenta de Usuario Final, destinada a " +
        "personas que buscan profesionales, de uso gratuito; y (b) Cuenta " +
        "Profesional, destinada a psicólogos matriculados que ofrecen sus servicios, " +
        "con suscripción mensual paga. El usuario se compromete a brindar " +
        "información veraz, completa y actualizada al momento del registro, y a " +
        "mantener la confidencialidad de sus credenciales de acceso.",
    },
    {
      heading: "4. Obligaciones del profesional",
      body:
        "El profesional declara y garantiza contar con matrícula vigente habilitante " +
        "para el ejercicio de la psicología en la jurisdicción donde presta sus " +
        "servicios. Tu Profesional se reserva el derecho de verificar dicha " +
        "matrícula y de suspender o eliminar cuentas cuya documentación resulte " +
        "falsa, vencida o inexacta. El profesional es el único responsable por la " +
        "veracidad de la información publicada en su perfil y por la calidad de los " +
        "servicios profesionales prestados a sus pacientes.",
    },
    {
      heading: "5. Suscripción y pagos",
      body:
        "La Cuenta Profesional requiere una suscripción mensual cuyo precio vigente " +
        "se informa al momento de la contratación. Los pagos se procesan a través " +
        "de Mercado Pago mediante el mecanismo de Preapproval (débito automático). " +
        "El profesional podrá cancelar su suscripción en cualquier momento desde la " +
        "plataforma; la cancelación surtirá efecto al finalizar el período ya " +
        "abonado. No se realizan reembolsos por períodos parciales.",
    },
    {
      heading: "6. Conducta del usuario",
      body:
        "El usuario se compromete a utilizar la plataforma de forma lícita, " +
        "respetuosa y conforme a las buenas prácticas. Queda expresamente prohibido: " +
        "(i) publicar contenido ofensivo, discriminatorio o ilegal; (ii) suplantar " +
        "la identidad de terceros; (iii) realizar ingeniería inversa, scraping o " +
        "cualquier actividad automatizada sobre la plataforma; (iv) utilizar los " +
        "datos de otros usuarios para fines distintos a los previstos.",
    },
    {
      heading: "7. Propiedad intelectual",
      body:
        "Todos los contenidos, marcas, logos, diseños, código fuente y demás " +
        "elementos de la plataforma son propiedad exclusiva de Tu Profesional o de " +
        "sus licenciantes. El usuario no adquiere ningún derecho sobre dichos " +
        "elementos por el solo hecho de utilizar la plataforma.",
    },
    {
      heading: "8. Limitación de responsabilidad",
      body:
        "Tu Profesional no será responsable por los daños directos, indirectos, " +
        "incidentales, especiales o consecuentes que pudieran surgir del uso o la " +
        "imposibilidad de uso de la plataforma, incluyendo pero no limitándose a la " +
        "calidad de los servicios profesionales contratados por el usuario, " +
        "diagnósticos o tratamientos recibidos, o el resultado de las sesiones " +
        "terapéuticas.",
    },
    {
      heading: "9. Modificación de los términos",
      body:
        "Tu Profesional podrá modificar los presentes Términos y Condiciones en " +
        "cualquier momento. Los cambios serán notificados a través de la plataforma " +
        "y entrarán en vigencia a los quince (15) días corridos de su publicación. " +
        "El uso continuado de la plataforma tras dicho plazo implicará la aceptación " +
        "de los nuevos términos.",
    },
    {
      heading: "10. Legislación aplicable y jurisdicción",
      body:
        "Los presentes términos se rigen por las leyes de la República Argentina. " +
        "Para cualquier controversia derivada de su interpretación o ejecución, las " +
        "partes se someten a la jurisdicción de los tribunales ordinarios con " +
        "competencia en la Ciudad Autónoma de Buenos Aires, renunciando a cualquier " +
        "otro fuero que pudiera corresponder.",
    },
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
// POLÍTICA DE PRIVACIDAD
// ─────────────────────────────────────────────────────────────────────────────

export const PRIVACY_DOCUMENT: LegalDocument = {
  title:     "Política de Privacidad",
  updatedAt: PLACEHOLDER_UPDATED,
  sections: [
    {
      heading: "1. Responsable del tratamiento",
      body:
        "El responsable del tratamiento de los datos personales recolectados a " +
        "través de la plataforma es Tu Profesional, con domicilio en la Ciudad " +
        "Autónoma de Buenos Aires, República Argentina. El tratamiento se rige por " +
        "la Ley Nacional N° 25.326 de Protección de Datos Personales y su " +
        "reglamentación.",
    },
    {
      heading: "2. Datos que recolectamos",
      body:
        "Recolectamos los siguientes datos: (i) datos de identificación (nombre, " +
        "email, teléfono); (ii) datos profesionales (matrícula, especialidad, " +
        "descripción); (iii) datos de geolocalización (sólo si el usuario los " +
        "brinda explícitamente); (iv) datos de pago (procesados por Mercado Pago, " +
        "Tu Profesional no almacena datos de tarjetas); (v) datos de uso de la " +
        "plataforma (analíticas agregadas y anónimas).",
    },
    {
      heading: "3. Finalidad del tratamiento",
      body:
        "Los datos se utilizan para: (a) permitir el funcionamiento de la " +
        "plataforma y el contacto entre usuarios y profesionales; (b) procesar " +
        "suscripciones y pagos; (c) enviar notificaciones operativas y, " +
        "opcionalmente, comerciales; (d) verificar matrículas profesionales; (e) " +
        "mejorar la experiencia del usuario mediante análisis agregados; (f) " +
        "cumplir con obligaciones legales y requerimientos de autoridades " +
        "competentes.",
    },
    {
      heading: "4. Base legal",
      body:
        "El tratamiento se basa en: (i) el consentimiento del titular de los datos, " +
        "prestado al aceptar esta política; (ii) la ejecución del contrato derivado " +
        "de los Términos y Condiciones; (iii) el cumplimiento de obligaciones " +
        "legales; (iv) el interés legítimo de Tu Profesional en operar y mejorar " +
        "la plataforma.",
    },
    {
      heading: "5. Compartición de datos",
      body:
        "Los datos del profesional publicados en su perfil son visibles para " +
        "cualquier usuario de la plataforma. Los datos de los usuarios finales NO " +
        "son compartidos con los profesionales hasta que el usuario inicia el " +
        "contacto voluntariamente. Podemos compartir datos con proveedores de " +
        "servicios (hosting, pagos, envío de emails) bajo estrictos acuerdos de " +
        "confidencialidad. No vendemos datos personales a terceros.",
    },
    {
      heading: "6. Transferencia internacional",
      body:
        "Algunos de nuestros proveedores tecnológicos pueden almacenar datos en " +
        "servidores ubicados fuera de la República Argentina. En todos los casos " +
        "se verifican niveles adecuados de protección conforme lo exige la Ley " +
        "25.326 y las disposiciones de la Agencia de Acceso a la Información " +
        "Pública.",
    },
    {
      heading: "7. Conservación de los datos",
      body:
        "Los datos se conservan mientras la cuenta permanezca activa. Al eliminar " +
        "la cuenta, los datos personales se borran dentro de un plazo máximo de " +
        "treinta (30) días, excepto aquellos que deban conservarse por obligación " +
        "legal (facturación, prevención de fraude).",
    },
    {
      heading: "8. Derechos del titular",
      body:
        "El usuario tiene derecho a acceder, rectificar, actualizar y suprimir sus " +
        "datos personales, así como a oponerse a su tratamiento, en los términos " +
        "previstos por la Ley 25.326. Puede ejercer estos derechos escribiendo a " +
        "hola@tuprofesional.app. La Agencia de Acceso a la Información Pública, " +
        "órgano de control de la Ley, tiene la atribución de atender denuncias y " +
        "reclamos relativos al incumplimiento de las normas de protección de datos.",
    },
    {
      heading: "9. Seguridad",
      body:
        "Implementamos medidas técnicas y organizativas razonables para proteger " +
        "los datos contra accesos no autorizados, pérdida, alteración o difusión. " +
        "No obstante, ningún sistema es 100% seguro; el usuario reconoce y acepta " +
        "este riesgo inherente al uso de servicios digitales.",
    },
    {
      heading: "10. Cookies y tecnologías similares",
      body:
        "La plataforma utiliza cookies y tecnologías similares para mantener la " +
        "sesión del usuario, recordar preferencias y obtener métricas agregadas de " +
        "uso. El usuario puede configurar su dispositivo para rechazar cookies, " +
        "aunque esto puede limitar la funcionalidad de la plataforma.",
    },
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
// AVISOS LEGALES
// ─────────────────────────────────────────────────────────────────────────────

export const LEGAL_DOCUMENT: LegalDocument = {
  title:     "Avisos Legales",
  updatedAt: PLACEHOLDER_UPDATED,
  sections: [
    {
      heading: "1. Naturaleza del servicio",
      body:
        "Tu Profesional es una plataforma tecnológica de intermediación. No " +
        "constituye un consultorio, clínica ni institución de salud mental. La " +
        "información publicada por los profesionales es de su exclusiva " +
        "responsabilidad; Tu Profesional no garantiza su exactitud, idoneidad ni " +
        "actualización permanente.",
    },
    {
      heading: "2. Emergencias y crisis",
      body:
        "Tu Profesional NO es un servicio de atención de emergencias. Si el " +
        "usuario atraviesa una crisis de salud mental o se encuentra en riesgo de " +
        "autolesión, debe comunicarse inmediatamente con los servicios de " +
        "emergencia correspondientes (SAME 107 en CABA, 911 policial, o la línea " +
        "de asistencia al suicida disponible en cada jurisdicción).",
    },
    {
      heading: "3. Responsabilidad del usuario en la elección del profesional",
      body:
        "La elección del profesional es de exclusiva responsabilidad del usuario. " +
        "Se recomienda verificar la matrícula del profesional en el colegio o " +
        "entidad regulatoria correspondiente antes de iniciar un tratamiento.",
    },
    {
      heading: "4. Contenido de terceros",
      body:
        "La plataforma puede contener enlaces a sitios o servicios de terceros " +
        "(WhatsApp, Instagram, LinkedIn, entre otros). Tu Profesional no controla " +
        "el contenido de dichos sitios y no asume responsabilidad alguna por su " +
        "disponibilidad, políticas de privacidad o prácticas comerciales.",
    },
    {
      heading: "5. Propiedad de la marca",
      body:
        "Tu Profesional, su isologo y demás signos distintivos son marcas " +
        "registradas (o en trámite de registro) en el Instituto Nacional de la " +
        "Propiedad Industrial (INPI). Queda prohibida su utilización sin " +
        "autorización expresa y por escrito.",
    },
    {
      heading: "6. Denuncias y reportes",
      body:
        "Cualquier persona que considere que un contenido publicado en la " +
        "plataforma vulnera sus derechos (honor, imagen, propiedad intelectual, " +
        "etc.) podrá contactarnos escribiendo a hola@tuprofesional.app para " +
        "solicitar su revisión o remoción.",
    },
    {
      heading: "7. Jurisdicción",
      body:
        "Para toda cuestión vinculada a los presentes avisos legales serán " +
        "competentes los tribunales ordinarios de la Ciudad Autónoma de Buenos " +
        "Aires, República Argentina, con renuncia expresa a cualquier otro fuero " +
        "que pudiera corresponder.",
    },
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
// HELPER — selector por clave del enum
// ─────────────────────────────────────────────────────────────────────────────

import type { PrivacyMenuOption } from "@/features/profile/types/menuOptions";

export function getLegalDocument(option: PrivacyMenuOption): LegalDocument {
  switch (option) {
    case "terms":   return TERMS_DOCUMENT;
    case "privacy": return PRIVACY_DOCUMENT;
    case "legal":   return LEGAL_DOCUMENT;
  }
}
