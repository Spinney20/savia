import { View, Image } from 'react-native';
import { Text } from './Text';

interface AvatarProps {
  uri?: string | null;
  name: string;
  size?: number;
  className?: string;
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return `${parts[0]![0]}${parts[1]![0]}`.toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

export function Avatar({ uri, name, size = 40, className = '' }: AvatarProps) {
  if (uri) {
    return (
      <Image
        source={{ uri }}
        className={`rounded-full ${className}`}
        style={{ width: size, height: size }}
      />
    );
  }

  return (
    <View
      className={`rounded-full bg-primary-100 items-center justify-center ${className}`}
      style={{ width: size, height: size }}
    >
      <Text variant="buttonSmall" className="text-primary">{getInitials(name)}</Text>
    </View>
  );
}
