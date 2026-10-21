import { AppNotification, UserRole } from '../types';

const NOTIFICATIONS_STORAGE_KEY = 'infranex_notifications_v1';
const BROWSER_NOTIF_OPT_IN_KEY = 'infranex_browser_notifs_optin_v1';

/**
 * Initial demonstration notifications representing realistic historical events across roles.
 * These ensure each role has realistic initial telemetry to inspect immediately.
 */
export const INITIAL_DEMO_NOTIFICATIONS: AppNotification[] = [
  // Citizen Notifications
  {
    id: 'NOTIF-CIT-01',
    title: 'Contractor Crew Mobilized on Site',
    message: 'Apex Paving & Heavy Civils mobilized on-site for Crater Repair #INF-2026-9041 at Grand Arterial Parkway.',
    timestamp: new Date(Date.now() - 25 * 60 * 1000).toISOString(), // 25 mins ago
    relatedIncidentId: 'INF-2026-9041',
    targetRole: 'citizen',
    isRead: false,
    eventType: 'status_changed',
    priority: 'high',
  },
  {
    id: 'NOTIF-CIT-02',
    title: 'Repair Completed & Verified',
    message: 'Replacement high-intensity reflective stop sign installed for Case #INF-2026-9047 near Maplecrest Elementary.',
    timestamp: new Date(Date.now() - 4 * 3600 * 1000).toISOString(), // 4 hours ago
    relatedIncidentId: 'INF-2026-9047',
    targetRole: 'citizen',
    isRead: true,
    eventType: 'status_changed',
    priority: 'normal',
  },

  // Officer Notifications
  {
    id: 'NOTIF-OFF-01',
    title: 'Emergency Incident Pending Verification',
    message: 'Water Main Rupture #INF-2026-9042 reported in East River Waterfront. AI Severity: CRITICAL.',
    timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(), // 15 mins ago
    relatedIncidentId: 'INF-2026-9042',
    targetRole: 'officer',
    isRead: false,
    eventType: 'ai_escalation',
    priority: 'critical',
  },
  {
    id: 'NOTIF-OFF-02',
    title: 'Quality Audit Review Queued',
    message: 'Vanguard Structural Retrofits submitted composite carbon-fiber engineering design for Pier 7 (#INF-2026-9044).',
    timestamp: new Date(Date.now() - 2 * 3600 * 1000).toISOString(), // 2 hours ago
    relatedIncidentId: 'INF-2026-9044',
    targetRole: 'officer',
    isRead: false,
    eventType: 'evidence_submitted',
    priority: 'high',
  },

  // Contractor Notifications
  {
    id: 'NOTIF-CTR-01',
    title: 'New Emergency Work Order Assigned',
    message: 'Work order #INF-2026-9041 (Arterial Crater Excavation) assigned to Apex Paving. Mobilize crew within SLA.',
    timestamp: new Date(Date.now() - 50 * 60 * 1000).toISOString(), // 50 mins ago
    relatedIncidentId: 'INF-2026-9041',
    targetRole: 'contractor',
    isRead: false,
    eventType: 'contractor_assigned',
    priority: 'critical',
  },
  {
    id: 'NOTIF-CTR-02',
    title: 'Street Illumination Repair Dispatched',
    message: 'Lumen Municipal Electrical assigned Circuit-B9 photocell bank replacement (#INF-2026-9045).',
    timestamp: new Date(Date.now() - 5 * 3600 * 1000).toISOString(), // 5 hours ago
    relatedIncidentId: 'INF-2026-9045',
    targetRole: 'contractor',
    isRead: true,
    eventType: 'contractor_assigned',
    priority: 'normal',
  },

  // Admin Notifications
  {
    id: 'NOTIF-ADM-01',
    title: 'Critical Infrastructure Hazard Alert',
    message: 'Catastrophic hydraulic pressure drop detected in East River Sector (#INF-2026-9042). SLA: 4 Hours.',
    timestamp: new Date(Date.now() - 18 * 60 * 1000).toISOString(),
    relatedIncidentId: 'INF-2026-9042',
    targetRole: 'admin',
    isRead: false,
    eventType: 'ai_escalation',
    priority: 'critical',
  },
  {
    id: 'NOTIF-ADM-02',
    title: 'Sector Hotspot Rule Triggered',
    message: 'Ward 1 North Industrial Corridor exceeded 15 active road defects. Preventative repaving cycle recommended.',
    timestamp: new Date(Date.now() - 3 * 3600 * 1000).toISOString(),
    targetRole: 'admin',
    isRead: false,
    eventType: 'system',
    priority: 'normal',
  },
];

/**
 * Safe local storage loader with corruption protection and fallback.
 */
