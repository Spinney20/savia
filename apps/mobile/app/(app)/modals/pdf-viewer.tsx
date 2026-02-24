import { useEffect } from 'react';
import { View } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { Text, Button, SafeAreaView } from '@/components/ui';
import { FileText } from 'lucide-react-native';
import { colors } from '@/theme';

export default function PdfViewerModal() {
  const { url, title } = useLocalSearchParams<{ url: string; title?: string }>();
  const router = useRouter();

  useEffect(() => {
    if (url) {
      WebBrowser.openBrowserAsync(url).then(() => {
        router.back();
      });
    }
  }, [url, router]);

  return (
    <>
      <Stack.Screen options={{ title: title ?? 'Document PDF' }} />
      <SafeAreaView>
        <View className="flex-1 items-center justify-center px-8">
          <FileText size={48} color={colors.gray[300]} className="mb-4" />
          <Text variant="body" muted className="text-center mb-6">
            Documentul PDF se deschide în browser...
          </Text>
          <Button variant="outline" onPress={() => router.back()}>
            Înapoi
          </Button>
        </View>
      </SafeAreaView>
    </>
  );
}
