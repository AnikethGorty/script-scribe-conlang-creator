
import { Link } from "react-router-dom";
import Navbar from "@/components/Navbar";

const Index = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-100">
      <Navbar />
      
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-5xl font-bold text-indigo-900 mb-6">
            Create Your Own Language
          </h1>
          <p className="text-xl text-gray-700 mb-10">
            Design constructed languages with custom scripts and alphabets.
            Map your keyboard to type directly in your created script.
          </p>
          
          <div className="flex flex-col sm:flex-row justify-center gap-6">
            <Link
              to="/create"
              className="px-8 py-4 bg-indigo-600 text-white rounded-lg shadow-md hover:bg-indigo-700 transition-colors text-lg font-medium"
            >
              Create a Script
            </Link>
            <Link
              to="/type"
              className="px-8 py-4 bg-purple-600 text-white rounded-lg shadow-md hover:bg-purple-700 transition-colors text-lg font-medium"
            >
              Type in Script
            </Link>
            <Link>
              to="/train"
              className="px-8 py-4 bg-purple-600 text-white rounded-lg shadow-md hover:bg-purple-700 transition-colors text-lg font-medium"
            >
              Train An AI
            </Link>
          </div>
        </div>
        
        <div className="mt-20">
          <h2 className="text-2xl font-bold text-center text-indigo-900 mb-6">
            How It Works
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-xl font-semibold text-indigo-800 mb-3">
                1. Create a Script
              </h3>
              <p className="text-gray-700">
                Define your conlang's name, alphabet characters, and keyboard mapping.
                Optionally add IPA pronunciation.
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-xl font-semibold text-indigo-800 mb-3">
                2. Map Your Keyboard
              </h3>
              <p className="text-gray-700">
                Assign Latin script keys to your conlang's alphabet.
                Each keystroke will convert to your custom script.
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-xl font-semibold text-indigo-800 mb-3">
                3. Type in Your Language
              </h3>
              <p className="text-gray-700">
                Select your language and start typing.
                The keyboard will automatically convert your input to your conlang's script.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
