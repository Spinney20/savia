import { useState, useCallback } from 'react';
import { View, FlatList, RefreshControl, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Users } from 'lucide-react-native';
import type { EmployeeDto } from '@ssm/shared';
import { useInfiniteEmployees } from '@/hooks/use-employees';
import { EmployeeCard } from '@/components/employees/EmployeeCard';
import { SearchInput, FAB, EmptyState, SkeletonList, ErrorState } from '@/components/ui';
import { colors } from '@/theme';

const ItemSeparator = () => <View className="h-3" />;

export default function EmployeesListScreen() {
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
  } = useInfiniteEmployees({
    limit: 20,
    search: search || undefined,
  });

  const employees = data?.pages.flatMap((p) => p.data) ?? [];

  const handlePress = useCallback(
    (employee: EmployeeDto) => {
      router.push(`/(app)/(tabs)/employees/${employee.uuid}`);
    },
    [router],
  );

  const renderItem = useCallback(
    ({ item }: { item: EmployeeDto }) => (
      <EmployeeCard employee={item} onPress={() => handlePress(item)} />
    ),
    [handlePress],
  );

  if (isLoading) {
    return (
      <View className="flex-1 bg-gray-50">
        <View className="px-4 pt-4 pb-2">
          <SearchInput value={search} onChangeText={setSearch} placeholder="Caută angajați..." />
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
          description="Nu am putut încărca lista de angajați."
          onRetry={refetch}
        />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-50">
      <View className="px-4 pt-4 pb-2">
        <SearchInput value={search} onChangeText={setSearch} placeholder="Caută angajați..." />
      </View>

      {employees.length === 0 && !search ? (
        <EmptyState
          title="Niciun angajat"
          description="Nu aveți angajați înregistrați."
          icon={Users}
          actionLabel="Adaugă angajat"
          onAction={() => router.push('/(app)/(tabs)/employees/create')}
        />
      ) : employees.length === 0 ? (
        <EmptyState
          title="Niciun rezultat"
          description={`Nu am găsit angajați pentru "${search}".`}
          icon={Users}
        />
      ) : (
        <FlatList
          data={employees}
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

      <FAB onPress={() => router.push('/(app)/(tabs)/employees/create')} />
    </View>
  );
}
