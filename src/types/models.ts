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
  status: 'scheduled' | 'canceled'; // Status spotkania (zaplanowane/anulowane)
  createdAt?: Date; // Opcjonalne pole na datę utworzenia, przydatne do sortowania
}

export {}; // Dodaj to, aby plik był traktowany jako moduł