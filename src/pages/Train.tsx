
import React, { useState, useEffect } from 'react';
import { toast } from "@/components/ui/sonner";
import { ConlangLanguage } from "@/types/language";
import { getLanguages } from "@/lib/languageStore";
import LanguageSelector from "@/components/train/LanguageSelector";
import ConlangTypingArea from "@/components/train/ConlangTypingArea";
import WordDefinitionForm from "@/components/train/WordDefinitionForm";
import { parseSentence, submitWordData } from "@/services/trainingService";
import MongoDBHealthDialog from "@/components/train/MongoDBHealthDialog";

// Word types for categorizing vocabulary
const wordTypes = [
  "verb", "adjective", "noun", "pronoun", "prefix", 
  "preposition", "conjunction", "adverb", "article", "interjection"
];

const Train = () => {
  // Original state variables for training
  const [sentence, setSentence] = useState("");
  const [wordList, setWordList] = useState<string[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [meaning, setMeaning] = useState("");
  const [type, setType] = useState(wordTypes[0]);
  const [context, setContext] = useState("");
  
  // State variables for conlang typing
  const [languages, setLanguages] = useState<ConlangLanguage[]>([]);
  const [selectedLanguage, setSelectedLanguage] = useState<ConlangLanguage | null>(null);
  const [isLanguagesLoading, setIsLanguagesLoading] = useState(true);

  // Load available conlang languages
  useEffect(() => {
    const loadLanguages = async () => {
      setIsLanguagesLoading(true);
      try {
        const loadedLanguages = await getLanguages();
        setLanguages(loadedLanguages);
        
        // Select the first language if available
        if (loadedLanguages.length > 0) {
          setSelectedLanguage(loadedLanguages[0]);
        }
      } catch (error) {
        console.error("Failed to load languages:", error);
        toast.error("Failed to load conlang languages");
      } finally {
        setIsLanguagesLoading(false);
      }
    };
    
    loadLanguages();
  }, []);

  // Handle language selection change
  const handleLanguageChange = (value: string) => {
    const selected = languages.find(lang => lang.id === value) || null;
    setSelectedLanguage(selected);
    setSentence("");
  };

  const submitSentence = async () => {
    if (!sentence.trim()) {
      toast.error("Please enter a sentence");
      return;
    }
    
    setLoading(true);
    try {
      const data = await parseSentence(sentence);
      
      if (data.unknown_words.length === 0) {
        toast.info("No unknown words found in this sentence");
        setShowForm(false);
      } else {
        setWordList(data.unknown_words);
        setCurrentIndex(0);
        setMeaning("");  // Reset the form for the first word
        setType(wordTypes[0]);
        setContext("");
        setShowForm(true);
        toast.success(`Found ${data.unknown_words.length} word(s) to learn`);
      }
    } catch (err) {
      console.error(err);
      toast.error("Error contacting server. Is the backend running?");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitWordData = async () => {
    if (!meaning.trim()) {
      toast.error("Please enter a meaning for the word");
      return;
    }
    
    setLoading(true);
    const word = wordList[currentIndex];
    try {
      await submitWordData(word, meaning, type, context);
      toast.success(`Word "${word}" saved successfully`);

      // Reset form for next word
      setMeaning("");
      setType(wordTypes[0]);
      setContext("");

      if (currentIndex + 1 < wordList.length) {
        setCurrentIndex(currentIndex + 1);
      } else {
        setShowForm(false);
        toast.success("Training complete!");
      }
    } catch (err) {
      console.error(err);
      toast.error("Error saving word data");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-4 max-w-3xl">
      <h2 className="text-2xl font-bold mb-6">Train AI Vocabulary</h2>
      
      {/* MongoDB Health Dialog */}
      <MongoDBHealthDialog />
      
      <LanguageSelector
        languages={languages}
        selectedLanguage={selectedLanguage}
        onSelectLanguage={handleLanguageChange}
        isLoading={isLanguagesLoading}
      />
      
      <ConlangTypingArea
        selectedLanguage={selectedLanguage}
        sentence={sentence}
        setSentence={setSentence}
        handleSubmit={submitSentence}
        loading={loading}
      />

      {showForm && wordList.length > 0 && (
        <WordDefinitionForm
          currentWord={wordList[currentIndex]}
          currentIndex={currentIndex}
          totalWords={wordList.length}
          meaning={meaning}
          setMeaning={setMeaning}
          type={type}
          setType={setType}
          context={context}
          setContext={setContext}
          onSubmit={handleSubmitWordData}
          loading={loading}
          wordTypes={wordTypes}
        />
      )}
    </div>
  );
};

export default Train;
