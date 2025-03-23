const Footer = () => {
  return (
    <footer className="footer footer-center p-4 bg-base-200 text-base-content border-t border-base-300">
      <div className="w-full max-w-4xl mx-auto">
        <p className="font-semibold mb-4">Credits</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <p className="font-medium mb-2">Backend</p>
            <p>Soni Bhavya</p>
            <p>Assad</p>
          </div>
          <div className="text-center">
            <p className="font-medium mb-2">Frontend</p>
            <p>Madeeha</p>
            <p>Haijra</p>
            <p>Amit Barman</p>
          </div>
          <div className="text-center">
            <p className="font-medium mb-2">Deployment</p>
            <p>Soni Bhavya</p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer; 