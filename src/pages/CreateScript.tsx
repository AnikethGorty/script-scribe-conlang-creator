
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import { ConlangLanguage, Letter } from "@/types/language";
import { saveLanguage } from "@/lib/languageStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { X } from "lucide-react";

const CreateScript = () => {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [letters, setLetters] = useState<Letter[]>([]);
  const [currentAlphabet, setCurrentAlphabet] = useState("");
  const [currentKey, setCurrentKey] = useState("");
  const [currentIpa, setCurrentIpa] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const addLetter = () => {
    if (!currentAlphabet || !currentKey) {
      toast.error("Alphabet and key are required");
      return;
    }

    if (letters.some(letter => letter.key === currentKey)) {
      toast.error("This key is already mapped");
      return;
    }

    const newLetter: Letter = {
      alphabet: currentAlphabet,
      key: currentKey,
      ...(currentIpa ? { ipa: currentIpa } : {})
    };

    setLetters([...letters, newLetter]);
    setCurrentAlphabet("");
    setCurrentKey("");
    setCurrentIpa("");
  };

  const removeLetter = (index: number) => {
    setLetters(letters.filter((_, i) => i !== index));
  };

  const handleKeyInput = (e: React.KeyboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const key = e.key;
    
    // Filter out special keys like Shift, Alt, etc.
    if (key.length === 1) {
      setCurrentKey(key);
    }
  };

  const saveConlang = async () => {
    if (!name) {
      toast.error("Language name is required");
      return;
    }

    if (letters.length === 0) {
      toast.error("At least one letter mapping is required");
      return;
    }

    setIsLoading(true);

    try {
      const newLanguage = {
        name,
        letters
      };

      const result = await saveLanguage(newLanguage);
      
      if (result) {
        toast.success("Language created successfully!");
        navigate('/type'); // Navigate to the type page after successful creation
      } else {
        toast.error("Failed to create language. Please try again.");
      }
    } catch (error) {
      console.error("Error saving language:", error);
      toast.error("An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-100">
      <Navbar />
      
      <div className="container mx-auto px-4 py-10">
        <div className="max-w-3xl mx-auto bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold text-center text-indigo-900 mb-8">
            Create a Script
          </h1>
          
          <div className="mb-6">
            <Label htmlFor="name" className="text-lg">Language Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1"
              placeholder="Enter the name of your conlang"
            />
          </div>
          
          <div className="border-t border-gray-200 pt-6 mb-6">
            <h2 className="text-xl font-semibold text-indigo-800 mb-4">
              Add Letters
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div>
                <Label htmlFor="alphabet" className="block mb-1">
                  Alphabet (Character)
                </Label>
                <Input
                  id="alphabet"
                  value={currentAlphabet}
                  onChange={(e) => setCurrentAlphabet(e.target.value)}
                  placeholder="e.g. ts"
                />
              </div>
              
              <div>
                <Label htmlFor="key" className="block mb-1">
                  Key (Press a key)
                </Label>
                <Input
                  id="key"
                  value={currentKey}
                  onKeyDown={handleKeyInput}
                  readOnly
                  placeholder="Press any key"
                />
              </div>
              
              <div>
                <Label htmlFor="ipa" className="block mb-1">
                  IPA (Optional)
                </Label>
                <Input
                  id="ipa"
                  value={currentIpa}
                  onChange={(e) => setCurrentIpa(e.target.value)}
                  placeholder="e.g. /t͡s/"
                />
              </div>
            </div>
            
            <Button 
              onClick={addLetter}
              className="w-full md:w-auto bg-indigo-600 hover:bg-indigo-700"
            >
              Add Letter
            </Button>
          </div>
          
          {letters.length > 0 && (
            <div className="border-t border-gray-200 pt-6 mb-8">
              <h2 className="text-xl font-semibold text-indigo-800 mb-4">
                Letter Mappings
              </h2>
              
              <div className="bg-gray-50 rounded-md p-4">
                <div className="grid grid-cols-4 gap-2 font-semibold text-gray-700 mb-2 px-2">
                  <div>Alphabet</div>
                  <div>Key</div>
                  <div>IPA</div>
                  <div></div>
                </div>
                
                <div className="space-y-2">
                  {letters.map((letter, index) => (
                    <div key={index} className="grid grid-cols-4 gap-2 items-center bg-white p-2 rounded">
                      <div className="font-medium">{letter.alphabet}</div>
                      <div className="px-2 py-1 bg-indigo-100 rounded text-center">
                        {letter.key}
                      </div>
                      <div className="text-gray-600">{letter.ipa || "-"}</div>
                      <div className="text-right">
                        <button 
                          onClick={() => removeLetter(index)}
                          className="text-red-500 hover:text-red-700 focus:outline-none"
                          aria-label="Remove letter"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
          
          <div className="mt-8">
            <Button 
              onClick={saveConlang}
              disabled={isLoading}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-lg py-6"
            >
              {isLoading ? "Creating..." : "Create Language"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateScript;
