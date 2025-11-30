import { SignUp } from "@clerk/nextjs";

export default function Page() {
  return (
    <div className="flex h-screen items-center justify-center bg-black">
      <SignUp
        appearance={{
          elements: {
            rootBox: "mx-auto",
            card: "bg-zinc-900",
          },
        }}
        afterSignUpUrl="/sync-user"
        redirectUrl="/sync-user"
        signInUrl="/sign-in"
      />
    </div>
  );
}
