import { DM_Sans, Rubik } from "next/font/google";

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
});

type SliderProps = {
  title: string;
};

const rubik = Rubik({
  subsets: ["latin"],
  variable: "--font-rubik",
});

export default function SliderFilter({ title }: SliderProps) {
  return (
    <div
      className="mb-6 border-t border-black pt-4"
      style={
        {
          "--font-rubik": rubik.style.fontFamily,
          "--font-dm-sans": dmSans.style.fontFamily,
        } as React.CSSProperties
      }
    >
      <div className="flex justify-between items-center mb-3">
        <h3
          className="font-sans font-semibold text-gray-900 text-xl"
          style={{ fontFamily: "var(--font-dm-sans)" }}
        >
          {title}
        </h3>
        <button
          className="text-black cursor-pointer flex items-center justify-center"
          style={{ fontFamily: "var(--font-rubik)" }}
        >
          Clear
        </button>
      </div>
      {/* <input
        type="range"
        className="w-full h-[4px] bg-gray-200 rounded appearance-none cursor-pointer accent-teal-600 items-center justify-center"
      /> */}
      <input
        type="range"
        className="w-full h-[4px] bg-gray-200 rounded-lg appearance-none cursor-pointer
        [&::-webkit-slider-thumb]:appearance-none
        [&::-webkit-slider-thumb]:w-[20px] 
        [&::-webkit-slider-thumb]:h-[20px]
        [&::-webkit-slider-thumb]:bg-[#3B9A9A]
        [&::-webkit-slider-thumb]:rounded-full
        [&::-webkit-slider-thumb]:border-none
        
        [&::-moz-range-thumb]:w-[20px]
        [&::-moz-range-thumb]:h-[20px]
        [&::-moz-range-thumb]:bg-[#3B9A9A]
        [&::-moz-range-thumb]:border-none
        [&::-moz-range-thumb]:rounded-full"
      />
      <div className="text-black cursor-pointer flex " style={{ fontFamily: "var(--font-rubik)" }}>
        Low
      </div>
    </div>
  );
}
