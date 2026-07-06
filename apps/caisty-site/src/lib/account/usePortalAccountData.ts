import React from "react";
import type { PortalCustomer } from "../portalApi";

export function usePortalAccountData(customer: PortalCustomer) {
  const [current, setCurrent] = React.useState(customer);

  React.useEffect(() => {
    setCurrent(customer);
  }, [customer]);

  return { customer: current, setCustomer: setCurrent };
}
