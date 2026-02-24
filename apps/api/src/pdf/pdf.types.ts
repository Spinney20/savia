export interface InspectionPdfData {
  companyName: string;
  companyAddress: string | null;
  companyCui: string | null;
  siteName: string;
  siteAddress: string | null;
  templateName: string;
  inspectorName: string;
  status: string;
  riskScore: number | null;
  totalItems: number;
  compliantItems: number;
  nonCompliantItems: number;
  startedAt: string | null;
  completedAt: string | null;
  submittedAt: string | null;
  notes: string | null;
  items: InspectionItemPdfData[];
}

export interface InspectionItemPdfData {
  sectionId: string;
  questionId: string;
  answerType: string;
  answerBool: boolean | null;
  answerText: string | null;
  answerNumber: number | null;
  isCompliant: boolean | null;
  severity: string | null;
  notes: string | null;
}

export interface TrainingPdfData {
  companyName: string;
  companyAddress: string | null;
  companyCui: string | null;
  siteName: string;
  siteAddress: string | null;
  conductorName: string;
  trainingType: string;
  title: string;
  description: string | null;
  conductedAt: string;
  durationMinutes: number | null;
  participants: TrainingParticipantPdfData[];
}

export interface TrainingParticipantPdfData {
  employeeName: string;
  confirmationMethod: string;
  confirmedAt: string | null;
}
