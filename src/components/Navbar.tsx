
import { Link } from "react-router-dom";

const Navbar = () => {
  return (
    <nav className="bg-indigo-900 text-white shadow-lg">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center py-4">
          <Link to="/" className="text-xl font-bold">
            ConLang Creator
          </Link>
          <div className="space-x-4">
            <Link to="/create" className="hover:text-indigo-200 transition-colors">
              Create a Script
            </Link>
            <Link to="/type" className="hover:text-indigo-200 transition-colors">
              Type in Script
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
