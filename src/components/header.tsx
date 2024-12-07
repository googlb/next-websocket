import { Unplug } from "lucide-react";

const Header = () => {
  return (
    <header>
      <div className="flex  items-center p-2 bg-blue-500 mb-4 text-white">
        <div className="mr-2 text-white">
          <Unplug />
        </div>

        <h1 className="text-2xl font-bold ">STOMP WebSocket Client</h1>
      </div>
    </header>
  );
};
export default Header;
