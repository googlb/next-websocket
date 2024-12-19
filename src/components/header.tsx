import { Unplug } from "lucide-react";
import Link from "next/link";

const Header = () => {
  return (
    <header>
      <div className="flex  items-center p-2 bg-blue-500 mb-4 text-white">
        <div className="mr-2 text-white">
          <Link href="/" >
          <Unplug />
          </Link>
        </div>

        <h1 className="text-2xl font-bold ">STOMP WebSocket Client</h1>
        <nav className="ml-auto">

          <Link href="/stomp" className="text-white px-2 hover:text-gray-200">
            SockJS
          </Link>
          <Link href="/about" className="text-white hover:text-gray-200">
            About
          </Link>
        </nav>
      </div>
    </header>
  );
};
export default Header;
