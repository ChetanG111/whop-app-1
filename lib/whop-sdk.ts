import { Whop } from "@whop/sdk";

export const whopsdk = new Whop({
	appID: process.env.NEXT_PUBLIC_WHOP_APP_ID,
	apiKey: process.env.WHOP_API_KEY,
	// Use Buffer for base64 encoding to work in Node (btoa is a browser API)
	webhookKey: Buffer.from(process.env.WHOP_WEBHOOK_SECRET || "").toString("base64"),
});

/**
 * Fetch Whop user details and optionally check access for a resource (company/experience).
 * @param userId - Whop user id (e.g. user_xxx)
 * @param resourceId - optional companyId or experienceId to check access against
 * @returns { id, username, access_level, profile_picture }
 */
export async function getWhopUser(userId: string, resourceId?: string) {
	if (!userId) throw new Error("getWhopUser: userId is required");

	try {
	// Fetch the user record (SDK exposes `retrieve` for single resources)
	// Cast to `any` to tolerate varying SDK response shapes across versions.
	const user: any = await whopsdk.users.retrieve(userId);

		// Normalize common fields (SDK may return different shapes)
		const id = user?.id || user?.user_id || userId;
		const username = user?.username || user?.name || user?.email || null;
		const profile_picture =
			user?.picture ||
			user?.avatar ||
			user?.profile?.avatar ||
			user?.profile_picture ||
			null;

		// Optionally check access for a given resource
		let access_level = null;
		if (resourceId) {
			const access: any = await whopsdk.users.checkAccess(resourceId, { id: userId });
			access_level = access?.access_level || access?.level || access?.access || null;
		}

		return { id, username, access_level, profile_picture };
	} catch (err) {
		// Keep error visible for server logs; callers can handle as needed
		console.error("getWhopUser error:", err);
		throw err;
	}
}