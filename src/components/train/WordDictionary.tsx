
import React, { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { getWords } from "@/services/trainingService";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Search, Database } from "lucide-react";
import { toast } from "@/components/ui/sonner";
import { 
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetClose
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";

interface Word {
  word: string;
  meaning: string;
  type: string;
  context: string;
  source?: string;  // Added to track which database the word comes from
}

interface WordDictionaryProps {
  isOpen: boolean;
  onClose: () => void;
}

const WordDictionary: React.FC<WordDictionaryProps> = ({
  isOpen,
  onClose
}) => {
  const [words, setWords] = useState<Word[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [dataSource, setDataSource] = useState<string | null>(null);

  useEffect(() => {
    // When the dictionary is opened, load the words
    if (isOpen) {
      loadWords();
    }
  }, [isOpen]);

  const loadWords = async () => {
    setIsLoading(true);
    try {
      const response = await getWords();
      if (response && response.words) {
        setWords(response.words);
        setDataSource(response.source || null);
      }
    } catch (error) {
      console.error("Error loading words:", error);
      toast.error("Failed to load words from database");
    } finally {
      setIsLoading(false);
    }
  };

  // Filter words based on search term
  const filteredWords = words.filter(word => {
    if (!searchTerm) return true;
    
    const searchLower = searchTerm.toLowerCase();
    return (
      word.word.toLowerCase().includes(searchLower) ||
      word.meaning.toLowerCase().includes(searchLower) ||
      word.type.toLowerCase().includes(searchLower) ||
      (word.context && word.context.toLowerCase().includes(searchLower))
    );
  });

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="w-full sm:max-w-md md:max-w-xl">
        <SheetHeader className="mb-4">
          <SheetTitle>Word Dictionary</SheetTitle>
          <SheetDescription>
            Browse all saved words or search for specific terms
          </SheetDescription>
          {dataSource && (
            <Badge variant="outline" className="mt-2 flex items-center gap-1 w-fit">
              <Database className="h-3 w-3" /> 
              {dataSource === "mongodb" ? "MongoDB" : "Local SQLite"}
            </Badge>
          )}
        </SheetHeader>

        <div className="flex items-center space-x-2 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search words, meanings, or context..."
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setSearchTerm("")}
            disabled={!searchTerm}
          >
            Clear
          </Button>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-8">
            <p>Loading words...</p>
          </div>
        ) : words.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">No words found in the dictionary</p>
          </div>
        ) : (
          <ScrollArea className="h-[500px] rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Word</TableHead>
                  <TableHead>Meaning</TableHead>
                  <TableHead>Type</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredWords.map((word, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">{word.word}</TableCell>
                    <TableCell>{word.meaning}</TableCell>
                    <TableCell>{word.type}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {filteredWords.length === 0 && (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No matching words found</p>
              </div>
            )}
          </ScrollArea>
        )}
        
        <div className="mt-6 flex justify-end">
          <SheetClose asChild>
            <Button onClick={onClose}>Close</Button>
          </SheetClose>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default WordDictionary;
