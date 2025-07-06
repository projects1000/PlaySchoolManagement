export interface Student {
  id: string;
  firstName: string;
  lastName: string;
  dateOfBirth: Date;
  gender: 'male' | 'female' | 'other';
  enrollmentDate: Date;
  classId: string;
  parentInfo: ParentInfo;
  medicalInfo: MedicalInfo;
  emergencyContact: EmergencyContact;
  profilePicture?: string;
  isActive: boolean;
  notes?: string;
}

export interface ParentInfo {
  father: ContactInfo;
  mother: ContactInfo;
  guardian?: ContactInfo;
}

export interface ContactInfo {
  name: string;
  email: string;
  phone: string;
  occupation?: string;
  address: Address;
}

export interface MedicalInfo {
  allergies?: string[];
  medications?: string[];
  medicalConditions?: string[];
  doctorName?: string;
  doctorPhone?: string;
  bloodGroup?: string;
}

export interface EmergencyContact {
  name: string;
  relationship: string;
  phone: string;
  email?: string;
}

export interface Address {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}
