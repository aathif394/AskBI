// ScrollToBottom.tsx — Floating Button to Scroll

import { ChevronDown } from "lucide-react";
import { useEffect, useState } from "react";

export default function ScrollToBottom({ chatEndRef }: { chatEndRef: any }) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const threshold = 300;
      const isBottom =
        window.innerHeight + window.scrollY >=
        document.body.offsetHeight - threshold;
      setShow(!isBottom);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollDown = () => {
    chatEndRef?.current?.scrollIntoView({ behavior: "smooth" });
  };

  if (!show) return null;

  return (
    <button
      onClick={scrollDown}
      className="fixed bottom-28 right-6 p-2 rounded-full bg-blue-600 hover:bg-blue-700 text-white shadow-xl transition"
    >
      <ChevronDown className="w-5 h-5" />
    </button>
  );
}
