import React from "react";
import {
  fetchPortalBusiness,
  fetchPortalDevices,
  fetchPortalInvoices,
  fetchPortalLicenses,
  type PortalBusinessProfile,
  type PortalCustomer,
  type PortalDevice,
  type PortalInvoice,
  type PortalLicense,
} from "../portalApi";
import type { PosHubData } from "./types";

export type UsePortalPosHubDataResult = PosHubData & {
  reload: () => void;
};

const initialData = (
  customer: PortalCustomer,
): Omit<PosHubData, "loading" | "error" | "lastSyncedAt"> => ({
  licenses: [],
  devices: [],
  invoices: [],
  business: null,
  customer,
});

export function usePortalPosHubData(
  customer: PortalCustomer,
): UsePortalPosHubDataResult {
  const [state, setState] = React.useState<PosHubData>(() => ({
    ...initialData(customer),
    loading: true,
    error: false,
    lastSyncedAt: null,
  }));
  const [tick, setTick] = React.useState(0);

  const reload = React.useCallback(() => {
    setTick((n) => n + 1);
  }, []);

  React.useEffect(() => {
    let cancelled = false;

    (async () => {
      setState((prev) => ({ ...prev, loading: true, error: false }));
      let hadError = false;

      try {
        const [licenses, devices, invoices, business] = await Promise.all([
          fetchPortalLicenses().catch(() => {
            hadError = true;
            return [] as PortalLicense[];
          }),
          fetchPortalDevices().catch(() => {
            hadError = true;
            return [] as PortalDevice[];
          }),
          fetchPortalInvoices().catch(() => [] as PortalInvoice[]),
          fetchPortalBusiness().catch(() => {
            hadError = true;
            return null as PortalBusinessProfile | null;
          }),
        ]);

        if (cancelled) return;

        setState({
          licenses,
          devices,
          invoices,
          business,
          customer,
          loading: false,
          error: hadError,
          lastSyncedAt: new Date(),
        });
      } catch {
        if (!cancelled) {
          setState((prev) => ({
            ...prev,
            loading: false,
            error: true,
            lastSyncedAt: new Date(),
          }));
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [customer, tick]);

  return { ...state, reload };
}
