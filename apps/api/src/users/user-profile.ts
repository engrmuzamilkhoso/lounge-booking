/** The user fields returned by the API. Never includes password or OTP data. */
export interface UserProfile {
  id: number;
  firstName: string | null;
  lastName: string | null;
  email: string;
  cnic: string | null;
  contact: string | null;
  roles: { id: number; title: string | null }[];
}

export const userProfileSelect = {
  id: true,
  firstName: true,
  lastName: true,
  email: true,
  cnic: true,
  contact: true,
  roles: {
    where: { role: { deletedAt: null } },
    select: { role: { select: { id: true, title: true } } },
  },
} as const;

interface UserProfileRecord {
  id: number;
  firstName: string | null;
  lastName: string | null;
  email: string;
  cnic: string | null;
  contact: string | null;
  roles: { role: { id: number; title: string | null } }[];
}

export function toUserProfile(user: UserProfileRecord): UserProfile {
  return {
    id: user.id,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    cnic: user.cnic,
    contact: user.contact,
    roles: user.roles.map((roleUser) => roleUser.role),
  };
}
