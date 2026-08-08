import { useCallback, useEffect, useState } from "react";

import {
  createPortalChannel,
  deletePortalChannel,
  fetchPortalChannels,
  importPortalChannelsMerge,
  setPortalChannelEnabled,
  updatePortalChannel,
  type PortalChannel,
  type PortalChannelWriteBody,
} from "./portalChannelApi";

export function usePortalChannels() {
  const [channels, setChannels] = useState<PortalChannel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const rows = await fetchPortalChannels();
      setChannels(rows);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load channels.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  const saveChannel = useCallback(
    async (body: PortalChannelWriteBody, existingId?: string) => {
      setSaving(true);
      setError(null);
      try {
        const saved = existingId
          ? await updatePortalChannel(existingId, body)
          : await createPortalChannel(body);
        setChannels((prev) => {
          const next = prev.filter((c) => c.id !== saved.id);
          return [...next, saved].sort((a, b) => a.name.localeCompare(b.name));
        });
        return saved;
      } finally {
        setSaving(false);
      }
    },
    [],
  );

  const toggleEnabled = useCallback(async (id: string, enabled: boolean) => {
    setSaving(true);
    try {
      const updated = await setPortalChannelEnabled(id, enabled);
      setChannels((prev) => prev.map((c) => (c.id === id ? updated : c)));
      return updated;
    } finally {
      setSaving(false);
    }
  }, []);

  const removeChannel = useCallback(async (id: string) => {
    setSaving(true);
    try {
      await deletePortalChannel(id);
      setChannels((prev) => prev.filter((c) => c.id !== id));
    } finally {
      setSaving(false);
    }
  }, []);

  const mergeImport = useCallback(async (entries: unknown[]) => {
    setSaving(true);
    setError(null);
    try {
      const result = await importPortalChannelsMerge(entries);
      setChannels(result.channels);
      return result;
    } finally {
      setSaving(false);
    }
  }, []);

  return {
    channels,
    loading,
    error,
    saving,
    reload,
    saveChannel,
    toggleEnabled,
    removeChannel,
    mergeImport,
    setError,
  };
}
