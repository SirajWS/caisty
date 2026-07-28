export const CLOUD_BASE_URL =
  import.meta.env.VITE_CLOUD_API_URL || "https://api.caisty.com";

export const DEVICE_STORAGE_KEY = "caisty.pos.device.v1";

export type StoredDevice = {
  deviceId: string;
  licenseKey: string;
  orgId?: string | null;
};

export function loadStoredDevice(): StoredDevice | null {
  try {
    const raw = localStorage.getItem(DEVICE_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredDevice;
    if (!parsed.deviceId || !parsed.licenseKey) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function saveStoredDevice(device: StoredDevice) {
  localStorage.setItem(DEVICE_STORAGE_KEY, JSON.stringify(device));
}
