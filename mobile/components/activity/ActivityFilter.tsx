import type { JobStatus } from '@pocketdev/shared';
import { Pressable, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import type { Job } from '@/types/api';
import { cn } from '@/utils/cn';

export type ActivityFilterValue = 'ALL' | JobStatus;

const FILTERS: readonly {
  value: ActivityFilterValue;
  label: string;
}[] = [
  { value: 'ALL', label: 'All' },
  { value: 'RUNNING', label: 'Running' },
  { value: 'QUEUED', label: 'Queued' },
  { value: 'SUCCEEDED', label: 'Succeeded' },
  { value: 'FAILED', label: 'Failed' },
  { value: 'CANCELED', label: 'Canceled' },
];

export function ActivityFilter({
  jobs,
  value,
  onChange,
}: {
  jobs: Job[];
  value: ActivityFilterValue;
  onChange: (value: ActivityFilterValue) => void;
}) {
  return (
    <View>
      <AppText variant="label" className="mb-2.5 px-0.5">
        Filter by status
      </AppText>
      <View className="flex-row flex-wrap gap-2">
        {FILTERS.map((filter) => {
          const selected = value === filter.value;
          const count =
            filter.value === 'ALL'
              ? jobs.length
              : jobs.filter((job) => job.status === filter.value).length;

          return (
            <Pressable
              key={filter.value}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              accessibilityLabel={`${filter.label}, ${count} jobs`}
              onPress={() => onChange(filter.value)}
              className={cn(
                'flex-row items-center gap-1.5 rounded-full border px-3 py-1.5 active:opacity-80 active:scale-[0.98]',
                selected
                  ? 'border-[#0091FF] bg-[#0091FF]'
                  : 'border-white/[0.08] bg-[#1C1C1E]',
              )}
            >
              <AppText
                className={cn(
                  'text-xs font-semibold',
                  selected ? 'text-white' : 'text-[rgba(235,235,245,0.70)]',
                )}
              >
                {filter.label}
              </AppText>
              <View
                className={cn(
                  'min-w-4 items-center rounded-full px-1.5 py-0.2',
                  selected ? 'bg-white/25' : 'bg-white/[0.08]',
                )}
              >
                <AppText
                  className={cn(
                    'text-[10px] font-bold',
                    selected ? 'text-white' : 'text-[rgba(235,235,245,0.45)]',
                  )}
                >
                  {count}
                </AppText>
              </View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
