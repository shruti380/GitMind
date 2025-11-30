import { SignIn } from "@clerk/nextjs";

export default function Page() {
  return (
    <div className="flex h-screen items-center justify-center bg-black">
      <SignIn
        appearance={{
          elements: {
            rootBox: "mx-auto",
            card: "bg-zinc-900",
          },
        }}
        afterSignInUrl="/sync-user"
        redirectUrl="/sync-user"
        signUpUrl="/sign-up"
      />
    </div>
  );
}
