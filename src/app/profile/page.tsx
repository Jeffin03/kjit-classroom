import Profile from "@/frontend/components/Profile"

export default async function ProfilePage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const params = await searchParams
  const username =
    typeof params.username === "string" ? params.username : undefined
  return <Profile targetUsername={username} />
}
