import type { FiscalProviderKey } from "../types.js";
import type { FiscalProvider } from "./FiscalProvider.js";
import { NoneFiscalProvider } from "./NoneFiscalProvider.js";
import { FiskalyFiscalProvider } from "./FiskalyFiscalProvider.js";

const noneProvider = new NoneFiscalProvider();
const fiskalyProvider = new FiskalyFiscalProvider();

export function getFiscalProvider(key: FiscalProviderKey): FiscalProvider {
  switch (key) {
    case "fiskaly":
      return fiskalyProvider;
    case "none":
    default:
      return noneProvider;
  }
}
