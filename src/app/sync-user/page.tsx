import { db } from "~/server/db";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { notFound, redirect } from "next/navigation";

const SyncUserPage = async () => {
  const { userId } = await auth();

  if (!userId) {
    throw new Error("User not found");
  }

  const client = await clerkClient();
  const user = await client.users.getUser(userId);

  console.log("Syncing user:", user.id);

  if (!user.emailAddresses[0]?.emailAddress) {
    return notFound();
  }

  // Sync user data to database
  await db.user.upsert({
    where: {
      emailAddress: user.emailAddresses[0].emailAddress ?? "",
    },
    update: {
      imageUrl: user.imageUrl,
      firstName: user.firstName,
      lastName: user.lastName,
    },
    create: {
      id: userId,
      emailAddress: user.emailAddresses[0].emailAddress,
      imageUrl: user.imageUrl,
      firstName: user.firstName,
      lastName: user.lastName,
    },
  });

  console.log("User synced successfully, redirecting to dashboard...");

  // Redirect to dashboard after sync
  return redirect("/dashboard");
};

export default SyncUserPage;
