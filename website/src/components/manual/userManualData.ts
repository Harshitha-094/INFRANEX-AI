export interface ManualStep {
  stepNumber: number;
  title: string;
  description: string;
  actionHint?: string;
  warning?: string;
  tip?: string;
}

export interface ManualSubSection {
  id: string;
  title: string;
  summary: string;
  steps?: ManualStep[];
  content?: string[];
  tips?: string[];
  warnings?: string[];
  relatedTab?: string;
  relatedTabLabel?: string;
}

export interface ManualSection {
  id: string;
  number: string;
  title: string;
  shortTitle: string;
  iconName: string;
  badge: string;
  description: string;
  relatedTab?: string;
  relatedTabLabel?: string;
  subSections: ManualSubSection[];
}

export interface GlossaryTerm {
  term: string;
  category: 'System' | 'Workflow' | 'Role' | 'Metric';
  definition: string;
  example?: string;
}

export interface TroubleshootingTopic {
  id: string;
  issue: string;
  symptom: string;
  causes: string[];
  resolutionSteps: string[];
  preventionTip?: string;
}

export const MANUAL_SECTIONS: ManualSection[] = [
  {
    id: 'getting-started',
    number: '01',
    title: 'Getting Started with INFRANEX AI',
    shortTitle: 'Getting Started',
    iconName: 'Compass',
    badge: 'Basics',
    description:
      'Learn how to launch the platform, navigate the interface, interpret operational readiness indicators, and switch between role workspaces.',
    relatedTab: 'dashboard',
    relatedTabLabel: 'Open Overview Dashboard',
    subSections: [
      {
        id: 'launch-and-intro',
        title: 'Platform Startup & Cinematic Introduction',
        summary: 'Understanding the initial startup sequence and how to enter the core workspaces.',
        steps: [
          {
            stepNumber: 1,
            title: 'Initial Application Load',
            description:
              'When opening the application URL (http://127.0.0.1:3001/), INFRANEX AI starts with an animated cinematic logo introduction representing the digital infrastructure of Bengaluru.',
            tip: 'The intro draws elevated highways, rises futuristic buildings, drops telemetry map pins, and reveals the Kannada tagline ಜನಸ್ಪಂದನ.',
          },
          {
            stepNumber: 2,
            title: 'Skipping or Completing the Intro',
            description:
              'The intro runs for approximately 4.8 seconds before transitioning seamlessly into the Cinematic Hero opening. You can skip directly at any moment by clicking "Skip intro" in the top-right corner or pressing the ESC, Space, or Enter key.',
            actionHint: 'Click "Skip intro" or press ESC to bypass the animation immediately.',
          },
          {
            stepNumber: 3,
            title: 'Entering the Operational Workspaces',
            description:
              'From the Cinematic Hero opening page, click "Open Dashboard" or "Explore the Platform" to transition into the main operations control center. Switching operational tabs thereafter never replays the intro.',
          },
        ],
      },
      {
        id: 'main-navigation',
        title: 'Application Shell & Navigation Architecture',
        summary: 'Explore the global header, sidebar workspaces, and operational footer.',
        steps: [
          {
            stepNumber: 1,
            title: 'Top Navbar Controls',
            description:
              'Contains the official INFRANEX AI brand emblem, global case/address search bar, quick "Report Issue" shortcut (citizen role), role switcher pills (Citizen, Field Officer, Contractor, Admin), backend API status badge, User Manual trigger, and notification panel.',
          },
          {
            stepNumber: 2,
            title: 'Left Workspace Sidebar',
            description:
              'Houses direct navigation to all core operational modules: Overview Dashboard, Report Incident (camera-enabled), Case Management (master board), Hotspots & Recurrence, Insights & Analytics, Active Role Portal / Queue, Cinematic Intro replay, and the Interactive User Manual.',
          },
          {
            stepNumber: 3,
            title: 'Persistent Infrastructure City Background',
            description:
              'A non-intrusive, hardware-accelerated canvas background renders Bengaluru arterial roads and data nodes at z-0, keeping all interactive forms and cards in crisp, high-contrast foreground focus.',
          },
        ],
      },
      {
        id: 'status-indicators',
        title: 'Operational Readiness & Telemetry Indicators',
        summary: 'How to distinguish live backend connections from standalone sandbox mode.',
        steps: [
          {
            stepNumber: 1,
            title: 'Backend API Indicator',
            description:
              'Displays "Connected (FastAPI v1.0)" with a glowing emerald beacon when connected to the local backend on port 8000. If offline, it shows "Offline / Standalone" with an amber beacon, operating safely via browser local storage persistence.',
            actionHint: 'Click the Backend API badge in the top navbar anytime to re-test live connectivity.',
          },
          {
            stepNumber: 2,
            title: 'AI Inference Engine Status',
            description:
              'Displays "Heuristic (Weights Unconfigured)". In standalone mode, rule-based diagnostic algorithms evaluate category, severity recommendations, and repair time estimates without requiring external cloud model weights.',
          },
          {
            stepNumber: 3,
            title: 'Camera Feed Availability',
            description:
              'Displays "Simulated Feeds (CCTV Offline)". Municipal traffic surveillance cameras operate in simulation mode using authentic Bengaluru road snapshots, protecting civic privacy while demonstrating real incident detection logic.',
          },
          {
            stepNumber: 4,
            title: 'Government Integration Adapter',
            description:
              'Displays "Sandbox (Live BBMP Unconfigured)". The platform uses a municipal sandbox adapter for BBMP ward boundaries and service zones, preventing accidental calls to live government ticketing servers during demonstration.',
          },
        ],
      },
    ],
  },
  {
    id: 'citizen-reporting',
    number: '02',
    title: 'Citizen Incident Reporting Workflow',
    shortTitle: 'Citizen Reporting',
    iconName: 'Camera',
    badge: 'Citizen Portal',
    description:
      'Step-by-step guide to reporting physical public infrastructure hazards using exclusive live camera capture, geospatial validation, and transparent tracking.',
    relatedTab: 'report',
    relatedTabLabel: 'Open Report Incident',
    subSections: [
      {
        id: 'reporting-steps',
        title: 'Complete 10-Step Citizen Reporting Procedure',
        summary: 'Follow the enforced anti-fraud reporting sequence from live capture to submission.',
        steps: [
          {
            stepNumber: 1,
            title: 'Open Incident Reporting',
            description:
              'Click "Report Incident (Camera)" in the sidebar or the "Report Issue" button in the top navbar. Ensure your role is set to "Citizen" to access the live reporting interface.',
            actionHint: 'Switch to the Citizen role in the top navbar if reporting controls are hidden.',
          },
          {
            stepNumber: 2,
            title: 'Select Infrastructure Category',
            description:
              'Choose from 6 standardized municipal categories: Roads & Pavement, Water & Hydrology, Power & Grid Vaults, Street Illumination, Storm Drainage, or Bridges & Overpasses.',
            tip: 'Selecting the correct category automatically routes triage alerts to the appropriate municipal contractor.',
          },
          {
            stepNumber: 3,
            title: 'Live Camera Evidence Capture (Strict Anti-Fraud Rule)',
            description:
              'INFRANEX AI strictly requires live camera capture. Gallery uploads, saved file selections, and external image uploads are intentionally prohibited to ensure photographic authenticity and prevent historical re-reporting fraud.',
            warning:
              'Gallery upload is not supported. You must photograph the live hazard directly through your device camera.',
          },
          {
            stepNumber: 4,
            title: 'Grant Browser Camera Permission',
            description:
              'Click "Start Live Camera Stream". When prompted by your browser, select "Allow". The camera stream will render with alignment grid guides and real-time capture controls.',
          },
          {
            stepNumber: 5,
            title: 'Capture and Review Snapshot',
            description:
              'Frame the infrastructure failure clearly and click "Capture Photo". The platform takes a high-resolution snapshot and automatically triggers an AI Vision Diagnostic simulation.',
            tip: 'The diagnostic preview highlights detected anomaly type, estimated repair hours, and suggested severity.',
          },
          {
            stepNumber: 6,
            title: 'Accept Snapshot or Retake',
            description:
              'Inspect the captured snapshot. If clear, click "Keep & Use This Photo" to lock the evidence image. If blurry or poorly framed, click "Retake Photo" to return to the active viewfinder.',
          },
          {
            stepNumber: 7,
            title: 'Verify Incident Location (Bengaluru Boundary Enforced)',
            description:
              'Coordinates must fall within the BBMP municipal boundary (12.75°N to 13.15°N, 77.40°E to 77.80°E). Use either "Detect Current Location (GPS)" for automatic device positioning, or "Pin Location on Map" to click the exact street location.',
            tip: 'Click "Confirm Location" to lock the verified street address and GPS coordinates.',
          },
          {
            stepNumber: 8,
            title: 'Fill Required Incident Details',
            description:
              'Enter a descriptive Title (e.g., "Dangerous Pothole near Indiranagar 100ft Road"), a detailed Description of the hazard, and select an Initial Severity level (Low, Medium, High, Critical).',
          },
          {
            stepNumber: 9,
            title: 'Reporter Identification or Anonymous Mode',
            description:
              'Provide your name and contact phone number for SMS progress alerts, or toggle "Submit Anonymously" if you prefer civic privacy.',
          },
          {
            stepNumber: 10,
            title: 'Submit and Track Your Incident',
            description:
              'Click "Submit Incident Report". The system generates an official tracking ID (e.g., INF-BLR-2026-0042) and persists the record into the operational ledger. You can immediately track progress in the Citizen Portal.',
            actionHint: 'Copy your generated Incident ID to track lifecycle status at any time.',
          },
        ],
      },
      {
        id: 'citizen-tracking-confirmation',
        title: 'Incident Tracking, Repair Evidence & Citizen Confirmation',
        summary: 'How citizens track their cases through the 8-stage lifecycle and confirm physical resolution.',
        steps: [
          {
            stepNumber: 1,
            title: 'Look Up Your Incident ID',
            description:
              'Navigate to the Citizen Workspace in Role Portals. Enter your Incident ID (e.g., INF-BLR-2026-0042) in the search box, or click any incident in "My Active Reports" for instant tracking.',
          },
          {
            stepNumber: 2,
            title: 'Read the Authoritative 8-Stage Lifecycle Tracker',
            description:
              'Monitor progress across 8 canonical stages: 1. DETECTION -> 2. AI ASSESSMENT -> 3. VERIFICATION -> 4. ASSIGNMENT -> 5. REPAIR -> 6. REPAIR EVIDENCE -> 7. CONFIRMATION -> 8. CLOSURE. Consistent status colors show exact progress: Green (Complete), Blue (Active), Amber (Waiting Action), Red (Disputed/Failed), and Grey (Pending).',
            tip: 'Click any completed stage dot in the tracker to inspect recorded timestamps, actor identities, and evidence details.',
          },
          {
            stepNumber: 3,
            title: 'View Submitted Repair Evidence Side-by-Side',
            description:
              'When the contractor finishes work, the REPAIR EVIDENCE stage turns green. You will see the contractor’s post-repair photograph, logged materials, labor hours, and completion notes displayed side-by-side with your original report photograph.',
            tip: 'Your original report photo is permanently preserved and is never overwritten by repair photos.',
          },
          {
            stepNumber: 4,
            title: 'Citizen Confirmation Prompt: "Has this problem been resolved?"',
            description:
              'Once the municipal field officer inspects and validates the repair, the incident moves to "Awaiting Citizen Confirmation". You are presented with an explicit prompt asking: "Has this problem been resolved?"',
          },
          {
            stepNumber: 5,
            title: 'Option A: Confirm "YES — ISSUE RESOLVED"',
            description:
              'If the road or utility is restored to safe condition, click "YES — ISSUE RESOLVED". This records your positive civic sign-off, advances the lifecycle to stage 8 (CLOSURE), and closes the incident as "Closed — Verified".',
          },
          {
            stepNumber: 6,
            title: 'Option B: Dispute "NO — ISSUE STILL EXISTS"',
            description:
              'If the repair is incomplete, shoddy, or the hazard persists, click "NO — ISSUE STILL EXISTS". Provide a clear dispute reason. The platform immediately marks the CONFIRMATION stage red, sets the case to "disputed", and routes it back to the Field Officer for mandatory re-inspection, preventing silent auto-closure.',
            warning:
              'Disputed cases remain active and trackable. They cannot be closed without re-inspection and corrective action.',
          },
        ],
      },
    ],
  },
  {
    id: 'field-officer',
    number: '03',
    title: 'Field Officer Inspection & Triage Guide',
    shortTitle: 'Field Officer',
    iconName: 'UserCheck',
    badge: 'Officer Queue',
    description:
      'Instructions for municipal engineers and field officers to inspect incoming citizen evidence, perform human triage, assign contractors, and approve completed repairs.',
    relatedTab: 'role-view',
    relatedTabLabel: 'Open Officer Queue',
    subSections: [
      {
        id: 'officer-inspection',
        title: 'Reviewing, Triaging and Inspecting Incident Repairs',
        summary: 'How field officers inspect photo evidence, verify anomalies, assign contractors, and perform before-and-after quality audits.',
        steps: [
          {
            stepNumber: 1,
            title: 'Switch to Field Officer Workspace',
            description:
              'Click "Field Officer" in the top navbar role selector or navigate to "Field Inspection Queue" in the left sidebar.',
          },
          {
            stepNumber: 2,
            title: 'Review Incoming Citizen Evidence & AI Diagnostic',
            description:
              'Examine incoming reports in the queue. AI Vision diagnostic provides assistive classification, severity rating, and repair estimates. However, AI cannot bypass human officer verification.',
            warning: 'Mandatory human verification is required before any incident can be dispatched.',
          },
          {
            stepNumber: 3,
            title: 'Mandatory Human Verification Decision',
            description:
              'Inspect the captured live photo, location coordinates, reporter timestamp, and calculated AI confidence score. Verify that the hazard is genuine and within municipal jurisdiction.',
          },
          {
            stepNumber: 4,
            title: 'Assigning to Municipal Authority & Prime Contractor',
            description:
              'Click "Assign Authority / Contractor". Select the responsible bureau: Public Works (Roads), Hydrology & Water Bureau, Solid Waste Logistics, Metropolitan Energy, or Viaduct Structural Engineering. This generates a formal Contractor Work Order.',
          },
          {
            stepNumber: 5,
            title: 'Rejecting Invalid or Out-of-Scope Reports',
            description:
              'If a report is a false alarm or outside municipal jurisdiction, click "Reject Report". Select a mandatory justification (e.g., "Duplicate Report", "Outside Jurisdiction", "Non-Hazardous") and add notes. This transitions the case safely to "closed".',
          },
          {
            stepNumber: 6,
            title: 'Consolidating Duplicate Reports',
            description:
              'When multiple citizens report the same pothole or water leak, use the Consolidation action to link secondary cases to a master incident, avoiding duplicated contractor dispatches.',
          },
          {
            stepNumber: 7,
            title: 'Before-and-After Comparative Evidence Inspection',
            description:
              'When a contractor submits repair evidence, the case enters "Awaiting Repair Verification" (`review`). Open the Before & After Evidence Viewer: LEFT displays the original citizen report photo with date and location; RIGHT displays the contractor’s repaired photo, materials used, crew labor hours, completion timestamp, and SHA-256 hash.',
          },
          {
            stepNumber: 8,
            title: 'Field Officer Signoff or Rework Request',
            description:
              'Click "Approve Repair" if the restoration satisfies municipal engineering standards, which advances the case to Citizen Confirmation (`resolved`). If substandard, click "Request Rework" with a required written justification; this returns the work order to `rework_required` and the incident to `in_progress` without dropping out of the lifecycle.',
            tip: 'Disputed or rejected repairs are never silently dropped; they remain actionable and trackable.',
          },
        ],
      },
    ],
  },
  {
    id: 'contractor-guide',
    number: '04',
    title: 'Contractor Dispatch & Work Order Execution',
    shortTitle: 'Contractor Hub',
    iconName: 'HardHat',
    badge: 'Contractor Hub',
    description:
      'Procedures for municipal contractors and maintenance crews to receive work orders, log physical labor and materials, upload post-repair evidence, and request inspection.',
    relatedTab: 'role-view',
    relatedTabLabel: 'Open Contractor Hub',
    subSections: [
      {
        id: 'contractor-execution',
        title: 'Work Order Execution & Repair Evidence Submission',
        summary: 'How contractors manage active jobs and submit verifiable proof of physical repair.',
        steps: [
          {
            stepNumber: 1,
            title: 'Open Assigned Work Order',
            description:
              'Select "Contractor Hub" in the role switcher. The workspace displays all active work orders assigned to your registered contracting firm, showing the unique Work Order ID, Incident ID, category, original incident photograph, location, report date, scope of work, and current repair status.',
          },
          {
            stepNumber: 2,
            title: 'Mobilize On-Site & Update Repair Status',
            description:
              'When repair crews arrive on-site, click "Mark On-Site / In-Progress". The work order status transitions to `in_progress` and the incident timeline records crew mobilization.',
          },
          {
            stepNumber: 3,
            title: 'Execute Physical Civil Restoration',
            description:
              'Complete the physical road paving, pipe replacement, structural reinforcement, or utility repair according to municipal engineering standards.',
          },
          {
            stepNumber: 4,
            title: 'Launch "SUBMIT REPAIR EVIDENCE" Form',
            description:
              'Click the "SUBMIT REPAIR EVIDENCE" action on the active work order card. This launches the dedicated modal containing work order details and the evidence submission form.',
          },
          {
            stepNumber: 5,
            title: 'Upload Repaired Photographic Evidence',
            description:
              'Drag and drop or select the post-repair photograph. Accepted file formats include JPEG, PNG, and WebP up to 10MB. The form displays an immediate high-resolution preview with "Replace" and "Remove" options.',
            warning: 'Empty submissions or non-image files are rejected with clear error feedback.',
          },
          {
            stepNumber: 6,
            title: 'Log Description, Labor Hours, Materials & Timestamp',
            description:
              'Enter the repair completion description, specific materials deployed (e.g., "450kg Grade-4 Bitumen Emulsion, 2.4 tons M-20 aggregate"), crew labor hours (e.g., "14 crew-hours"), and verify the completion timestamp and GPS metadata.',
          },
          {
            stepNumber: 7,
            title: 'Confirm and Submit Evidence',
            description:
              'Click "Confirm & Submit Repair Evidence". The platform computes a cryptographic SHA-256 hash, creates a separate linked repair evidence record (`isAfterRepair: true`), permanently preserves the original citizen report photo, turns the REPAIR EVIDENCE progress step green, and advances the incident to "Awaiting Repair Verification" (`review`).',
            tip: 'The original report photo is never overwritten; both original and repaired photos are preserved permanently in the evidence history.',
          },
        ],
      },
    ],
  },
  {
    id: 'admin-guide',
    number: '05',
    title: 'Administrator Governance & Threshold Engine',
    shortTitle: 'Admin Governance',
    iconName: 'Shield',
    badge: 'Admin Command',
    description:
      'Guide for city administrators to calibrate operational SLA thresholds, inspect immutable audit trails, manage municipal infrastructure assets, and oversee dumping intelligence.',
    relatedTab: 'role-view',
    relatedTabLabel: 'Open Admin Command',
    subSections: [
      {
        id: 'admin-governance',
        title: 'Platform Administration & Configuration Tuning',
        summary: 'Configure municipal policies, review tamper-evident logs, and manage assets.',
        steps: [
          {
            stepNumber: 1,
            title: 'Switch to Admin Command Workspace',
            description:
              'Select "Admin Command" in the role switcher. This unlocks the Municipal Governance and Threshold Engine.',
          },
          {
            stepNumber: 2,
            title: 'Tuning Operational SLA Thresholds',
            description:
              'Adjust core municipal thresholds in real-time: Critical Response Hours (e.g., 4h SLA), High Response Hours (e.g., 12h SLA), Minimum AI Triage Confidence %, Hotspot Recurrence Sensitivity, and Duplicate Grouping Radius (meters).',
            tip: 'Changes are persisted to local storage in standalone mode, and synced to the database when backend API is connected.',
          },
          {
            stepNumber: 3,
            title: 'Inspect the Immutable Audit Trail',
            description:
              'Review the tamper-evident Audit Log. Every action taken on any incident (creation, triage, assignment, repair submission, rejection, validation) is recorded with an actor ID, timestamp, and action hash.',
          },
          {
            stepNumber: 4,
            title: 'Physical Infrastructure Asset Registry',
            description:
              'Inspect physical municipal assets (bridges, flyovers, water mains, grid vaults). View historical incident frequencies, assigned contractor records, and structural health ratings.',
          },
          {
            stepNumber: 5,
            title: 'Unauthorized Dumping Intelligence & CCTV Enforcement',
            description:
              'Inspect automated dumping events detected across Bengaluru corridors. Review camera timestamps, vehicle plate telemetry, and either "Confirm Violation" to issue municipal citations or "Dismiss False Positive".',
          },
        ],
      },
    ],
  },
  {
    id: 'case-management',
    number: '06',
    title: 'Case Management Master Board',
    shortTitle: 'Case Management',
    iconName: 'FolderKanban',
    badge: 'Master Board',
    description:
      'Manage municipal cases across their complete lifecycle using multi-column table grids, Kanban stage boards, multi-criteria filtering, and deep case inspection.',
    relatedTab: 'cases',
    relatedTabLabel: 'Open Case Management',
    subSections: [
      {
        id: 'case-board-views',
        title: 'Table Grid vs Lifecycle Kanban Board',
        summary: 'Switch between operational views and filter cases with precision.',
        steps: [
          {
            stepNumber: 1,
            title: 'Open Case Management',
            description:
              'Navigate to "Case Management" from the sidebar. The master header displays the total count of recorded incidents across Bengaluru zones.',
          },
          {
            stepNumber: 2,
            title: 'Switching View Modes',
            description:
              'Use the view mode toggle in the top-right of the header to switch between "Table Grid" (compact, dense list with full metadata) and "Lifecycle Kanban" (visual columns matching operational stages).',
          },
          {
            stepNumber: 3,
            title: 'Authoritative 8-Stage Incident Lifecycle',
            description:
              'Cases advance through exactly 8 canonical stages in fixed sequence: 1. DETECTION -> 2. AI ASSESSMENT -> 3. VERIFICATION -> 4. ASSIGNMENT -> 5. REPAIR -> 6. REPAIR EVIDENCE -> 7. CONFIRMATION -> 8. CLOSURE. Every stage displays consistent status colors across the application: GREEN (Complete), BLUE (Active / In Progress), AMBER (Waiting Action / Inspection), RED (Rejected / Failed / Disputed), and GREY (Not Yet Started). Clicking any stage reveals recorded timestamps, actors, and evidence.',
          },
          {
            stepNumber: 4,
            title: 'Precision Table-Fixed Grid & Aligned Metrics',
            description:
              'The Table Grid layout uses a semantic table-fixed architecture with strict column widths (<colgroup>), aligned headers and cells, uniform badge positioning, row mini lifecycle progress dots, and zero text clipping or horizontal distortion.',
          },
          {
            stepNumber: 5,
            title: 'Applying Filters & Global Search',
            description:
              'Filter instantly by Category (Roads, Water, Electrical, Lighting, Drainage, Structural), Severity (Low, Medium, High, Critical), and Status. Use the search bar to query by Case ID (e.g., INF-BLR-001), road name, or description.',
          },
          {
            stepNumber: 6,
            title: 'Opening Case Details & Before/After Evidence',
            description:
              'Click any case row or card to launch the comprehensive Case Detail Modal. This features the embedded 8-Stage Incident Lifecycle Tracker, side-by-side Before/After Evidence Viewer, officer inspection controls, and the citizen confirmation prompt.',
          },
        ],
      },
    ],
  },
  {
    id: 'maps-hotspots',
    number: '07',
    title: 'Maps & Hotspot Recurrence Intelligence',
    shortTitle: 'Maps & Hotspots',
    iconName: 'Flame',
    badge: 'Geospatial',
    description:
      'Geospatial intelligence tools to visualize spatial failure clusters, chronic waste accumulation zones, and automated municipal intervention recommendations.',
    relatedTab: 'hotspots',
    relatedTabLabel: 'Open Hotspots & Recurrence',
    subSections: [
      {
        id: 'geospatial-tools',
        title: 'Interactive City Map & Recurrence Hotspots',
        summary: 'Interpret map markers, ward boundaries, and chronic recurrence scoring.',
        steps: [
          {
            stepNumber: 1,
            title: 'Interactive City Infrastructure Map',
            description:
              'Located on the Overview Dashboard. Renders Bengaluru municipal wards with dark-mode Leaflet vector cartography. Markers are color-coded by severity: Red (Critical), Amber (High), Cyan (Medium), and Slate (Low).',
          },
          {
            stepNumber: 2,
            title: 'Filtering Map Hazards by Category',
            description:
              'Click category filter chips above the map to isolate specific utility networks: All Hazards, Roads & Bridges, Water Mains, Electrical Grid, Street Lighting, Storm Drainage, or Structural Overpasses.',
          },
          {
            stepNumber: 3,
            title: 'Navigating to Hotspots & Recurrence View',
            description:
              'Select "Hotspots & Recurrence" from the left sidebar to open the dedicated recurrence intelligence dashboard.',
          },
          {
            stepNumber: 4,
            title: 'Interpreting Recurrence Levels and Scores',
            description:
              'Hotspots are scored from 0 to 100 based on chronic failure frequency, cleanup frequency, and unauthorized dumping recurrence. Rated as "High" (score 75+), "Moderate" (40-74), or "Low" (<40).',
          },
          {
            stepNumber: 5,
            title: 'Dynamic Site Recalculation',
            description:
              'Click "Recalculate All Sites" to re-run the recurrence scoring engine against all latest dumping events and verified work order completions in the ledger.',
          },
          {
            stepNumber: 6,
            title: 'Inspecting Hotspot Detail & CCTV Feeds',
            description:
              'Click "Inspect Recurrence Profile" on any hotspot card to review the simulated camera monitoring feed, historical cleanup timeline, and suggested municipal actions (e.g., CCTV installation, enforcement patrols).',
          },
        ],
      },
    ],
  },
  {
    id: 'analytics',
    number: '08',
    title: 'Civic Telemetry & Predictive Analytics',
    shortTitle: 'Analytics',
    iconName: 'BarChart3',
    badge: 'Intelligence',
    description:
      'Understand failure risk indexing, Mean Time to Resolution (MTTR) benchmarks, contractor quality success rates, and municipal budget forecast modeling.',
    relatedTab: 'insights',
    relatedTabLabel: 'Open Insights & Analytics',
    subSections: [
      {
        id: 'metrics-guide',
        title: 'Interpreting Real vs Calculated vs Baseline Metrics',
        summary: 'A transparent guide to how analytics numbers are derived across the platform.',
        steps: [
          {
            stepNumber: 1,
            title: 'Ward Vulnerability & Deterioration Heat Index',
            description:
              'Calculated dynamically by combining baseline ward asset age and citizen density with real-time active and critical incidents recorded in each BBMP zone (East, West, South, Mahadevapura, etc.).',
            tip: 'Higher scores indicate zones where preventative infrastructure retrofits will yield maximum risk reduction.',
          },
          {
            stepNumber: 2,
            title: 'Contractor Quality & Repair Success Rate',
            description:
              'Dynamically derived from the ratio of approved work order validations minus citizen-disputed repairs over total assigned jobs. A high score confirms physical repair durability.',
          },
          {
            stepNumber: 3,
            title: 'Domain Mean Time to Resolution (MTTR)',
            description:
              'Tracks average resolution speed across 7 infrastructure categories. Displays MTTR (e.g., 14.2h for Roads), SLA target (24h), and percentage compliance rate.',
          },
          {
            stepNumber: 4,
            title: 'Real-Time Dynamic MTTR on Dashboard',
            description:
              'The Overview Dashboard automatically computes real MTTR whenever resolved cases with completed timeline records exist in local storage or the database, replacing demo estimates with true empirical averages.',
          },
        ],
      },
    ],
  },
  {
    id: 'troubleshooting',
    number: '09',
    title: 'Camera, Location & Connectivity Help',
    shortTitle: 'Troubleshooting',
    iconName: 'AlertTriangle',
    badge: 'Diagnostics',
    description:
      'Actionable troubleshooting steps for camera access errors, GPS positioning failures, boundary errors, and backend connectivity.',
    subSections: [
      {
        id: 'camera-troubleshooting',
        title: 'Camera Access & Viewfinder Diagnostics',
        summary: 'How to resolve camera hardware and browser permission issues.',
        steps: [
          {
            stepNumber: 1,
            title: 'Resolving "Camera Permission Denied"',
            description:
              'Click the lock or tune icon in your browser address bar (left of http://127.0.0.1:3001/). Find the "Camera" permission, change it from "Block" to "Allow", and reload the webpage.',
          },
          {
            stepNumber: 2,
            title: 'Resolving "Camera in Use / Hardware Unavailable"',
            description:
              'Close any other applications that may currently be locking your webcam or phone camera (e.g., Zoom, Microsoft Teams, FaceTime, or other browser tabs). Then click "Start Live Camera Stream" again.',
          },
          {
            stepNumber: 3,
            title: 'Understanding the Live Capture Requirement',
            description:
              'If you are looking for a "Choose File" or "Upload from Gallery" button, note that INFRANEX AI deliberately does not support gallery uploads to maintain strict chain-of-custody anti-fraud standards.',
          },
        ],
      },
      {
        id: 'location-troubleshooting',
        title: 'Geospatial Location & Boundary Diagnostics',
        summary: 'Resolving GPS timeouts and out-of-bounds municipal errors.',
        steps: [
          {
            stepNumber: 1,
            title: 'Resolving GPS Timeouts or Low Accuracy',
            description:
              'If "Detect Current Location" times out, ensure device location services are switched on. Alternatively, switch immediately to "Pin Location on Map" to drop an exact crosshair marker manually.',
          },
          {
            stepNumber: 2,
            title: 'Resolving "Location Outside Bengaluru BBMP Boundary"',
            description:
              'INFRANEX AI is engineered specifically for the Greater Bengaluru municipal jurisdiction. Coordinates must fall between 12.75°N–13.15°N and 77.40°E–77.80°E. If testing remotely, use the map picker to click any location within Bengaluru.',
          },
        ],
      },
      {
        id: 'connectivity-troubleshooting',
        title: 'Backend API & Storage Diagnostics',
        summary: 'Operating in standalone browser mode versus live FastAPI database mode.',
        steps: [
          {
            stepNumber: 1,
            title: 'Understanding Standalone Mode',
            description:
              'If the Backend API badge displays "Offline / Standalone", the platform remains 100% operational using browser local storage. You can report incidents, triage cases, assign contractors, and calibrate thresholds without data loss.',
          },
          {
            stepNumber: 2,
            title: 'Connecting to FastAPI Backend',
            description:
              'To connect the live Python backend, ensure the FastAPI server is running on http://127.0.0.1:8000. Then click the Backend API badge in the top navbar to verify handshake.',
          },
          {
            stepNumber: 3,
            title: 'Resetting Demonstration Data',
            description:
              'If you wish to reset all mock incidents and work orders back to default values, clear your browser local storage for localhost:3001 and reload the application.',
          },
        ],
      },
    ],
  },
  {
    id: 'glossary',
    number: '10',
    title: 'Terms, Abbreviations & Definitions',
    shortTitle: 'Glossary',
    iconName: 'BookOpen',
    badge: 'Definitions',
    description:
      'A plain-English dictionary of technical, civic, and operational terminology used throughout the INFRANEX AI platform.',
    subSections: [
      {
        id: 'glossary-terms',
        title: 'Alphabetical Terminology Reference',
        summary: 'Key terminology explained for citizens, engineers, and municipal officers.',
        content: [
          'Review the glossary table below for official definitions of all terms used across INFRANEX AI modules and reports.',
        ],
      },
    ],
  },
];

