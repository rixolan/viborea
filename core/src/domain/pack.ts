export type OfferingKind = "individual" | "group";
export type PackSize = 5 | 10;

export class PackError extends Error {}

export interface ClassPack {
  id: string;
  studentId: string;
  offeringKind: OfferingKind;
  size: PackSize;
  remaining: number;
  purchasedAt: Date;
  expiresAt: Date;
}

export interface PackAlert {
  type: "pack_consumed";
  studentId: string;
  packId: string;
  remaining: number;
  total: number;
  offeringKind: OfferingKind;
  buyAgain: boolean;
  message: string;
}

const EXPIRY_DAYS: Record<PackSize, number> = { 5: 45, 10: 60 };

export function offeringKindFromCapacity(capacity: number): OfferingKind {
  return capacity === 1 ? "individual" : "group";
}

export function expiryFor(size: PackSize, purchasedAt: Date): Date {
  return new Date(purchasedAt.getTime() + EXPIRY_DAYS[size] * 86_400_000);
}

export function purchasePack(input: {
  id: string;
  studentId: string;
  offeringKind: OfferingKind;
  size: PackSize;
  purchasedAt: Date;
}): ClassPack {
  return {
    id: input.id,
    studentId: input.studentId,
    offeringKind: input.offeringKind,
    size: input.size,
    remaining: input.size,
    purchasedAt: input.purchasedAt,
    expiresAt: expiryFor(input.size, input.purchasedAt),
  };
}

export function canConsume(pack: ClassPack, at: Date, kind: OfferingKind): true {
  if (pack.offeringKind !== kind) {
    throw new PackError("Ese paquete no cubre este tipo de clase");
  }
  if (at.getTime() > pack.expiresAt.getTime()) {
    throw new PackError("El paquete venció");
  }
  if (pack.remaining <= 0) {
    throw new PackError("El paquete no tiene clases");
  }
  return true;
}

export function consumeOnConfirm(
  pack: ClassPack,
  at: Date,
  kind: OfferingKind,
): { pack: ClassPack; alert: PackAlert } {
  canConsume(pack, at, kind);
  const remaining = pack.remaining - 1;
  const next: ClassPack = { ...pack, remaining };
  return { pack: next, alert: consumedAlert(next) };
}

export function restoreOnCancel(pack: ClassPack): ClassPack {
  return { ...pack, remaining: Math.min(pack.size, pack.remaining + 1) };
}

export function consumedAlert(pack: ClassPack): PackAlert {
  const buyAgain = pack.remaining === 0;
  const used = `${pack.size - pack.remaining} de ${pack.size}`;
  const message = buyAgain
    ? `Usaste la última clase del paquete de ${pack.size}. Comprá otro para seguir reservando.`
    : `Usaste 1 clase del paquete de ${pack.size} (${used}). Te quedan ${pack.remaining}.`;
  return {
    type: "pack_consumed",
    studentId: pack.studentId,
    packId: pack.id,
    remaining: pack.remaining,
    total: pack.size,
    offeringKind: pack.offeringKind,
    buyAgain,
    message,
  };
}
