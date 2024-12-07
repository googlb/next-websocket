const Footer = () => {
    return (
      <footer className="mt-6 mb-8">
        <div className="flex justify-center gap-4 px-4">
            <p className="text-sm">
              &copy; { new Date().getFullYear() } STOMP websocket. All rights reserved.
            </p>
            {/* <p className="text-sm">
              Made by Brody with Next.js
            </p> */}
        </div>
      </footer>
    );
  };
  
  export default Footer;