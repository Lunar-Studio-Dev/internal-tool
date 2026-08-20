"use client";

import { DiscoveryForm } from "@/features/phases/components/discovery-form";
import { RequirementForm } from "@/features/phases/components/requirement-form";
import { UnderstandingForm } from "@/features/phases/components/understanding-form";
import type { PhaseDataDto } from "@/features/phases/api";
import { PhaseType } from "@/generated/prisma/enums";

export function PhaseContent({
  pipelineId,
  currentPhase,
  phaseData,
  canWrite,
}: {
  pipelineId: string;
  currentPhase: PhaseType;
  phaseData: PhaseDataDto;
  canWrite: boolean;
}) {
  return (
    <div className="flex flex-col gap-4">
      {currentPhase === PhaseType.DISCOVERY ? (
        <DiscoveryForm pipelineId={pipelineId} discovery={phaseData.discovery} canWrite={canWrite} />
      ) : null}

      {currentPhase === PhaseType.BUSINESS_UNDERSTANDING ? (
        <UnderstandingForm
          pipelineId={pipelineId}
          understanding={phaseData.understanding}
          canWrite={canWrite}
        />
      ) : null}

      {currentPhase === PhaseType.REQUIREMENT ? (
        <RequirementForm
          pipelineId={pipelineId}
          requirement={phaseData.requirement}
          canWrite={canWrite}
        />
      ) : null}
    </div>
  );
}
