import { useState, useCallback } from 'react';
import { View, FlatList, RefreshControl, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { GraduationCap } from 'lucide-react-native';
import type { TrainingDto } from '@ssm/shared';
import { useInfiniteTrainings } from '@/hooks/use-trainings';
import { TrainingCard } from '@/components/trainings/TrainingCard';
import { SearchInput, FAB, EmptyState, SkeletonList, ErrorState } from '@/components/ui';
import { colors } from '@/theme';

const ItemSeparator = () => <View className="h-3" />;

export default function TrainingsListScreen() {
  const router = useRouter();
  const [search, setSearch] = useState('');

  const {
    data,
    isLoading,
    isError,
    refetch,
    isRefetching,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteTrainings({
    limit: 20,
    search: search || undefined,
  });

  const trainings = data?.pages.flatMap((p) => p.data) ?? [];

  const handlePress = useCallback(
    (training: TrainingDto) => {
      router.push(`/(app)/(tabs)/trainings/${training.uuid}`);
    },
    [router],
  );

  const renderItem = useCallback(
    ({ item }: { item: TrainingDto }) => (
      <TrainingCard training={item} onPress={() => handlePress(item)} />
    ),
    [handlePress],
  );

  if (isLoading) {
    return (
      <View className="flex-1 bg-gray-50">
        <View className="px-4 pt-4 pb-2">
          <SearchInput value={search} onChangeText={setSearch} placeholder="Caută instructaje..." />
        </View>
        <SkeletonList count={5} />
      </View>
    );
  }

  if (isError) {
    return (
      <View className="flex-1 bg-gray-50">
        <ErrorState
          title="Eroare la încărcare"
          description="Nu am putut încărca instructajele."
          onRetry={refetch}
        />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-50">
      <View className="px-4 pt-4 pb-2">
        <SearchInput value={search} onChangeText={setSearch} placeholder="Caută instructaje..." />
      </View>

      {trainings.length === 0 && !search ? (
        <EmptyState
          title="Niciun instructaj"
          description="Nu aveți instructaje programate."
          icon={GraduationCap}
          actionLabel="Instructaj nou"
          onAction={() => router.push('/(app)/(tabs)/trainings/create')}
        />
      ) : trainings.length === 0 ? (
        <EmptyState
          title="Niciun rezultat"
          description={`Nu am găsit instructaje pentru "${search}".`}
          icon={GraduationCap}
        />
      ) : (
        <FlatList
          data={trainings}
          keyExtractor={(item) => item.uuid}
          renderItem={renderItem}
          contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 8, paddingBottom: 100 }}
          ItemSeparatorComponent={ItemSeparator}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching && !isFetchingNextPage}
              onRefresh={refetch}
              tintColor={colors.primary.DEFAULT}
              colors={[colors.primary.DEFAULT]}
            />
          }
          onEndReached={() => {
            if (hasNextPage && !isFetchingNextPage) {
              fetchNextPage();
            }
          }}
          onEndReachedThreshold={0.5}
          ListFooterComponent={isFetchingNextPage ? <ActivityIndicator className="py-4" color={colors.primary.DEFAULT} /> : null}
        />
      )}

      <FAB onPress={() => router.push('/(app)/(tabs)/trainings/create')} />
    </View>
  );
}
