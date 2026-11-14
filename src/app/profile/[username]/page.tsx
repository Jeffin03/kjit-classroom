import Profile from "@/frontend/components/Profile"

export default async function UserProfilePage({
  params,
}: {
  params: Promise<{ username: string }>
}) {
  const { username } = await params
  return <Profile targetUsername={username} />
}
