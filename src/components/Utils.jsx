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

export const ExpandableMessage = ({ messageText }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const MAX_LINES = 5;
  
  // Calculate if message needs expansion
  // This is a rough estimation - actual line breaks depend on container width
  const words = messageText.split(' ');
  const isLongMessage = words.length > 50; // Approximate 50 words threshold (adjust as needed)
  
  const toggleExpand = (e) => {
    e.stopPropagation(); // Prevent message click events from triggering
    setIsExpanded(!isExpanded);
  };
  
  if (!isLongMessage) {
    return <p className="text-sm">{messageText}</p>;
  }
  
  return (
    <>
      <p className="text-sm">
        {isExpanded ? (
          messageText
        ) : (
          <>
            {words.slice(0, 50).join(' ')}...
          </>
        )}
      </p>
      <span 
        className="text-xs font-medium cursor-pointer underline mt-1 block"
        onClick={toggleExpand}
      >
        {isExpanded ? 'Read less' : 'Read more'}
      </span>
    </>
  );
};
