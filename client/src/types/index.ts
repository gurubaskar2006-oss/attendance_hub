export type UserRole =
  | 'SUPER_ADMIN'
  | 'SCHOOL_ADMIN'
  | 'PRINCIPAL'
  | 'COORDINATOR'
  | 'TEACHER'
  | 'PARENT'
  | 'STAFF';

export interface IUser {
  id: string;
  email: string;
  phone?: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  tenantId: string;
  permissions?: string[];
  avatarUrl?: string;
  lastLogin?: string;
}

export interface ITenantSettings {
  attendanceCutoffTime: string;
  sessionMode: 'FULL_DAY' | 'TWO_SESSIONS';
  gradingSystem: 'LETTER_GRADE' | 'PERCENTAGE' | 'GPA';
  gradeScale: Array<{
    grade: string;
    minMarks: number;
    maxMarks: number;
    remarks?: string;
  }>;
  enableSms: boolean;
  enableWhatsapp: boolean;
  defaultNotificationLanguage: 'en' | 'ta';
  workingDays: string[];
  consecutiveAbsenceAlertThreshold: number;
}

export interface ITenant {
  tenantId: string;
  name: string;
  code: string;
  affiliation: 'CBSE' | 'ICSE' | 'STATE_BOARD' | 'MATRICULATION' | 'IB' | 'OTHER';
  registrationNumber?: string;
  address: {
    street?: string;
    city: string;
    state: string;
    postalCode?: string;
    country: string;
  };
  contact: {
    email: string;
    phone: string;
    website?: string;
  };
  status: 'ACTIVE' | 'SUSPENDED' | 'ONBOARDING' | 'INACTIVE';
  settings: ITenantSettings;
}

export interface ISoftwareLicense {
  licenseKey: string;
  tenantId: string;
  schoolName: string;
  customerName: string;
  agreementReference: string;
  purchaseDate: string;
  activationDate?: string;
  status: 'PENDING_ACTIVATION' | 'ACTIVE' | 'SUSPENDED' | 'REVOKED';
  licenseType: 'PERMANENT';
  tier: 'STANDARD' | 'PROFESSIONAL' | 'ENTERPRISE';
  limits: {
    maxStudents: number;
    maxStaff: number;
  };
  licensedModules: string[];
  commercialServices: {
    annualMaintenanceContract: {
      active: boolean;
      startDate?: string;
      validUntil?: string;
    };
    cloudStorageAllocatedGb: number;
    smsCreditsPurchased: number;
    smsCreditsUsed: number;
    whatsappCreditsPurchased: number;
    whatsappCreditsUsed: number;
  };
}

export interface IAcademicYear {
  _id: string;
  name: string;
  startDate: string;
  endDate: string;
  isCurrent: boolean;
}

export interface IClass {
  _id: string;
  name: string;
  gradeLevel: number;
  displayOrder: number;
  sections?: ISection[];
}

export interface ISection {
  _id: string;
  classId: string;
  name: string;
  roomNumber?: string;
  capacity?: number;
}

export interface ISubject {
  _id: string;
  name: string;
  code: string;
  isElective: boolean;
  department?: string;
}

export interface IStudent {
  _id: string;
  admissionNumber: string;
  rollNumber?: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: 'MALE' | 'FEMALE' | 'OTHER';
  classId: any;
  sectionId: any;
  status: 'ACTIVE' | 'TRANSFERRED' | 'WITHDRAWN' | 'GRADUATED';
  bloodGroup?: string;
  emergencyContact?: {
    name: string;
    relationship: string;
    phone: string;
  };
}

export type AttendanceStatus =
  | 'PRESENT'
  | 'ABSENT'
  | 'LATE'
  | 'HALF_DAY'
  | 'APPROVED_LEAVE';

export interface IAttendanceRecord {
  studentId: string;
  name: string;
  admissionNumber: string;
  rollNumber?: string;
  status: AttendanceStatus;
  remarks?: string;
  recordId?: string;
}

export interface IExamination {
  _id: string;
  name: string;
  examType: 'UNIT_TEST' | 'QUARTERLY' | 'HALF_YEARLY' | 'ANNUAL' | 'CUSTOM';
  startDate: string;
  endDate: string;
  isPublished: boolean;
  configuredSubjectsCount?: number;
}

export interface ILeaveRequest {
  _id: string;
  studentId: any;
  parentId: any;
  startDate: string;
  endDate: string;
  totalDays: number;
  reason: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  reviewRemarks?: string;
  reviewedBy?: any;
  reviewedAt?: string;
  createdAt: string;
}

export interface IAnnouncement {
  _id: string;
  title: string;
  content: string;
  targetAudience: 'ALL' | 'TEACHERS' | 'PARENTS' | 'CLASS';
  priority: 'NORMAL' | 'HIGH' | 'URGENT';
  authorId?: any;
  publishedAt: string;
}

export interface INotification {
  _id: string;
  channel: 'PORTAL' | 'SMS' | 'WHATSAPP';
  event: string;
  title: string;
  messageEn: string;
  messageTa?: string;
  status: 'PENDING' | 'SENT' | 'FAILED' | 'SIMULATED';
  recipientName: string;
  recipientPhone?: string;
  sentAt?: string;
  readAt?: string;
}

