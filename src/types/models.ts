// src/types/models.ts
export interface Meeting {
  id: string; // Unikalny identyfikator spotkania w Firestore
  title: string; // Tytuł spotkania (np. "Spotkanie zespołu")
  description: string; // Szczegółowy opis spotkania
  date: string; // Data spotkania w formacie YYYY-MM-DD (np. "2025-07-20")
  startTime: string; // Czas rozpoczęcia w formacie HH:MM (np. "09:00")
  endTime: string; // Czas zakończenia w formacie HH:MM (np. "10:30")
  participants: string[]; // Tablica adresów e-mail uczestników
  createdBy: string; // UID użytkownika, który utworzył spotkanie
  creatorUsername?: string | null; // Zmieniono na 'string | null' aby zezwolić na null
  status: 'scheduled' | 'canceled'; // Status spotkania (zaplanowane/anulowane)
  createdAt?: Date; // Opcjonalne pole na datę utworzenia, przydatne do sortowania
}

// Interfejs dla profilu użytkownika
export interface UserProfile {
  id: string; // Zmieniono z 'uid' na 'id' dla spójności
  email: string | null;
  role: 'user' | 'admin';
  username?: string;
  createdAt?: Date;
}

// Interfejs dla zdarzeń kalendarza (rozszerza BigCalendarBaseEvent)
import { Event as BigCalendarBaseEvent } from 'react-big-calendar';

export interface CalendarEvent extends BigCalendarBaseEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  allDay: boolean;
  resource?: Meeting; // Dodajemy oryginalne dane spotkania do zdarzenia kalendarza
}