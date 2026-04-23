// Ruta: /(auth)/ProfessionalStatusScreen
// Pantalla post-onboarding del profesional: muestra el status de aprobación.
// Por default arranca en 'pending' y al volver a entrar (foreground o mount)
// refetchea para mostrar approved / rejected si el admin ya revisó.

import ProfessionalStatusScreen from "@/features/auth/screens/ProfessionalStatusScreen";

export default ProfessionalStatusScreen;
