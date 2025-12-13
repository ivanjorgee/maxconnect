import { redirect } from "next/navigation";
import { getAuthPayload } from "@/lib/auth";
import { LoginForm } from "./login-form";

type Props = {
  searchParams?: { redirect?: string };
};

export default async function LoginPage({ searchParams }: Props) {
  const session = await getAuthPayload();
  const redirectTo = searchParams?.redirect || "/";

  if (session) {
    redirect(redirectTo);
  }

  return <LoginForm redirectTo={redirectTo} />;
}
