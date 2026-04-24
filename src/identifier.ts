declare const brand: unique symbol

export type SafeIdentifier = string & { readonly [brand]: "SafeIdentifier" }

interface SafeIdentifierStatic {
  fromString(raw: string): SafeIdentifier
}

export const SafeIdentifier: SafeIdentifierStatic = {
  fromString(raw) {
    if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(raw)) {
      throw new Error(`Invalid SQL identifier: ${raw}`)
    }

    return raw as SafeIdentifier
  },
}