export const loadStoredNotifications = (): AppNotification[] => {
  try {
    const raw = localStorage.getItem(NOTIFICATIONS_STORAGE_KEY);
    if (!raw) {
      // First load: seed with initial demo notifications
      localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(INITIAL_DEMO_NOTIFICATIONS));
      return INITIAL_DEMO_NOTIFICATIONS;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
    return INITIAL_DEMO_NOTIFICATIONS;
  } catch (err) {
    console.warn('Malformed notifications in localStorage. Resetting to demo state:', err);
    try {
      localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(INITIAL_DEMO_NOTIFICATIONS));
    } catch {}
    return INITIAL_DEMO_NOTIFICATIONS;
  }
};

/**
 * Safe local storage persistence.
 */
export const saveStoredNotifications = (notifications: AppNotification[]): void => {
  try {
    localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(notifications));
  } catch (err) {
    console.error('Failed to persist notifications to localStorage:', err);
  }
};

/**
 * Filter notifications for a given role (matching role or broadcast 'all').
 */
export const getNotificationsForRole = (
  notifications: AppNotification[],
  role: UserRole
): AppNotification[] => {
  return notifications.filter((n) => n.targetRole === role || n.targetRole === 'all');
};

/**
 * Get unread count for a given role.
 */
export const getUnreadCountForRole = (
  notifications: AppNotification[],
  role: UserRole
): number => {
  return getNotificationsForRole(notifications, role).filter((n) => !n.isRead).length;
};

/**
 * Create a new notification object.
 */
export const buildNotification = (params: {
  title: string;
  message: string;
  targetRole: UserRole | 'all';
  eventType: AppNotification['eventType'];
  relatedIncidentId?: string;
  priority?: 'normal' | 'high' | 'critical';
}): AppNotification => {
  return {
    id: `NOTIF-${Date.now().toString(36).toUpperCase()}-${Math.floor(Math.random() * 900 + 100)}`,
    title: params.title,
    message: params.message,
    timestamp: new Date().toISOString(),
    relatedIncidentId: params.relatedIncidentId,
    targetRole: params.targetRole,
    isRead: false,
    eventType: params.eventType,
    priority: params.priority || 'normal',
  };
};

/**
 * Web Notification API Integration Helpers
 * Handles browser-level desktop notifications with strict explicit opt-in.
 */
export const isBrowserNotificationSupported = (): boolean => {
  return typeof window !== 'undefined' && 'Notification' in window;
};

export const getBrowserNotificationPermission = (): NotificationPermission | 'unsupported' => {
  if (!isBrowserNotificationSupported()) return 'unsupported';
  return Notification.permission;
};

export const isBrowserNotificationOptedIn = (): boolean => {
  if (!isBrowserNotificationSupported()) return false;
  return localStorage.getItem(BROWSER_NOTIF_OPT_IN_KEY) === 'true' && Notification.permission === 'granted';
};

export const setBrowserNotificationOptIn = (enabled: boolean): void => {
  try {
    localStorage.setItem(BROWSER_NOTIF_OPT_IN_KEY, enabled ? 'true' : 'false');
  } catch {}
};

export const requestBrowserNotificationPermission = async (): Promise<NotificationPermission | 'unsupported'> => {
  if (!isBrowserNotificationSupported()) return 'unsupported';

  try {
    const result = await Notification.requestPermission();
    if (result === 'granted') {
      setBrowserNotificationOptIn(true);
    } else {
      setBrowserNotificationOptIn(false);
    }
    return result;
  } catch (err) {
    console.warn('Error requesting Notification API permission:', err);
    return Notification.permission;
  }
};

/**
 * Dispatch a standard HTML5 desktop notification if explicitly permitted.
 */
export const dispatchBrowserNotification = (notification: AppNotification): void => {
  if (!isBrowserNotificationSupported()) return;
  if (Notification.permission !== 'granted') return;
  if (!isBrowserNotificationOptedIn()) return;

  try {
    new Notification(`INFRANEX AI: ${notification.title}`, {
      body: notification.message,
      icon: '/favicon.ico',
      tag: notification.id,
    });
  } catch (err) {
    console.debug('Browser notification display prevented by browser context:', err);
  }
};

/**
 * Future Backend Architecture Contract
 * When the Python FastAPI backend is integrated with PostgreSQL + PostGIS,
 * this client service will subscribe to SSE/WebSockets at `/api/v1/notifications/stream`
 * or fetch from `/api/v1/notifications`.
 */
export interface FutureNotificationBackendContract {
  fetchNotifications(token: string): Promise<AppNotification[]>;
  markAsRead(token: string, notificationId: string): Promise<void>;
  markAllAsRead(token: string): Promise<void>;
  subscribeStream(token: string, onEvent: (notif: AppNotification) => void): () => void;
}
