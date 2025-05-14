
import React, { useState, useEffect, KeyboardEvent } from 'react';
import axios from 'axios';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/components/ui/sonner";
import { ConlangLanguage } from "@/types/language";
import { getLanguages } from "@/lib/languageStore";

const wordTypes = ["verb", "adjective", "noun", "pronoun", "prefix", "preposition", "conjunction", "adverb", "article", "interjection"];

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
  
  // New state variables for conlang typing
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

  // Handle key press for conlang typing
  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (!selectedLanguage) return;
    
    // Allow special keys for navigation and control
    const navigationKeys = [
      "Backspace", "Delete", "ArrowLeft", "ArrowRight", 
      "ArrowUp", "ArrowDown", "Tab", "Enter", "Escape",
      "Control", "Alt", "Shift", "Meta", "CapsLock"
    ];
    
    if (navigationKeys.includes(e.key)) return;
    
    // Handle space separately
    if (e.key === " ") return;
    
    // Find the letter mapping
    const letterMapping = selectedLanguage.letters.find(
      letter => letter.key === e.key
    );
    
    // If no mapping exists, prevent the key from being typed
    if (!letterMapping) {
      e.preventDefault();
      return;
    }
    
    // Replace the key with the conlang character
    e.preventDefault();
    setSentence(sentence + letterMapping.alphabet);
  };

  const submitSentence = async () => {
    if (!sentence.trim()) {
      toast.error("Please enter a sentence");
      return;
    }
    
    setLoading(true);
    try {
      const res = await axios.post("http://localhost:5000/parse-sentence", { sentence });
      
      if (res.data.unknown_words.length === 0) {
        toast.info("No unknown words found in this sentence");
        setShowForm(false);
      } else {
        setWordList(res.data.unknown_words);
        setCurrentIndex(0);
        setShowForm(true);
        toast.success(`Found ${res.data.unknown_words.length} word(s) to learn`);
      }
    } catch (err) {
      console.error(err);
      toast.error("Error contacting server. Is the backend running?");
    } finally {
      setLoading(false);
    }
  };

  const submitWordData = async () => {
    if (!meaning.trim()) {
      toast.error("Please enter a meaning for the word");
      return;
    }
    
    setLoading(true);
    const word = wordList[currentIndex];
    try {
      await axios.post("http://localhost:5000/submit-word", {
        word,
        meaning,
        type,
        context
      });

      toast.success(`Word "${word}" saved successfully`);

      // Reset form
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
      
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Select Conlang Script</CardTitle>
          <CardDescription>
            Choose the language script you want to use for typing
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLanguagesLoading ? (
            <div className="flex justify-center py-4">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
            </div>
          ) : languages.length > 0 ? (
            <Select
              value={selectedLanguage?.id || ""}
              onValueChange={handleLanguageChange}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a language" />
              </SelectTrigger>
              <SelectContent>
                {languages.map((lang) => (
                  <SelectItem key={lang.id} value={lang.id}>
                    {lang.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <div className="text-center p-4 bg-gray-50 rounded-md">
              <p className="text-gray-500">
                No languages available. 
                <a href="/create" className="text-indigo-600 ml-1 hover:underline">
                  Create one now
                </a>
              </p>
            </div>
          )}
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Enter a Sentence</CardTitle>
          <CardDescription>
            Type a sentence with words you want to teach the AI
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-2">
            <Textarea
              value={sentence}
              onChange={(e) => setSentence(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={selectedLanguage ? `Type in ${selectedLanguage.name}...` : "Select a language first"}
              className="min-h-[100px] font-mono"
              disabled={!selectedLanguage}
            />

            {selectedLanguage && (
              <div className="mt-2 p-3 bg-gray-50 rounded-md">
                <p className="text-sm text-gray-600 mb-2">Keyboard Mapping:</p>
                <div className="grid grid-cols-4 gap-2">
                  {selectedLanguage.letters.slice(0, 8).map((letter, index) => (
                    <div key={index} className="text-center">
                      <span className="text-xs text-gray-500">{letter.key}</span>
                      <span className="block">{letter.alphabet}</span>
                    </div>
                  ))}
                  {selectedLanguage.letters.length > 8 && (
                    <div className="text-center">
                      <span className="text-xs text-gray-500">...</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </CardContent>
        <CardFooter>
          <Button 
            onClick={submitSentence} 
            disabled={loading || !sentence.trim() || !selectedLanguage}
            className="w-full"
          >
            {loading && !showForm ? "Processing..." : "Analyze Sentence"}
          </Button>
        </CardFooter>
      </Card>

      {showForm && wordList.length > 0 && (
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Word: {wordList[currentIndex]}</CardTitle>
            <CardDescription>
              Word {currentIndex + 1} of {wordList.length}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Meaning:</label>
                <Input 
                  value={meaning} 
                  onChange={e => setMeaning(e.target.value)} 
                  placeholder="What does this word mean?"
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Type:</label>
                <Select value={type} onValueChange={setType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select word type" />
                  </SelectTrigger>
                  <SelectContent>
                    {wordTypes.map(t => (
                      <SelectItem key={t} value={t}>{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Context (optional):</label>
                <Textarea 
                  value={context} 
                  onChange={e => setContext(e.target.value)} 
                  placeholder="Add an example sentence or usage context"
                />
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button 
              onClick={submitWordData} 
              disabled={loading || !meaning.trim()}
              className="w-full"
            >
              {loading ? "Saving..." : "Save Word"}
            </Button>
          </CardFooter>
        </Card>
      )}
    </div>
  );
};

export default Train;
