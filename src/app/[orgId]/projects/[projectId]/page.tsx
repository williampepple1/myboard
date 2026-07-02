import ProjectClient from '@/components/dashboard/ProjectClient'

export default async function ProjectPage(props: { params: Promise<{ projectId: string }> }) {
  const params = await props.params;
  
  return (
    <ProjectClient projectId={params.projectId} />
  )
}
