import { View, ScrollView } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { format } from 'date-fns';
import { ro } from 'date-fns/locale';
import { MapPin, User, Calendar, MessageSquare } from 'lucide-react-native';
import { useIssue, useIssueComments, useCreateIssueComment } from '@/hooks/use-issues';
import { Text, Card, StatusBadge, SeverityBadge, Spinner, ErrorState, Input, Button } from '@/components/ui';
import { colors } from '@/theme';
import { useState } from 'react';

export default function IssueDetailScreen() {
  const { uuid: rawUuid } = useLocalSearchParams<{ uuid: string }>();
  const uuid = (Array.isArray(rawUuid) ? rawUuid[0] : rawUuid) ?? '';
  const { data: issue, isLoading, isError, refetch } = useIssue(uuid);
  const { data: comments = [] } = useIssueComments(uuid);
  const createComment = useCreateIssueComment(uuid);
  const [commentText, setCommentText] = useState('');

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-gray-50">
        <Spinner message="Se încarcă..." />
      </View>
    );
  }

  if (isError || !issue) {
    return (
      <View className="flex-1 bg-gray-50">
        <ErrorState
          title="Eroare"
          description="Nu am putut încărca detaliile problemei."
          onRetry={refetch}
        />
      </View>
    );
  }

  const handleComment = () => {
    if (!commentText.trim()) return;
    createComment.mutate({ content: commentText.trim() }, {
      onSuccess: () => setCommentText(''),
    });
  };

  return (
    <View className="flex-1 bg-gray-50">
      <ScrollView contentContainerClassName="pb-32">
        <Card className="mx-4 mt-4">
          <View className="flex-row items-center justify-between mb-3">
            <StatusBadge status={issue.status} type="issue" />
            <SeverityBadge severity={issue.severity} />
          </View>
          <Text variant="h2" className="text-gray-900 mb-2">{issue.title}</Text>
          <Text variant="body" className="text-gray-700 mb-4">{issue.description}</Text>

          <View className="gap-2">
            <View className="flex-row items-center gap-2">
              <User size={15} color={colors.gray[400]} />
              <Text variant="bodySmall" muted>Raportat de {issue.reporterName}</Text>
            </View>
            <View className="flex-row items-center gap-2">
              <Calendar size={15} color={colors.gray[400]} />
              <Text variant="bodySmall" muted>
                {format(new Date(issue.reportedAt), 'dd MMMM yyyy, HH:mm', { locale: ro })}
              </Text>
            </View>
            {issue.latitude && issue.longitude && (
              <View className="flex-row items-center gap-2">
                <MapPin size={15} color={colors.gray[400]} />
                <Text variant="bodySmall" muted>
                  {issue.latitude.toFixed(5)}, {issue.longitude.toFixed(5)}
                </Text>
              </View>
            )}
            {issue.categoryName && (
              <Text variant="bodySmall" muted>Categorie: {issue.categoryName}</Text>
            )}
          </View>
        </Card>

        {/* Status history */}
        {issue.statusHistory.length > 0 && (
          <View className="mx-4 mt-4">
            <Text variant="h3" className="text-gray-900 mb-3">Istoric status</Text>
            {issue.statusHistory.map((entry) => (
              <View key={`${entry.toStatus}-${entry.changedAt}`} className="flex-row items-start gap-3 mb-3">
                <View className="w-2 h-2 rounded-full bg-primary mt-1.5" />
                <View className="flex-1">
                  <Text variant="bodySmall" className="text-gray-900">
                    {entry.fromStatus ? `${entry.fromStatus} → ${entry.toStatus}` : entry.toStatus}
                  </Text>
                  <Text variant="caption" muted>
                    {entry.changedByName} — {format(new Date(entry.changedAt), 'dd MMM yyyy, HH:mm', { locale: ro })}
                  </Text>
                  {entry.reason && (
                    <Text variant="caption" muted className="mt-0.5">{entry.reason}</Text>
                  )}
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Comments */}
        <View className="mx-4 mt-4">
          <Text variant="h3" className="text-gray-900 mb-3">
            Comentarii ({comments.length})
          </Text>
          {comments.map((c) => (
            <Card key={`${c.authorName}-${c.createdAt}`} className="mb-2">
              <View className="flex-row items-center gap-2 mb-1">
                <Text variant="bodySmall" className="font-semibold text-gray-900">
                  {c.authorName}
                </Text>
                <Text variant="caption" muted>
                  {format(new Date(c.createdAt), 'dd MMM, HH:mm', { locale: ro })}
                </Text>
              </View>
              <Text variant="body" className="text-gray-700">{c.content}</Text>
            </Card>
          ))}
        </View>
      </ScrollView>

      {/* Comment input */}
      <View className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-3 flex-row items-center gap-2">
        <Input
          placeholder="Adaugă un comentariu..."
          value={commentText}
          onChangeText={setCommentText}
          className="flex-1"
        />
        <Button
          variant="primary"
          size="sm"
          loading={createComment.isPending}
          onPress={handleComment}
        >
          Trimite
        </Button>
      </View>
    </View>
  );
}
