import React, { useState } from 'react';
import axios from 'axios';

const wordTypes = ["verb", "adjective", "noun", "pronoun", "prefix", "preposition", "conjunction"];

const Train = () => {
  const [sentence, setSentence] = useState("");
  const [wordList, setWordList] = useState<string[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showForm, setShowForm] = useState(false);

  const [meaning, setMeaning] = useState("");
  const [type, setType] = useState(wordTypes[0]);
  const [context, setContext] = useState("");

  const submitSentence = async () => {
    try {
      const res = await axios.post("http://localhost:5000/parse-sentence", { sentence });
      setWordList(res.data.unknown_words);
      setCurrentIndex(0);
      setShowForm(true);
    } catch (err) {
      alert("Error contacting server");
    }
  };

  const submitWordData = async () => {
    const word = wordList[currentIndex];
    await axios.post("http://localhost:5000/submit-word", {
      word,
      meaning,
      type,
      context
    });

    // Reset form
    setMeaning("");
    setType(wordTypes[0]);
    setContext("");

    if (currentIndex + 1 < wordList.length) {
      setCurrentIndex(currentIndex + 1);
    } else {
      setShowForm(false);
      alert("Training complete!");
    }
  };

  return (
    <div style={{ padding: "20px" }}>
      <h2>Train AI Vocabulary</h2>
      <input
        type="text"
        value={sentence}
        onChange={(e) => setSentence(e.target.value)}
        placeholder="Enter a sentence"
        style={{ width: "300px", marginRight: "10px" }}
      />
      <button onClick={submitSentence}>Submit</button>

      {showForm && wordList.length > 0 && (
        <div style={{
          marginTop: "30px",
          padding: "20px",
          border: "1px solid #ccc",
          width: "400px",
          backgroundColor: "#f8f8f8"
        }}>
          <h3>Word: {wordList[currentIndex]}</h3>
          <label>Meaning:</label><br />
          <input value={meaning} onChange={e => setMeaning(e.target.value)} style={{ width: "100%" }} /><br /><br />
          
          <label>Type:</label><br />
          <select value={type} onChange={e => setType(e.target.value)} style={{ width: "100%" }}>
            {wordTypes.map(t => <option key={t}>{t}</option>)}
          </select><br /><br />
          
          <label>Context:</label><br />
          <input value={context} onChange={e => setContext(e.target.value)} style={{ width: "100%" }} /><br /><br />

          <button onClick={submitWordData}>Submit Word</button>
        </div>
      )}
    </div>
  );
};

export default Train;
