import React, { createContext, useContext, useState, ReactNode } from "react";
import {
  doctors as initialDoctors, vendors as initialVendors, patients as initialPatients,
  diaries as initialDiaries, diaryEntries as initialEntries, notifications as initialNotifications,
  auditLogs as initialAuditLogs, assistants as initialAssistants, tasks as initialTasks,
  superAdmins as initialSuperAdmins,
  Doctor, Vendor, Patient, Diary, DiaryEntry, Notification, AuditLog, Assistant, Task, SuperAdmin,
} from "@/data/mockData";

interface DataContextType {
  doctors: Doctor[]; setDoctors: React.Dispatch<React.SetStateAction<Doctor[]>>;
  vendors: Vendor[]; setVendors: React.Dispatch<React.SetStateAction<Vendor[]>>;
  patients: Patient[]; setPatients: React.Dispatch<React.SetStateAction<Patient[]>>;
  diaries: Diary[]; setDiaries: React.Dispatch<React.SetStateAction<Diary[]>>;
  diaryEntries: DiaryEntry[]; setDiaryEntries: React.Dispatch<React.SetStateAction<DiaryEntry[]>>;
  notifications: Notification[]; setNotifications: React.Dispatch<React.SetStateAction<Notification[]>>;
  auditLogs: AuditLog[];
  assistants: Assistant[]; setAssistants: React.Dispatch<React.SetStateAction<Assistant[]>>;
  tasks: Task[]; setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
  superAdmins: SuperAdmin[]; setSuperAdmins: React.Dispatch<React.SetStateAction<SuperAdmin[]>>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider = ({ children }: { children: ReactNode }) => {
  const [doctors, setDoctors] = useState<Doctor[]>(initialDoctors);
  const [vendors, setVendors] = useState<Vendor[]>(initialVendors);
  const [patients, setPatients] = useState<Patient[]>(initialPatients);
  const [diaries, setDiaries] = useState<Diary[]>(initialDiaries);
  const [diaryEntries, setDiaryEntries] = useState<DiaryEntry[]>(initialEntries);
  const [notifications, setNotifications] = useState<Notification[]>(initialNotifications);
  const [auditLogs] = useState<AuditLog[]>(initialAuditLogs);
  const [assistants, setAssistants] = useState<Assistant[]>(initialAssistants);
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [superAdmins, setSuperAdmins] = useState<SuperAdmin[]>(initialSuperAdmins);

  return (
    <DataContext.Provider value={{
      doctors, setDoctors, vendors, setVendors, patients, setPatients,
      diaries, setDiaries, diaryEntries, setDiaryEntries, notifications, setNotifications,
      auditLogs, assistants, setAssistants, tasks, setTasks, superAdmins, setSuperAdmins,
    }}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error("useData must be used within DataProvider");
  return ctx;
};
