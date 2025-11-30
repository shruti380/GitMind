import { SignUp } from "@clerk/nextjs";

export default function Page() {
  return (
    <div className="flex h-screen items-center justify-center bg-white">
      <SignUp
        appearance={{
          elements: {
            rootBox: "mx-auto",
            card: "shadow-lg border border-gray-200",
            headerTitle: "text-gray-900",
            headerSubtitle: "text-gray-600",
            formButtonPrimary: "bg-black hover:bg-gray-800",
            footerActionLink: "text-black hover:text-gray-700",
          },
        }}
        afterSignUpUrl="/sync-user"
        redirectUrl="/sync-user"
        signInUrl="/sign-in"
      />
    </div>
  );
}
