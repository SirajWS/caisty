import React from "react";
import {
  fetchPortalBusiness,
  fetchPortalDevices,
  fetchPortalLicenses,
  fetchPortalSupportMessages,
  type PortalBusinessProfile,
  type PortalCustomer,
  type PortalDevice,
  type PortalLicense,
  type PortalSupportMessage,
} from "../portalApi";
import { sortSupportMessages } from "./deriveSupportState";

export function usePortalSupportData(customer: PortalCustomer) {
  const [messages, setMessages] = React.useState<PortalSupportMessage[]>([]);
  const [licenses, setLicenses] = React.useState<PortalLicense[]>([]);
  const [devices, setDevices] = React.useState<PortalDevice[]>([]);
  const [business, setBusiness] = React.useState<PortalBusinessProfile | null>(null);
  const [messagesLoading, setMessagesLoading] = React.useState(true);
  const [licensesLoading, setLicensesLoading] = React.useState(true);
  const [devicesLoading, setDevicesLoading] = React.useState(true);
  const [businessLoading, setBusinessLoading] = React.useState(true);
  const [messagesError, setMessagesError] = React.useState(false);
  const [tick, setTick] = React.useState(0);

  const reloadMessages = React.useCallback(() => {
    setTick((n) => n + 1);
  }, []);

  React.useEffect(() => {
    let cancelled = false;

    (async () => {
      setMessagesLoading(true);
      setMessagesError(false);
      try {
        const items = await fetchPortalSupportMessages();
        if (!cancelled) setMessages(sortSupportMessages(items));
      } catch {
        if (!cancelled) {
          setMessagesError(true);
          setMessages([]);
        }
      } finally {
        if (!cancelled) setMessagesLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [tick]);

  React.useEffect(() => {
    let cancelled = false;

    (async () => {
      setLicensesLoading(true);
      try {
        const lics = await fetchPortalLicenses();
        if (!cancelled) setLicenses(lics);
      } catch {
        if (!cancelled) setLicenses([]);
      } finally {
        if (!cancelled) setLicensesLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  React.useEffect(() => {
    let cancelled = false;

    (async () => {
      setDevicesLoading(true);
      try {
        const devs = await fetchPortalDevices();
        if (!cancelled) setDevices(devs);
      } catch {
        if (!cancelled) setDevices([]);
      } finally {
        if (!cancelled) setDevicesLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

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
  }, []);

  return {
    customer,
    messages,
    setMessages,
    licenses,
    devices,
    business,
    messagesLoading,
    licensesLoading,
    devicesLoading,
    businessLoading,
    messagesError,
    reloadMessages,
  };
}
