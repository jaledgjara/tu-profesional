// Layout de tabs del área profesional.
// Sólo se renderiza cuando el Stack padre está mostrando el grupo (tabs).
// Cuando el Stack padre navega a `profile/edit-profile`, este layout deja de
// estar en pantalla y por eso la tab bar desaparece naturalmente — sin
// `tabBarStyle: display none` ni trucos: puro routing.

import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { AnimatedTabBar } from "@/shared/components";
import { colors } from "@/shared/theme";

type IoniconName = React.ComponentProps<typeof Ionicons>["name"];

function TabIcon({
  name,
  nameFocused,
  focused,
  color,
  size,
}: {
  name:        IoniconName;
  nameFocused: IoniconName;
  focused:     boolean;
  color:       string;
  size:        number;
}) {
  return (
    <Ionicons name={focused ? nameFocused : name} size={size} color={color} />
  );
}

export default function ProfessionalTabsLayout() {
  return (
    <Tabs
      tabBar={(props) => (
        <AnimatedTabBar
          {...props}
          activeTintColor={colors.brand.primary}
          activePillColor={colors.brand.primaryLight}
        />
      )}
      screenOptions={{ headerShown: false }}
    >
      <Tabs.Screen
        name="home/index"
        options={{
          title: "Inicio",
          tabBarIcon: ({ focused, color, size }) => (
            <TabIcon
              name="home-outline"
              nameFocused="home"
              focused={focused}
              color={color}
              size={size}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="briefcase/index"
        options={{
          title: "Mi Portafolio",
          tabBarIcon: ({ focused, color, size }) => (
            <TabIcon
              name="document-text-outline"
              nameFocused="document-text"
              focused={focused}
              color={color}
              size={size}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="profile/index"
        options={{
          title: "Perfil",
          tabBarIcon: ({ focused, color, size }) => (
            <TabIcon
              name="person-outline"
              nameFocused="person"
              focused={focused}
              color={color}
              size={size}
            />
          ),
        }}
      />

      {/* Sub-rutas accesibles por navegación pero sin botón propio en la tab bar.
          Expo Router descubre todos los .tsx del folder y les arma una tab por
          default; href:null las registra como navegables pero invisibles. */}
      <Tabs.Screen name="briefcase/reviews" options={{ href: null }} />
    </Tabs>
  );
}
