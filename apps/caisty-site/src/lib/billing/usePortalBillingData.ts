import React from "react";
import {
  fetchPortalBusiness,
  fetchPortalInvoices,
  fetchPortalLicenses,
  fetchPortalMe,
  type PortalBusinessProfile,
  type PortalCustomer,
  type PortalInvoice,
  type PortalLicense,
} from "../portalApi";

export function usePortalBillingData(
  outletCustomer: PortalCustomer,
  setCustomer: React.Dispatch<React.SetStateAction<PortalCustomer | null>>,
) {
  const [licenses, setLicenses] = React.useState<PortalLicense[]>([]);
  const [invoices, setInvoices] = React.useState<PortalInvoice[]>([]);
  const [business, setBusiness] = React.useState<PortalBusinessProfile | null>(null);
  const [licensesLoading, setLicensesLoading] = React.useState(true);
  const [invoicesLoading, setInvoicesLoading] = React.useState(true);
  const [businessLoading, setBusinessLoading] = React.useState(true);
  const [licensesError, setLicensesError] = React.useState<string | null>(null);
  const [invoicesError, setInvoicesError] = React.useState<string | null>(null);
  const [tick, setTick] = React.useState(0);

  const reload = React.useCallback(() => {
    setTick((n) => n + 1);
  }, []);

  React.useEffect(() => {
    let cancelled = false;
    fetchPortalMe()
      .then((me) => {
        if (!cancelled && me) setCustomer(me);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [setCustomer, tick]);

  React.useEffect(() => {
    let cancelled = false;

    (async () => {
      setLicensesLoading(true);
      setLicensesError(null);
      try {
        const lics = await fetchPortalLicenses();
        if (!cancelled) setLicenses(lics);
      } catch (err: unknown) {
        if (!cancelled) {
          setLicensesError(err instanceof Error ? err.message : "load_failed");
        }
      } finally {
        if (!cancelled) setLicensesLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [tick]);

  React.useEffect(() => {
    let cancelled = false;

    (async () => {
      setInvoicesLoading(true);
      setInvoicesError(null);
      try {
        const data = await fetchPortalInvoices();
        if (!cancelled) setInvoices(data ?? []);
      } catch (err: unknown) {
        if (!cancelled) {
          setInvoicesError(err instanceof Error ? err.message : "load_failed");
        }
      } finally {
        if (!cancelled) setInvoicesLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [tick]);

  React.useEffect(() => {
    let cancelled = false;

    (async () => {
      setBusinessLoading(true);
      try {
        const profile = await fetchPortalBusiness();
        if (!cancelled) setBusiness(profile);
      } catch {
        if (!cancelled) setBusiness(null);
      } finally {
        if (!cancelled) setBusinessLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [tick]);

  return {
    customer: outletCustomer,
    licenses,
    setLicenses,
    invoices,
    business,
    licensesLoading,
    invoicesLoading,
    businessLoading,
    licensesError,
    invoicesError,
    reload,
  };
}
