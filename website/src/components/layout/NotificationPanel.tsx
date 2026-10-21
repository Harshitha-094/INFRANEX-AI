import React, { useEffect, useRef, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { AppNotification } from '../../types';
import {
  isBrowserNotificationSupported,
  getBrowserNotificationPermission,
  isBrowserNotificationOptedIn,
  requestBrowserNotificationPermission,
  setBrowserNotificationOptIn,
} from '../../services/notificationService';
import {
  Bell,
  CheckCheck,
  Check,
  X,
  AlertTriangle,
  HardHat,
  CheckCircle2,
  XCircle,
  FilePlus,
  Sparkles,
  ExternalLink,
  BellOff,
  Monitor,
  Info,
} from 'lucide-react';

interface NotificationPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NotificationPanel: React.FC<NotificationPanelProps> = ({ isOpen, onClose }) => {
  const {
    roleNotifications,
    unreadNotificationCount,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    role,
    incidents,
    setSelectedIncident,
    setActiveTab,
  } = useApp();

  const panelRef = useRef<HTMLDivElement>(null);
  const [browserPermission, setBrowserPermission] = useState<NotificationPermission | 'unsupported'>(
    getBrowserNotificationPermission()
  );
  const [isOptedIn, setIsOptedIn] = useState<boolean>(isBrowserNotificationOptedIn());
  const [showBrowserInfo, setShowBrowserInfo] = useState<boolean>(false);

  // Close panel on outside click or Escape key
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleEnableBrowserNotifications = async () => {
    const perm = await requestBrowserNotificationPermission();
    setBrowserPermission(perm);
    setIsOptedIn(isBrowserNotificationOptedIn());
  };

  const handleToggleOptIn = () => {
    const next = !isOptedIn;
    setBrowserNotificationOptIn(next);
    setIsOptedIn(next);
  };

  const handleNotificationClick = (notif: AppNotification) => {
    markNotificationAsRead(notif.id);
    if (notif.relatedIncidentId) {
      const target = incidents.find((i) => i.id === notif.relatedIncidentId);
      if (target) {
        setSelectedIncident(target);
        setActiveTab('cases');
        onClose();
      }
    }
  };

  const renderEventIcon = (type: AppNotification['eventType'], priority?: string) => {
    switch (type) {
      case 'report_submitted':
        return <FilePlus className="w-4 h-4 text-cyan-400" />;
      case 'status_changed':
        return <CheckCircle2 className="w-4 h-4 text-emerald-400" />;
      case 'contractor_assigned':
        return <HardHat className="w-4 h-4 text-amber-400" />;
      case 'report_rejected':
        return <XCircle className="w-4 h-4 text-rose-400" />;
      case 'evidence_submitted':
        return <CheckCheck className="w-4 h-4 text-cyan-400" />;
      case 'ai_escalation':
        return <AlertTriangle className="w-4 h-4 text-rose-400" />;
      case 'system':
      default:
        return <Sparkles className="w-4 h-4 text-purple-400" />;
    }
  };

  const formatTimeAgo = (isoString: string) => {
    try {
      const diffMs = Date.now() - new Date(isoString).getTime();
      const mins = Math.floor(diffMs / 60000);
      if (mins < 1) return 'Just now';
      if (mins < 60) return `${mins}m ago`;
      const hours = Math.floor(mins / 60);
      if (hours < 24) return `${hours}h ago`;
      const days = Math.floor(hours / 24);
      return `${days}d ago`;
    } catch {
      return 'Recently';
    }
  };

  return (
    <div
      ref={panelRef}
      className="absolute right-0 top-14 w-full sm:w-[420px] max-w-[calc(100vw-1.5rem)] bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl z-[100] overflow-hidden flex flex-col max-h-[85vh] animate-in fade-in duration-200"
    >
      {/* Panel Header */}
      <div className="p-4 border-b border-slate-800 bg-slate-950/70 flex items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-cyan-950/80 text-cyan-400 border border-cyan-800/80 flex items-center justify-center">
            <Bell className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-white">Notifications</h3>
              {unreadNotificationCount > 0 ? (
                <span className="px-2 py-0.2 rounded-full text-[10px] font-bold bg-rose-500 text-white font-mono">
                  {unreadNotificationCount} unread
                </span>
              ) : (
                <span className="px-2 py-0.2 rounded-full text-[10px] font-medium bg-slate-800 text-slate-400">
                  All caught up
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-400">
              Role: <strong className="text-cyan-400 uppercase">{role}</strong> channel
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {unreadNotificationCount > 0 && (
            <button
              onClick={markAllNotificationsAsRead}
              className="text-[11px] text-cyan-400 hover:text-cyan-300 font-semibold flex items-center gap-1 hover:underline transition-all"
              title="Mark all notifications as read for active role"
            >
              <CheckCheck className="w-3.5 h-3.5" />
              Mark all read
            </button>
          )}
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Browser Notification Opt-In Card */}
      {isBrowserNotificationSupported() && (
        <div className="px-4 py-2.5 bg-slate-950/40 border-b border-slate-800/80 text-[11px] text-slate-300 flex items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-2">
            <Monitor className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
            <span>Desktop Alerts:</span>
            {browserPermission === 'granted' ? (
              <span className="text-emerald-400 font-semibold flex items-center gap-1">
                <Check className="w-3 h-3" /> Enabled
              </span>
            ) : browserPermission === 'denied' ? (
              <span className="text-rose-400 font-semibold">Blocked in Browser</span>
            ) : (
              <span className="text-slate-400">Not enabled</span>
            )}
          </div>

          <div className="flex items-center gap-1.5">
            {browserPermission !== 'granted' && browserPermission !== 'denied' && (
              <button
                onClick={handleEnableBrowserNotifications}
                className="px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800 hover:bg-cyan-900 text-[10px] font-semibold transition-all"
              >
                Enable Alerts
              </button>
            )}

            <button
              onClick={() => setShowBrowserInfo(!showBrowserInfo)}
              className="p-1 text-slate-400 hover:text-slate-200"
              title="Browser Notification details"
            >
              <Info className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Info popover explaining local Web Notification vs future backend push */}
      {showBrowserInfo && (
        <div className="p-3 bg-slate-950 border-b border-slate-800 text-[10px] text-slate-400 space-y-1.5 shrink-0">
          <p className="font-semibold text-slate-300">About INFRANEX Desktop Alerts:</p>
          <p>
            Uses the standard HTML5 Web Notification API for active tab events. Real-time background push across mobile/closed tabs is architected for integration with the future Python FastAPI + PostgreSQL backend.
          </p>
        </div>
      )}

      {/* Notification List */}
      <div className="overflow-y-auto divide-y divide-slate-800/60 flex-1">
        {roleNotifications.length === 0 ? (
          <div className="p-8 text-center space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-slate-850 text-slate-500 mx-auto flex items-center justify-center">
              <BellOff className="w-6 h-6" />
            </div>
            <h4 className="text-xs font-bold text-slate-200">No Notifications for {role.toUpperCase()}</h4>
            <p className="text-[11px] text-slate-400 max-w-xs mx-auto">
              Real incident submissions, status transitions, and contractor work orders will populate this feed automatically.
            </p>
          </div>
        ) : (
          roleNotifications.map((notif) => {
            const isUnread = !notif.isRead;
            return (
              <div
                key={notif.id}
                onClick={() => handleNotificationClick(notif)}
                className={`p-3.5 cursor-pointer transition-all hover:bg-slate-800/50 flex items-start gap-3 relative group ${
                  isUnread
                    ? 'bg-slate-850/60 border-l-2 border-l-cyan-400'
                    : 'opacity-85 hover:opacity-100'
                }`}
              >
                {/* Event Icon */}
                <div
                  className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border mt-0.5 ${
                    notif.priority === 'critical'
                      ? 'bg-rose-950/80 border-rose-800 text-rose-300 animate-pulse'
                      : notif.priority === 'high'
                      ? 'bg-amber-950/80 border-amber-800 text-amber-300'
                      : 'bg-slate-800/80 border-slate-700 text-slate-300'
                  }`}
                >
                  {renderEventIcon(notif.eventType, notif.priority)}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center justify-between gap-1">
                    <span
                      className={`text-xs leading-snug line-clamp-1 ${
                        isUnread ? 'font-bold text-white' : 'font-medium text-slate-300'
                      }`}
                    >
                      {notif.title}
                    </span>
                    <span className="text-[10px] font-mono text-slate-500 shrink-0">
                      {formatTimeAgo(notif.timestamp)}
                    </span>
                  </div>

                  <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                    {notif.message}
                  </p>

                  <div className="flex items-center justify-between pt-1 text-[10px]">
                    {notif.relatedIncidentId ? (
                      <span className="font-mono font-semibold text-cyan-400 flex items-center gap-1 hover:underline">
                        <span>{notif.relatedIncidentId}</span>
                        <ExternalLink className="w-2.5 h-2.5" />
                      </span>
                    ) : (
                      <span className="text-slate-500 font-mono">System Announcement</span>
                    )}

                    {isUnread ? (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          markNotificationAsRead(notif.id);
                        }}
                        className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-cyan-300 text-[10px] font-semibold flex items-center gap-1 transition-all"
                        title="Mark as read"
                      >
                        <Check className="w-2.5 h-2.5" />
                        Mark read
                      </button>
                    ) : (
                      <span className="text-slate-600 font-mono">Read</span>
                    )}
                  </div>
                </div>

                {/* Unread Accent Dot */}
                {isUnread && (
                  <span className="w-2 h-2 rounded-full bg-cyan-400 shadow-sm shadow-cyan-400/50 absolute top-3 right-3"></span>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Footer */}
      <div className="p-3 border-t border-slate-800 bg-slate-950/70 text-[10px] text-slate-500 flex items-center justify-between shrink-0">
        <span>Persistent across browser reloads</span>
        <span>INFRANEX Core v1.0</span>
      </div>
    </div>
  );
};
