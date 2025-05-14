
import React, { KeyboardEvent, ChangeEvent } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ConlangLanguage } from "@/types/language";

interface ConlangTypingAreaProps {
  selectedLanguage: ConlangLanguage | null;
  sentence: string;
  setSentence: (value: string) => void;
  handleSubmit: () => void;
  loading: boolean;
}

const ConlangTypingArea: React.FC<ConlangTypingAreaProps> = ({
  selectedLanguage,
  sentence,
  setSentence,
  handleSubmit,
  loading
}) => {
  
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

  return (
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
          onClick={handleSubmit} 
          disabled={loading || !sentence.trim() || !selectedLanguage}
          className="w-full"
        >
          {loading && !sentence.includes(" ") ? "Processing..." : "Analyze Sentence"}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default ConlangTypingArea;
