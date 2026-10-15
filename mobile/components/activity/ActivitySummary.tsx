import { View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { Card } from '@/components/ui/Card';
import type { Job, Session } from '@/types/api';

function SummaryMetric({
  label,
  value,
  accent = false,
}: {
  label: string;
  value: number;
  accent?: boolean;
}) {
  return (
    <View className="flex-1 items-center px-2 py-3">
      <AppText
        className={accent ? 'text-[17px] font-semibold text-[#0091FF]' : 'text-[17px] font-semibold text-white'}
      >
        {value}
      </AppText>
      <AppText className="mt-0.5 text-[11px] font-medium text-[rgba(235,235,245,0.50)]">{label}</AppText>
    </View>
  );
}

export function ActivitySummary({ jobs, sessions }: { jobs: Job[]; sessions: Session[] }) {
  const activeJobs = jobs.filter(
    (job) => job.status === 'QUEUED' || job.status === 'RUNNING',
  ).length;
  const succeededJobs = jobs.filter((job) => job.status === 'SUCCEEDED').length;
  const activeSessions = sessions.filter((session) => session.status === 'ACTIVE').length;

  return (
    <Card className="overflow-hidden p-0 border border-white/[0.08] bg-[#1C1C1E]">
      <View className="flex-row items-center justify-between px-4 py-3.5">
        <View>
          <AppText variant="label">Command Runs</AppText>
          <AppText variant="title" className="mt-0.5">
            {jobs.length}
          </AppText>
        </View>
        <View className="h-9 w-9 items-center justify-center rounded-full bg-[#2C2C2E] border border-white/[0.08]">
          <View className="h-2 w-2 rounded-full bg-[#0091FF]" />
        </View>
      </View>
      <View className="flex-row border-t border-white/[0.06]">
        <SummaryMetric label="Active Jobs" value={activeJobs} accent={activeJobs > 0} />
        <View className="w-px bg-white/[0.06]" />
        <SummaryMetric label="Succeeded" value={succeededJobs} />
        <View className="w-px bg-white/[0.06]" />
        <SummaryMetric label="Live Sessions" value={activeSessions} accent={activeSessions > 0} />
      </View>
    </Card>
  );
}
