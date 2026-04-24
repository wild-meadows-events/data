declare const brand: unique symbol

export type SafeIdentifier = string & { readonly [brand]: "SafeIdentifier" }

export const SafeIdentifier: { fromString(raw: string): SafeIdentifier } = {
  fromString(raw: string): SafeIdentifier {
    if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(raw)) {
      throw new Error(`Invalid SQL identifier: ${raw}`)
    }

    return raw as SafeIdentifier
  },
}
