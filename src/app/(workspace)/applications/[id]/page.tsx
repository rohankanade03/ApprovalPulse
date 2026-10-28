import { ApplicationDetails } from "@/features/applications/components/ApplicationDetails";

export default async function ApplicationDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ApplicationDetails applicationId={id} />;
}
