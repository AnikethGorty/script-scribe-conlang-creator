
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/sonner";

interface VocabularyWord {
  id?: string;
  word: string;
  meaning: string;
  type: string;
  context?: string | null;
  created_at?: string;
  updated_at?: string;
}

/**
 * Adds a new word to the Supabase vocabulary database
 */
export const addWordToSupabase = async (word: string, meaning: string, type: string, context?: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('vocabulary_words')
      .upsert(
        { 
          word, 
          meaning, 
          type, 
          context: context || null,
          updated_at: new Date().toISOString() 
        },
        { onConflict: 'word' }
      );
    
    if (error) {
      console.error("Error adding word to Supabase:", error);
      toast.error(`Failed to save word: ${error.message}`);
      return false;
    }
    
    return true;
  } catch (err) {
    console.error("Exception when adding word to Supabase:", err);
    toast.error("An unexpected error occurred when saving the word");
    return false;
  }
};

/**
 * Gets all words from the Supabase vocabulary database
 */
export const getAllWordsFromSupabase = async (): Promise<VocabularyWord[]> => {
  try {
    const { data, error } = await supabase
      .from('vocabulary_words')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error("Error fetching words from Supabase:", error);
      toast.error(`Failed to fetch words: ${error.message}`);
      return [];
    }
    
    return data || [];
  } catch (err) {
    console.error("Exception when fetching words from Supabase:", err);
    toast.error("An unexpected error occurred when fetching words");
    return [];
  }
};

/**
 * Gets a list of known words from the Supabase vocabulary database
 * (just the word strings, not the full objects)
 */
export const getKnownWordsFromSupabase = async (): Promise<string[]> => {
  try {
    const { data, error } = await supabase
      .from('vocabulary_words')
      .select('word');
    
    if (error) {
      console.error("Error fetching known words from Supabase:", error);
      return [];
    }
    
    return data ? data.map(item => item.word) : [];
  } catch (err) {
    console.error("Exception when fetching known words from Supabase:", err);
    return [];
  }
};
