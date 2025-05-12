
import { ConlangLanguage } from "@/types/language";

// Local storage key
const STORAGE_KEY = "conlang-languages";

// Get all languages
export const getLanguages = (): ConlangLanguage[] => {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) return [];
  
  try {
    return JSON.parse(stored);
  } catch (error) {
    console.error("Failed to parse languages:", error);
    return [];
  }
};

// Get a specific language by ID
export const getLanguageById = (id: string): ConlangLanguage | undefined => {
  const languages = getLanguages();
  return languages.find((lang) => lang.id === id);
};

// Save a new language
export const saveLanguage = (language: ConlangLanguage): void => {
  const languages = getLanguages();
  const existingIndex = languages.findIndex((lang) => lang.id === language.id);
  
  if (existingIndex >= 0) {
    // Update existing language
    languages[existingIndex] = language;
  } else {
    // Add new language
    languages.push(language);
  }
  
  localStorage.setItem(STORAGE_KEY, JSON.stringify(languages));
};

// Delete a language
export const deleteLanguage = (id: string): void => {
  const languages = getLanguages().filter((lang) => lang.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(languages));
};
