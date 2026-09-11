import { phoneIssue } from "./phone";

export type AccountContact = { name: string; phone: string };

export type AccountUser = {
  firstName?: string | null;
  lastName?: string | null;
  fullName?: string | null;
  unsafeMetadata?: Record<string, unknown> | null;
  publicMetadata?: Record<string, unknown> | null;
  primaryPhoneNumber?: { phoneNumber?: string | null } | null;
  phoneNumbers?: Array<{ phoneNumber?: string | null }>;
};

function metaPhone(meta: Record<string, unknown> | null | undefined): string {
  const raw = meta?.whatsapp ?? meta?.phone;
  return typeof raw === "string" ? raw.trim() : "";
}

export function accountContact(user: AccountUser | null | undefined): AccountContact | null {
  if (!user) return null;
  const name =
    [user.firstName, user.lastName]
      .filter((part) => part?.trim())
      .join(" ")
      .trim() ||
    user.fullName?.trim() ||
    "";
  const phone =
    metaPhone(user.unsafeMetadata) ||
    metaPhone(user.publicMetadata) ||
    user.primaryPhoneNumber?.phoneNumber?.trim() ||
    user.phoneNumbers?.find((row) => row.phoneNumber?.trim())?.phoneNumber?.trim() ||
    "";
  if (!name && !phone) return null;
  return { name, phone };
}

export function accountReady(contact: AccountContact | null): contact is AccountContact {
  return Boolean(contact?.name.trim() && contact.phone && !phoneIssue(contact.phone));
}
