
import { ConlangLanguage, Letter } from "@/types/language";
import { supabase } from "@/integrations/supabase/client";
import { Json } from "@/integrations/supabase/types";

// Helper function to properly type the data from Supabase
const mapSupabaseDataToLanguage = (data: any): ConlangLanguage => {
  return {
    id: data.id,
    name: data.name,
    letters: data.letters as Letter[],
    created_at: data.created_at
  };
};

// Get all languages from Supabase
export const getLanguages = async (): Promise<ConlangLanguage[]> => {
  try {
    const { data, error } = await supabase
      .from('conlang_scripts')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error("Error fetching languages:", error);
      return [];
    }
    
    // Map the Supabase data to our ConlangLanguage type
    return data ? data.map(mapSupabaseDataToLanguage) : [];
  } catch (error) {
    console.error("Failed to fetch languages:", error);
    return [];
  }
};

// Get a specific language by ID from Supabase
export const getLanguageById = async (id: string): Promise<ConlangLanguage | null> => {
  try {
    const { data, error } = await supabase
      .from('conlang_scripts')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      console.error("Error fetching language:", error);
      return null;
    }
    
    return data ? mapSupabaseDataToLanguage(data) : null;
  } catch (error) {
    console.error("Failed to fetch language by ID:", error);
    return null;
  }
};

// Save a new language to Supabase
export const saveLanguage = async (language: Omit<ConlangLanguage, "id" | "created_at">): Promise<ConlangLanguage | null> => {
  try {
    const { data, error } = await supabase
      .from('conlang_scripts')
      .insert([{ 
        name: language.name, 
        letters: language.letters as unknown as Json
      }])
      .select()
      .single();
    
    if (error) {
      console.error("Error saving language:", error);
      return null;
    }
    
    return data ? mapSupabaseDataToLanguage(data) : null;
  } catch (error) {
    console.error("Failed to save language:", error);
    return null;
  }
};

// Delete a language from Supabase
export const deleteLanguage = async (id: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('conlang_scripts')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error("Error deleting language:", error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error("Failed to delete language:", error);
    return false;
  }
};
