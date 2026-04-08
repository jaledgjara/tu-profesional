// Ruta: /(professional)/profile
// Perfil del profesional — mismo screen que el cliente más el item "Editar mi perfil".

import { ProfileScreen } from "@/features/profile/screens/ProfileScreen";

export default function ProfessionalProfile() {
  return (
    <ProfileScreen
      variant="professional"
      onEditProfile={() => {
        // TODO: navegar al formulario de edición cuando exista
      }}
    />
  );
}
