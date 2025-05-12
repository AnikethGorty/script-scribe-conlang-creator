
import { useState, useEffect, KeyboardEvent, ChangeEvent } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import { ConlangLanguage } from "@/types/language";
import { getLanguages } from "@/lib/languageStore";
import { Label } from "@/components/ui/label";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { Edit, Trash } from "lucide-react";
import DeleteScriptDialog from "@/components/DeleteScriptDialog";

const TypeInScript = () => {
  const navigate = useNavigate();
  const [languages, setLanguages] = useState<ConlangLanguage[]>([]);
  const [selectedLanguage, setSelectedLanguage] = useState<ConlangLanguage | null>(null);
  const [text, setText] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const loadLanguages = async () => {
    setIsLoading(true);
    try {
      const loadedLanguages = await getLanguages();
      setLanguages(loadedLanguages);
      
      // Select the first language if available
      if (loadedLanguages.length > 0) {
        setSelectedLanguage(loadedLanguages[0]);
      }
    } catch (error) {
      console.error("Failed to load languages:", error);
      toast.error("Failed to load languages. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadLanguages();
  }, []);

  const handleLanguageChange = (value: string) => {
    const selected = languages.find(lang => lang.id === value) || null;
    setSelectedLanguage(selected);
    setText("");
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (!selectedLanguage) return;
    
    // Allow special keys
    const specialKeys = [
      "Backspace", "Delete", "ArrowLeft", "ArrowRight", 
      "ArrowUp", "ArrowDown", "Tab", "Enter", "Escape",
      "Control", "Alt", "Shift", "Meta", "CapsLock", "Space"
    ];
    
    if (specialKeys.includes(e.key)) return;
    
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
    setText(text + letterMapping.alphabet);
  };

  const handleChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    // This will handle pasting and other changes
    setText(e.target.value);
  };

  const handleDeleteConfirmed = () => {
    loadLanguages();
  };

  const handleEditScript = () => {
    if (selectedLanguage) {
      navigate(`/edit/${selectedLanguage.id}`);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-100">
      <Navbar />
      
      <div className="container mx-auto px-4 py-10">
        <div className="max-w-3xl mx-auto bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold text-center text-indigo-900 mb-8">
            Type in Script
          </h1>
          
          <div className="mb-6">
            <div className="flex justify-between items-center mb-2">
              <Label htmlFor="language-select" className="text-lg block">
                Select Language
              </Label>
              
              {selectedLanguage && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm">
                      Options
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={handleEditScript} className="cursor-pointer">
                      <Edit className="mr-2 h-4 w-4" />
                      <span>Edit Script</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => setIsDeleteDialogOpen(true)}
                      className="text-red-500 cursor-pointer"
                    >
                      <Trash className="mr-2 h-4 w-4" />
                      <span>Delete Script</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
            
            {isLoading ? (
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
          </div>
          
          {selectedLanguage && (
            <>
              <div className="mb-6">
                <Label htmlFor="typing-area" className="text-lg mb-2 block">
                  Type in {selectedLanguage.name}
                </Label>
                <Textarea
                  id="typing-area"
                  value={text}
                  onChange={handleChange}
                  onKeyDown={handleKeyDown}
                  className="min-h-[200px] font-mono text-xl"
                  placeholder={`Start typing to use ${selectedLanguage.name}...`}
                />
              </div>
              
              <div className="border-t border-gray-200 pt-6">
                <h2 className="text-xl font-semibold text-indigo-800 mb-4">
                  Keyboard Mapping
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {selectedLanguage.letters.map((letter, index) => (
                    <div key={index} className="bg-gray-50 p-3 rounded-md text-center">
                      <span className="block text-gray-500 text-sm">Key: {letter.key}</span>
                      <span className="block font-bold text-lg">{letter.alphabet}</span>
                      {letter.ipa && (
                        <span className="block text-xs text-gray-400 mt-1">{letter.ipa}</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
      
      {selectedLanguage && (
        <DeleteScriptDialog
          isOpen={isDeleteDialogOpen}
          onClose={() => setIsDeleteDialogOpen(false)}
          languageId={selectedLanguage.id}
          languageName={selectedLanguage.name}
          onDeleted={handleDeleteConfirmed}
        />
      )}
    </div>
  );
};

export default TypeInScript;
