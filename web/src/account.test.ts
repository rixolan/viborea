import { describe, expect, it } from "bun:test";
import { accountContact, accountReady } from "./account";

describe("accountContact", () => {
  it("arma nombre y teléfono de Clerk", () => {
    expect(
      accountContact({
        firstName: "Ana",
        lastName: "Pérez",
        primaryPhoneNumber: { phoneNumber: "+595981123456" },
      }),
    ).toEqual({ name: "Ana Pérez", phone: "+595981123456" });
  });

  it("cae al fullName y al WhatsApp en metadata", () => {
    expect(
      accountContact({
        fullName: "Ana Pérez",
        unsafeMetadata: { whatsapp: "+595981123456" },
      }),
    ).toEqual({ name: "Ana Pérez", phone: "+595981123456" });
  });

  it("cae al primer teléfono de Clerk si no hay metadata", () => {
    expect(
      accountContact({
        fullName: "Ana Pérez",
        phoneNumbers: [{ phoneNumber: "+15551234567" }],
      }),
    ).toEqual({ name: "Ana Pérez", phone: "+15551234567" });
  });

  it("null si no hay datos", () => {
    expect(accountContact({})).toBeNull();
    expect(accountContact(null)).toBeNull();
  });
});

describe("accountReady", () => {
  it("pide nombre y WhatsApp válido", () => {
    expect(accountReady({ name: "Ana Pérez", phone: "+595981123456" })).toBe(true);
    expect(accountReady({ name: "Ana", phone: "" })).toBe(false);
    expect(accountReady({ name: "", phone: "+595981123456" })).toBe(false);
    expect(accountReady({ name: "Ana", phone: "0981123456" })).toBe(false);
    expect(accountReady(null)).toBe(false);
  });
});
