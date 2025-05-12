
export interface Letter {
  alphabet: string; // The conlang character
  key: string; // The key to press (latin script)
  ipa?: string; // Optional IPA representation
}

export interface ConlangLanguage {
  id: string; // Unique identifier
  name: string; // The name of the conlang
  letters: Letter[]; // Array of letter mappings
  createdAt: number; // Timestamp
}
