
import React from "react";
import { ConlangLanguage } from "@/types/language";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface LanguageSelectorProps {
  languages: ConlangLanguage[];
  selectedLanguage: ConlangLanguage | null;
  onSelectLanguage: (value: string) => void;
  isLoading: boolean;
}

const LanguageSelector: React.FC<LanguageSelectorProps> = ({
  languages,
  selectedLanguage,
  onSelectLanguage,
  isLoading,
}) => {
  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>Select Conlang Script</CardTitle>
        <CardDescription>
          Choose the language script you want to use for typing
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center py-4">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
          </div>
        ) : languages.length > 0 ? (
          <Select
            value={selectedLanguage?.id || ""}
            onValueChange={onSelectLanguage}
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
  );
};

export default LanguageSelector;
