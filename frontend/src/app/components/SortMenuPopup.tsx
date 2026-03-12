"use client";

import { DM_Sans, Rubik } from "next/font/google";
import React, { useState } from "react";

// 1. Initialize the Rubik font

const rubik = Rubik({
  subsets: ["latin"],
  variable: "--font-rubik",
});

const sortOptions = [
  "NPO Name A-Z",
  "NPO Name Z-A",
  "Location Closest To Me",
  "Location Furthest From Me",
  "Size - Smallest to Largest",
  "Size - Largest to Smallest",
];

export default function SortMenu() {
  const [selected, setSelected] = useState(sortOptions[0]);

  return (
    <div
      // 2. Add the font variable to the wrapper class
      className={`bg-white border border-gray-300 shadow-md p-6 flex flex-col box-border ${rubik.variable}`}
      style={{
        width: "267px",
        height: "337px",
        borderRadius: "28px",
        // 3. Apply the font family to the whole container
        fontFamily: "var(--font-rubik)",
      }}
    >
      <h2 className="text-black text-lg mb-4">Sort By:</h2>

      <div className="flex flex-col h-full justify-between pb-1">
        {sortOptions.map((option) => (
          <button
            key={option}
            onClick={() => setSelected(option)}
            className={`flex items-center justify-between w-full text-left text-[15px] transition-colors duration-150 ${
              selected === option ? "text-[#3B9A9A]" : "text-gray-800 hover:text-[#3B9A9A]"
            }`}
          >
            <span>{option}</span>

            {selected === option && (
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

// "use client";

// import { Rubik } from "next/font/google";
// import React, { useState } from "react";

// const rubik = Rubik({
//   subsets: ["latin"],
//   variable: "--font-rubik",
// });

// const sortOptions = [
//   "NPO Name A-Z",
//   "NPO Name Z-A",
//   "Location Closest To Me",
//   "Location Furthest From Me",
//   "Size - Smallest to Largest",
//   "Size - Largest to Smallest",
// ];

// export default function SortMenu() {
//   const [selected, setSelected] = useState(sortOptions[0]);

//   return (
//     <div
//       className={`bg-white border border-gray-300 shadow-md p-6 flex flex-col box-border ${rubik.variable}`}
//       style={{
//         width: "267px",
//         height: "337px",
//         borderRadius: "28px",
//       }}
//     >
//       {/* "Sort By" Header with your exact specs */}
//       <h2
//         style={{
//           fontFamily: "'Proxima Nova', sans-serif",
//           fontWeight: 600,
//           fontSize: "18px",
//           lineHeight: "100%",
//           letterSpacing: "0%",
//         }}
//         className="text-black mb-4"
//       >
//         Sort By:
//       </h2>

//       {/* Options List in Rubik */}
//       <div
//         className="flex flex-col h-full justify-between pb-1"
//         style={{ fontFamily: "var(--font-rubik)" }}
//       >
//         {sortOptions.map((option) => (
//           <button
//             key={option}
//             onClick={() => setSelected(option)}
//             className={`flex items-center justify-between w-full text-left text-[15px] transition-colors duration-150 ${
//               selected === option ? "text-[#3B9A9A]" : "text-gray-800 hover:text-[#3B9A9A]"
//             }`}
//           >
//             <span>{option}</span>

//             {selected === option && (
//               <svg
//                 width="18"
//                 height="18"
//                 viewBox="0 0 24 24"
//                 fill="none"
//                 stroke="currentColor"
//                 strokeWidth="2.5"
//                 strokeLinecap="round"
//                 strokeLinejoin="round"
//               >
//                 <polyline points="20 6 9 17 4 12"></polyline>
//               </svg>
//             )}
//           </button>
//         ))}
//       </div>
//     </div>
//   );
// }
