export enum Subject {
  ALGEBRA = 'Алгебра',
  HISTORY = 'История',
  PHYSICS = 'Физика',
  CHEMISTRY = 'Химия'
}

export interface Message {
  id: string;
  role: 'user' | 'model';
  content: string;
  image?: string; // Base64 string for user images
  timestamp: number;
}

export interface SubjectConfig {
  id: Subject;
  name: string;
  icon: string;
  color: string;
  systemInstruction: string;
}