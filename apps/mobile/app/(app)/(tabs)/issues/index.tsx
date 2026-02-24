import { useState, useCallback } from 'react';
import { View, FlatList, RefreshControl, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { AlertTriangle } from 'lucide-react-native';
import type { IssueReportDto } from '@ssm/shared';
import { useInfiniteIssues } from '@/hooks/use-issues';
import { IssueCard } from '@/components/issues/IssueCard';
import { SearchInput, FAB, EmptyState, SkeletonList, ErrorState } from '@/components/ui';
import { colors } from '@/theme';

const ItemSeparator = () => <View className="h-3" />;

export default function IssuesListScreen() {
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
  } = useInfiniteIssues({
    limit: 20,
    search: search || undefined,
  });

  const issues = data?.pages.flatMap((p) => p.data) ?? [];

  const handlePress = useCallback(
    (issue: IssueReportDto) => {
      router.push(`/(app)/(tabs)/issues/${issue.uuid}`);
    },
    [router],
  );

  const renderItem = useCallback(
    ({ item }: { item: IssueReportDto }) => (
      <IssueCard issue={item} onPress={() => handlePress(item)} />
    ),
    [handlePress],
  );

  if (isLoading) {
    return (
      <View className="flex-1 bg-gray-50">
        <View className="px-4 pt-4 pb-2">
          <SearchInput value={search} onChangeText={setSearch} placeholder="Caută probleme..." />
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
          description="Nu am putut încărca problemele. Încercați din nou."
          onRetry={refetch}
        />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-50">
      <View className="px-4 pt-4 pb-2">
        <SearchInput value={search} onChangeText={setSearch} placeholder="Caută probleme..." />
      </View>

      {issues.length === 0 && !search ? (
        <EmptyState
          title="Nicio problemă"
          description="Nu aveți probleme raportate. Raportați prima problemă."
          icon={AlertTriangle}
          actionLabel="Raportează"
          onAction={() => router.push('/(app)/(tabs)/issues/create')}
        />
      ) : issues.length === 0 && search ? (
        <EmptyState
          title="Niciun rezultat"
          description={`Nu am găsit probleme pentru "${search}".`}
          icon={AlertTriangle}
        />
      ) : (
        <FlatList
          data={issues}
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

      <FAB onPress={() => router.push('/(app)/(tabs)/issues/create')} />
    </View>
  );
}
