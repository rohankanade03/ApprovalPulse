import { WorkflowDetail } from "@/features/workflow/components/WorkflowDetail";

export default async function WorkflowDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <WorkflowDetail applicationId={id} />;
}
