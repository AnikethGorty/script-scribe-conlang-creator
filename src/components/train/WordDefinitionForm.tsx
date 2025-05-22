
import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface WordDefinitionFormProps {
  currentWord: string;
  currentIndex: number;
  totalWords: number;
  meaning: string;
  setMeaning: (value: string) => void;
  type: string;
  setType: (value: string) => void;
  context: string;
  setContext: (value: string) => void;
  onSubmit: () => void;
  loading: boolean;
  wordTypes: string[];
}

const WordDefinitionForm: React.FC<WordDefinitionFormProps> = ({
  currentWord,
  currentIndex,
  totalWords,
  meaning,
  setMeaning,
  type,
  setType,
  context,
  setContext,
  onSubmit,
  loading,
  wordTypes
}) => {
  return (
    <Card className="mt-8">
      <CardHeader>
        <CardTitle>Word: {currentWord}</CardTitle>
        <CardDescription>
          Word {currentIndex + 1} of {totalWords}
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
          onClick={onSubmit} 
          disabled={loading || !meaning.trim()}
          className="w-full"
        >
          {loading ? "Saving..." : "Save Word"}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default WordDefinitionForm;
