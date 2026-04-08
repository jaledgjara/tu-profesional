import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { AnimatedTabBar } from '@/shared/components';
import { colors } from '@/shared/theme';

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

function TabIcon({
  name,
  nameFocused,
  focused,
  color,
  size,
}: {
  name:         IoniconName;
  nameFocused:  IoniconName;
  focused:      boolean;
  color:        string;
  size:         number;
}) {
  return (
    <Ionicons name={focused ? nameFocused : name} size={size} color={color} />
  );
}

export default function ProfessionalLayout() {
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
          title: 'Inicio',
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
          title: 'Mi Portafolio',
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
          title: 'Perfil',
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
    </Tabs>
  );
}
