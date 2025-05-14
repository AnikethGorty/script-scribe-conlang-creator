
import React, { useState, useEffect } from 'react';
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

const wordTypes = ["verb", "adjective", "noun", "pronoun", "prefix", "preposition", "conjunction", "adverb", "article", "interjection"];

const Train = () => {
  const [sentence, setSentence] = useState("");
  const [wordList, setWordList] = useState<string[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);

  const [meaning, setMeaning] = useState("");
  const [type, setType] = useState(wordTypes[0]);
  const [context, setContext] = useState("");

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

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!showForm) {
        submitSentence();
      } else {
        submitWordData();
      }
    }
  };

  return (
    <div className="container mx-auto p-4 max-w-3xl">
      <h2 className="text-2xl font-bold mb-6">Train AI Vocabulary</h2>
      
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
              placeholder="Enter a sentence with words to learn"
              className="min-h-[100px]"
              onKeyDown={handleKeyPress}
            />
          </div>
        </CardContent>
        <CardFooter>
          <Button 
            onClick={submitSentence} 
            disabled={loading || !sentence.trim()}
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
                  onKeyDown={handleKeyPress}
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
