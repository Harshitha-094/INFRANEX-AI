import {
  Incident,
  DumpingEvent,
  Hotspot,
  InfrastructureAsset,
  ThresholdConfig,
  ContractorWorkOrder,
  RepairValidationRecord,
  CitizenConfirmation,
  AuditLogEntry,
  DuplicateMatchCandidate
} from '../types';

const API_BASE_URL = (import.meta as any).env?.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';

export class ApiClient {
  private static token: string | null = null;
  private static isConnected: boolean | null = null;

  static setToken(token: string | null) {
    this.token = token;
    if (token) {
      localStorage.setItem('infranex_jwt_token', token);
    } else {
      localStorage.removeItem('infranex_jwt_token');
    }
  }

  static getToken(): string | null {
    if (!this.token) {
      this.token = localStorage.getItem('infranex_jwt_token');
    }
    return this.token;
  }

  static async checkHealth(): Promise<boolean> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000);
      const res = await fetch(`${API_BASE_URL}/health`, {
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      this.isConnected = res.ok;
      return res.ok;
    } catch {
      this.isConnected = false;
      return false;
    }
  }

  static getIsConnected(): boolean {
    return this.isConnected ?? false;
  }

  private static async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string> || {})
    };

    const token = this.getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorMsg = `HTTP ${response.status}: ${response.statusText}`;
      try {
        const errorJson = JSON.parse(errorText);
        if (errorJson.detail) errorMsg = errorJson.detail;
      } catch {
        // use raw text if available
        if (errorText) errorMsg = errorText;
      }
      throw new Error(errorMsg);
    }

    return response.json();
  }

  // Auth
  static async login(username: string, password: string) {
    const data = await this.request<{ access_token: string; user: any }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password })
    });
    this.setToken(data.access_token);
    return data;
  }

  static async getMe() {
    return this.request<any>('/auth/me');
  }

  // Incidents
  static async getIncidents(): Promise<Incident[]> {
    return this.request<Incident[]>('/incidents');
  }

  static async createIncident(payload: any): Promise<Incident> {
    return this.request<Incident>('/incidents', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  }

  static async validateEvidence(imageUrl: string, category: string, isDemonstration?: boolean): Promise<{
    validationStatus: 'VALIDATION_PASSED' | 'REJECTED_IRRELEVANT' | 'NEEDS_RETAKE' | 'PENDING_HUMAN_REVIEW' | 'VALIDATION_FAILED';
    errorCode?: string | null;
    message: string;
    isRelevant: boolean;
    confidence: number;
    modelIdentity: string;
    category: string;
    detectedContent: string;
    requiresHumanReview: boolean;
    qualityScore: number;
    details: Record<string, any>;
  }> {
    return this.request<any>('/incidents/validate-evidence', {
      method: 'POST',
      body: JSON.stringify({
        imageUrl,
        category,
        isDemonstration: !!isDemonstration
      })
    });
  }

  static async updateIncidentStatus(id: string, status: string, notes?: string): Promise<Incident> {
    return this.request<Incident>(`/incidents/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, notes })
    });
  }

  static async getDuplicateCandidates(id: string): Promise<DuplicateMatchCandidate[]> {
    return this.request<DuplicateMatchCandidate[]>(`/incidents/${id}/duplicate-candidates`);
  }

  static async consolidateIncidents(primaryId: string, duplicateIds: string[], reason: string) {
    return this.request<any>(`/incidents/${primaryId}/consolidate`, {
      method: 'POST',
      body: JSON.stringify({ primaryIncidentId: primaryId, duplicateIncidentIds: duplicateIds, reason })
    });
  }

  // Dumping Events
  static async getDumpingEvents(): Promise<DumpingEvent[]> {
    return this.request<DumpingEvent[]>('/dumping-events');
  }

  static async decideDumpingEvent(id: string, decision: 'confirm' | 'reject', notes?: string) {
    return this.request<any>(`/dumping-events/${id}/decide`, {
      method: 'POST',
      body: JSON.stringify({ decision, notes })
    });
  }

  // Hotspots
  static async getHotspots(): Promise<Hotspot[]> {
    return this.request<Hotspot[]>('/hotspots');
  }

  static async getHotspotDetail(id: string) {
    return this.request<any>(`/hotspots/${id}`);
  }

  // Infrastructure Assets
  static async getInfrastructureAssets(): Promise<InfrastructureAsset[]> {
    return this.request<InfrastructureAsset[]>('/infrastructure');
  }

  // Thresholds
  static async getThresholds(): Promise<ThresholdConfig[]> {
    return this.request<ThresholdConfig[]>('/thresholds');
  }

  static async updateThreshold(key: string, value: number): Promise<ThresholdConfig> {
    return this.request<ThresholdConfig>(`/thresholds/${key}`, {
      method: 'PUT',
      body: JSON.stringify({ value })
    });
  }

  // Work Orders & Repairs
  static async getWorkOrders(): Promise<ContractorWorkOrder[]> {
    return this.request<ContractorWorkOrder[]>('/work-orders');
  }

  static async dispatchWorkOrder(payload: any): Promise<ContractorWorkOrder> {
    return this.request<ContractorWorkOrder>('/work-orders/dispatch', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  }

  static async submitRepair(workOrderId: string, payload: any): Promise<ContractorWorkOrder> {
    return this.request<ContractorWorkOrder>(`/work-orders/${workOrderId}/submit-repair`, {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  }

  static async validateRepair(workOrderId: string, payload: any): Promise<RepairValidationRecord> {
    return this.request<RepairValidationRecord>(`/work-orders/${workOrderId}/validate-repair`, {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  }

  static async citizenConfirmRepair(incidentId: string, payload: any): Promise<CitizenConfirmation> {
    return this.request<CitizenConfirmation>(`/work-orders/incident/${incidentId}/citizen-confirm`, {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  }

  // Audit Logs
  static async getAuditLogs(): Promise<AuditLogEntry[]> {
    return this.request<AuditLogEntry[]>('/audit');
  }

  // Integrations Status
  static async getIntegrationStatus() {
    return this.request<any>('/integrations/status');
  }
}
