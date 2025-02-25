import React, { useState } from "react";
import { FaEye, FaEyeSlash } from "react-icons/fa";

const InputField = ({ type, name, placeholder, onChange, value }) => {
  const [toggle, setToggle] = useState(false);

  return (
    <div className="relative">
      <input
        className="w-full border border-gray-300 rounded-md p-3 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
        name={name}
        type={name === "password" ? (toggle ? "text" : "password") : type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
      />
      {name === "password" &&
        (!toggle ? (
          <FaEyeSlash
            className="absolute right-2 top-4 cursor-pointer"
            onClick={() => setToggle((prev) => !prev)}
          />
        ) : (
          <FaEye
            className="absolute right-2 top-4 cursor-pointer"
            onClick={() => setToggle((prev) => !prev)}
          />
        ))}
    </div>
  );
};

export default InputField;
