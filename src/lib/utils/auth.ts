/**
 * Basic user data from middleware
 */
interface MiddlewareUser {
  id: string;
  email: string;
}

/**
 * Extracts authenticated user ID from Astro locals
 * @param locals - Astro locals object containing user data from middleware
 * @returns User ID string
 * @throws Error if user is not authenticated
 */
export function getAuthenticatedUserId(locals: { user?: MiddlewareUser }): string {
  if (!locals.user?.id) {
    throw new Error("User not authenticated");
  }

  return locals.user.id;
}

/**
 * Safely extracts authenticated user from Astro locals
 * @param locals - Astro locals object containing user data from middleware
 * @returns User object
 * @throws Error if user is not authenticated
 */
export function getAuthenticatedUser(locals: { user?: MiddlewareUser }): MiddlewareUser {
  if (!locals.user) {
    throw new Error("User not authenticated");
  }

  return locals.user;
}
