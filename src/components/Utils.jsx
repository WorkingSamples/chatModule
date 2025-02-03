import { useEffect, useState } from "react";
import { getNameInitials } from "../utils/utilityFunction";

export const NameInitial = ({ id }) => {
    const [name, setName] = useState("");
    useEffect(() => {
      const getInitial = async () => {
        const data = await getNameInitials(id);
        setName(data);
      };
  
      getInitial();
    }, []);
  
    return (
      <div className="flex justify-center items-center h-full w-full">
        <p className="font-semibold text-black">{name}</p>
      </div>
    );
  };