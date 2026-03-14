// app/_components/Button.js
import React from "react";

const Button = ({ children, onClick }) => {
  return (
    <button
      onClick={onClick}
      className="bg-[#0f6574] text-white p-2 rounded m-2 hover:bg-[#0d4957]"
    >
      {children}
    </button>
  );
};

export default Button;
