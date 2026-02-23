import { DM_Sans, Rubik } from "next/font/google";

type CheckboxGroupProps = {
  title: string;
  options: string[];
};

const rubik = Rubik({
  subsets: ["latin"],
  variable: "--font-rubik",
});
const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
});

export default function CheckboxGroup({ title, options }: CheckboxGroupProps) {
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
          className="font-semibold text-gray-900 text-xl leading-none tracking-normal"
          style={{ fontFamily: "var(--font-dm-sans)" }}
        >
          {title}
        </h3>
        <button
          className="w-[40px] h-[24px] font-rubik font-normal text-[16px] leading-[1.5] tracking-[0.02em] text-black bg-transparent border-none p-0 cursor-pointer flex items-center justify-center"
          style={{ fontFamily: "var(--font-rubik)" }}
        >
          Clear
        </button>
      </div>
      <div className="space-y-2">
        {options.map((option) => (
          <label key={option} className="flex items-center space-x-3 cursor-pointer group">
            <input
              type="checkbox"
              className="
                w-[24px] h-[24px] 
                appearance-none 
                border-[1px] border-[#909090] 
                rounded-xs 
                checked:bg-teal-600 checked:border-teal-600
                relative cursor-pointer
                
              "
            />
            <span
              className="font-rubik font-normal text-[16px] leading-[24px] tracking-[0px] text-black text-center flex items-center justify-center"
              style={{ fontFamily: "var(--font-rubik)" }}
            >
              {option}
            </span>
          </label>
        ))}
      </div>
    </div>
  );
}