export const GLOSSARY_TERMS: GlossaryTerm[] = [
  {
    term: 'Incident',
    category: 'System',
    definition:
      'A logged municipal infrastructure failure, safety hazard, or maintenance breakdown reported by a citizen, sensor, or field officer.',
    example: 'INF-BLR-2026-0012: Deep Asphalt Pothole on Outer Ring Road.',
  },
  {
    term: 'Evidence',
    category: 'Workflow',
    definition:
      'Cryptographically hashed, live camera photographs and GPS telemetry captured on-site demonstrating the existence or repair of an infrastructure hazard.',
  },
  {
    term: 'AI Triage',
    category: 'System',
    definition:
      'Heuristic or neural evaluation of captured photographs to estimate failure category, hazard severity, and suggested repair duration before human verification.',
  },
  {
    term: 'Human Validation',
    category: 'Workflow',
    definition:
      'The mandatory review step where a certified municipal Field Officer physically inspects evidence and authorizes contractor dispatch or repair signoff.',
  },
  {
    term: 'Work Order (WO)',
    category: 'Workflow',
    definition:
      'A legally binding municipal dispatch order issued to a contracted engineering firm specifying scope of work, materials, and SLA target days.',
    example: 'WO-BLR-004: Bitumen Compaction & Leveling dispatched to Apex Civils.',
  },
  {
    term: 'Hotspot',
    category: 'Workflow',
    definition:
      'A localized municipal area characterized by chronic recurrence of infrastructure failures or repeated unauthorized solid waste dumping.',
  },
  {
    term: 'Recurrence Score',
    category: 'Metric',
    definition:
      'A calculated index from 0 to 100 measuring how frequently an area experiences chronic repeat failures despite previous cleanup or repair interventions.',
  },
  {
    term: 'Severity Levels',
    category: 'System',
    definition:
      'Standardized 4-tier risk classification: Critical (immediate danger to life/grid), High (severe traffic/utility disruption), Medium (moderate hazard), and Low (cosmetic/minor maintenance).',
  },
  {
    term: 'Mean Time to Resolution (MTTR)',
    category: 'Metric',
    definition:
      'The average elapsed time from citizen report ingestion to completed, verified field repair closure across municipal zones.',
  },
  {
    term: 'Service Level Agreement (SLA)',
    category: 'Metric',
    definition:
      'Contractual time limits enforced on municipal contractors for initial inspection, dispatch, and physical hazard resolution.',
  },
  {
    term: 'Citizen Confirmation',
    category: 'Workflow',
    definition:
      'The final civic accountability loop where the reporting citizen or local neighborhood confirms whether the completed repair meets satisfaction.',
  },
  {
    term: 'Authoritative Lifecycle Tracker',
    category: 'System',
    definition:
      'The unified 8-stage progression engine (Detection, AI Assessment, Verification, Assignment, Repair, Repair Evidence, Confirmation, Closure) ensuring all roles view the exact same connected state.',
    example: '8-stage horizontal tracker with Green (Complete), Blue (Active), Amber (Waiting), Red (Disputed), and Grey (Pending).',
  },
  {
    term: 'Repair Evidence Record',
    category: 'Workflow',
    definition:
      'A distinct, cryptographically hashed evidence artifact created by an assigned contractor containing post-repair photos, labor, and materials without overwriting the original citizen report photo.',
  },
  {
    term: 'Before-and-After Inspection',
    category: 'Workflow',
    definition:
      'Side-by-side comparative verification display in case details allowing field officers and citizens to audit the original report against completed restoration proof.',
  },
  {
    term: 'Disputed Repair Workflow',
    category: 'Workflow',
    definition:
      'Civic accountability mechanism where a citizen selection of "NO — ISSUE STILL EXISTS" prevents automatic case closure and returns the incident for mandatory field re-inspection.',
  },
  {
    term: 'BBMP',
    category: 'Role',
    definition:
      'Bruhat Bengaluru Mahanagara Palike — the administrative metropolitan municipal corporation governing greater Bengaluru infrastructure.',
  },
  {
    term: 'Janaspandana (ಜನಸ್ಪಂದನ)',
    category: 'Workflow',
    definition:
      'Kannada civic principle signifying "Citizen Pulse and Public Accountability", reflecting public participation in infrastructure governance.',
  },
  {
    term: 'PostGIS / Geospatial Boundary',
    category: 'System',
    definition:
      'The spatial database coordinate polygon bounding valid municipal coordinates within the Greater Bengaluru urban area.',
  },
];
