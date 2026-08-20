export type DuplicateCandidate = {
  id: string;
  name: string;
  website: string | null;
  email: string | null;
  primaryContactName: string | null;
  primaryContactEmail: string | null;
  pipelineCount: number;
  activePipelineCount: number;
};
