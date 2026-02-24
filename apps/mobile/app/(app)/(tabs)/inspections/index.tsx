import { useState, useCallback } from 'react';
import { View, FlatList, RefreshControl, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { ClipboardCheck } from 'lucide-react-native';
import type { InspectionDto } from '@ssm/shared';
import { useInfiniteInspections } from '@/hooks/use-inspections';
import { InspectionCard } from '@/components/inspections/InspectionCard';
import { SearchInput, FAB, EmptyState, SkeletonList, ErrorState } from '@/components/ui';
import { colors } from '@/theme';

const ItemSeparator = () => <View className="h-3" />;

export default function InspectionsListScreen() {
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
  } = useInfiniteInspections({
    limit: 20,
    search: search || undefined,
  });

  const inspections = data?.pages.flatMap((p) => p.data) ?? [];

  const handlePress = useCallback(
    (inspection: InspectionDto) => {
      router.push(`/(app)/(tabs)/inspections/${inspection.uuid}`);
    },
    [router],
  );

  const renderItem = useCallback(
    ({ item }: { item: InspectionDto }) => (
      <InspectionCard inspection={item} onPress={() => handlePress(item)} />
    ),
    [handlePress],
  );

  if (isLoading) {
    return (
      <View className="flex-1 bg-gray-50">
        <View className="px-4 pt-4 pb-2">
          <SearchInput value={search} onChangeText={setSearch} placeholder="Caută inspecții..." />
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
          description="Nu am putut încărca inspecțiile. Încercați din nou."
          onRetry={refetch}
        />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-50">
      <View className="px-4 pt-4 pb-2">
        <SearchInput value={search} onChangeText={setSearch} placeholder="Caută inspecții..." />
      </View>

      {inspections.length === 0 && !search ? (
        <EmptyState
          title="Nicio inspecție"
          description="Nu aveți inspecții încă. Creați prima inspecție."
          icon={ClipboardCheck}
          actionLabel="Inspecție nouă"
          onAction={() => router.push('/(app)/(tabs)/inspections/create')}
        />
      ) : inspections.length === 0 && search ? (
        <EmptyState
          title="Niciun rezultat"
          description={`Nu am găsit inspecții pentru "${search}".`}
          icon={ClipboardCheck}
        />
      ) : (
        <FlatList
          data={inspections}
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

      <FAB onPress={() => router.push('/(app)/(tabs)/inspections/create')} />
    </View>
  );
}
