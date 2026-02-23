import { DM_Sans, Rubik } from "next/font/google";

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
});

type SelectionBoxProps = {
  title: string;
  options: string[];
};

const rubik = Rubik({
  subsets: ["latin"],
  variable: "--font-rubik",
});

export default function SelectionBox({ title, options }: SelectionBoxProps) {
  return (
    <div
      className="mb-6 first:border-t-0 border-black pt-4"
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
      <div className="flex flex-wrap gap-2">
        {options.map((option) => (
          <button
            key={option}
            style={{ fontFamily: "var(--font-rubik)" }}
            className="w-[93px] h-[40px] text-[16px] relative cursor-pointer border border-black rounded-sm text-sm text-gray-900 hover:bg-gray-50 transition-colors"
          >
            {option}
          </button>
        ))}
      </div>
    </div>
  );
}
