import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

export function SearchIcon(props: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </svg>
  );
}

export function ManageSearchIcon(props: IconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="18"
      height="18"
      viewBox="0 0 18 18"
      fill="none"
      aria-hidden="true"
      {...props}
    >
      <path
        d="M6.5 13C4.68333 13 3.146 12.3707 1.888 11.112C0.63 9.85333 0.000667196 8.316 5.29101e-07 6.5C-0.000666138 4.684 0.628667 3.14667 1.888 1.888C3.14733 0.629333 4.68467 0 6.5 0C8.31533 0 9.853 0.629333 11.113 1.888C12.373 3.14667 13.002 4.684 13 6.5C13 7.23333 12.8833 7.925 12.65 8.575C12.4167 9.225 12.1 9.8 11.7 10.3L17.3 15.9C17.4833 16.0833 17.575 16.3167 17.575 16.6C17.575 16.8833 17.4833 17.1167 17.3 17.3C17.1167 17.4833 16.8833 17.575 16.6 17.575C16.3167 17.575 16.0833 17.4833 15.9 17.3L10.3 11.7C9.8 12.1 9.225 12.4167 8.575 12.65C7.925 12.8833 7.23333 13 6.5 13ZM6.5 11C7.75 11 8.81267 10.5627 9.688 9.688C10.5633 8.81333 11.0007 7.75067 11 6.5C10.9993 5.24933 10.562 4.187 9.688 3.313C8.814 2.439 7.75133 2.00133 6.5 2C5.24867 1.99867 4.18633 2.43633 3.313 3.313C2.43967 4.18967 2.002 5.252 2 6.5C1.998 7.748 2.43567 8.81067 3.313 9.688C4.19033 10.5653 5.25267 11.0027 6.5 11Z"
        fill="#6C6C6C"
      />
    </svg>
  );
}

export function FilterIcon(props: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      <path d="M4 6h16" />
      <path d="M7 12h10" />
      <path d="M10 18h4" />
    </svg>
  );
}

export function TuneFilterIcon(props: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      <path d="M4 7h7" />
      <path d="M15 7h5" />
      <circle cx="13" cy="7" r="2" />
      <path d="M4 17h5" />
      <path d="M13 17h7" />
      <circle cx="11" cy="17" r="2" />
    </svg>
  );
}

export function ManageFilterIcon(props: IconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
      aria-hidden="true"
      {...props}
    >
      <g clipPath="url(#clip0_4919_820)">
        <path
          d="M19.1667 9.58281H6.92298M2.60127 9.58281H0.833344M2.60127 9.58281C2.60127 9.00711 2.82888 8.45498 3.23403 8.0479C3.63917 7.64082 4.18867 7.41212 4.76163 7.41212C5.3346 7.41212 5.88409 7.64082 6.28924 8.0479C6.69438 8.45498 6.92199 9.00711 6.92199 9.58281C6.92199 10.1585 6.69438 10.7106 6.28924 11.1177C5.88409 11.5248 5.3346 11.7535 4.76163 11.7535C4.18867 11.7535 3.63917 11.5248 3.23403 11.1177C2.82888 10.7106 2.60127 10.1585 2.60127 9.58281ZM19.1667 16.1616H13.4705M13.4705 16.1616C13.4705 16.7375 13.2423 17.2902 12.8371 17.6974C12.4318 18.1046 11.8822 18.3333 11.3091 18.3333C10.7361 18.3333 10.1867 18.1036 9.7815 17.6965C9.37636 17.2895 9.14875 16.7373 9.14875 16.1616M13.4705 16.1616C13.4705 15.5858 13.2423 15.034 12.8371 14.6268C12.4318 14.2197 11.8822 13.9909 11.3091 13.9909C10.7361 13.9909 10.1867 14.2196 9.7815 14.6267C9.37636 15.0338 9.14875 15.5859 9.14875 16.1616M9.14875 16.1616H0.833344M19.1667 3.00401H16.0897M11.7679 3.00401H0.833344M11.7679 3.00401C11.7679 2.42831 11.9955 1.87618 12.4007 1.4691C12.8058 1.06201 13.3553 0.833313 13.9283 0.833313C14.212 0.833313 14.4929 0.88946 14.755 0.998548C15.0171 1.10764 15.2553 1.26753 15.4559 1.4691C15.6565 1.67066 15.8156 1.90996 15.9242 2.17332C16.0328 2.43668 16.0887 2.71895 16.0887 3.00401C16.0887 3.28907 16.0328 3.57134 15.9242 3.8347C15.8156 4.09806 15.6565 4.33736 15.4559 4.53892C15.2553 4.74049 15.0171 4.90038 14.755 5.00947C14.4929 5.11856 14.212 5.17471 13.9283 5.17471C13.3553 5.17471 12.8058 4.94601 12.4007 4.53892C11.9955 4.13184 11.7679 3.57971 11.7679 3.00401Z"
          stroke="#4F4F4F"
          strokeWidth="1.5"
          strokeMiterlimit="10"
          strokeLinecap="round"
        />
      </g>
      <defs>
        <clipPath id="clip0_4919_820">
          <rect width="20" height="20" fill="white" />
        </clipPath>
      </defs>
    </svg>
  );
}

export function ChevronRightIcon(props: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      <path d="m9 18 6-6-6-6" />
    </svg>
  );
}

export function ManageCaretIcon(props: IconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      {...props}
    >
      <path d="M10 17L15 12L10 7V17Z" fill="black" />
    </svg>
  );
}

export function TagFilledIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
      <path d="M11.37 3.5H6.75A3.25 3.25 0 0 0 3.5 6.75v4.62a3.2 3.2 0 0 0 .95 2.3l5.88 5.88a2.4 2.4 0 0 0 3.4 0l5.82-5.82a2.4 2.4 0 0 0 0-3.4l-5.88-5.88a3.2 3.2 0 0 0-2.3-.95Zm-2.62 5.75a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3Z" />
    </svg>
  );
}

export function ManageTagFillIcon(props: IconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="19"
      height="19"
      viewBox="0 0 19 19"
      fill="none"
      aria-hidden="true"
      {...props}
    >
      <path
        d="M17.0367 9.19519C16.8886 8.89521 16.6844 8.62646 16.435 8.40352L10.8933 2.86185C10.5566 2.52215 10.1558 2.25274 9.71412 2.06927C9.27243 1.8858 8.79869 1.79192 8.32041 1.7931H4.42541C4.08062 1.79206 3.73902 1.85907 3.42018 1.99029C3.10135 2.12152 2.81154 2.31437 2.56737 2.5578C2.3232 2.80123 2.12948 3.09046 1.99729 3.4089C1.86511 3.72734 1.79707 4.06873 1.79707 4.41352V8.30852C1.79572 8.788 1.88948 9.26299 2.07294 9.70599C2.25639 10.149 2.52588 10.5512 2.86582 10.8894L8.40749 16.431C8.65194 16.6757 8.94256 16.8695 9.26249 17.001C9.57995 17.1364 9.92195 17.2069 10.2679 17.2069C10.9659 17.1986 11.6321 16.9139 12.1204 16.4152L14.2817 14.2619L16.435 12.1085C16.6797 11.8641 16.8735 11.5734 17.005 11.2535C17.2689 10.6092 17.2689 9.88698 17.005 9.24269L17.0367 9.19519ZM7.24374 9.41685C6.79436 9.41685 6.35508 9.2836 5.98144 9.03394C5.6078 8.78428 5.31658 8.42943 5.14461 8.01426C4.97264 7.59909 4.92764 7.14225 5.01531 6.70151C5.10298 6.26077 5.31938 5.85592 5.63713 5.53816C5.95489 5.22041 6.35974 5.00401 6.80048 4.91634C7.24122 4.82867 7.69806 4.87367 8.11323 5.04564C8.5284 5.21761 8.88325 5.50883 9.13291 5.88247C9.38257 6.25611 9.51582 6.69539 9.51582 7.14477C9.51791 7.44485 9.46074 7.74239 9.34758 8.02032C9.23443 8.29826 9.06753 8.55112 8.85644 8.76442C8.64536 8.97771 8.39424 9.14723 8.1175 9.26327C7.84075 9.37931 7.54382 9.43957 7.24374 9.4406V9.41685Z"
        fill="#2C7D7D"
      />
    </svg>
  );
}

export function PublicGlobeIcon(props: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      <circle cx="12" cy="12" r="8" />
      <path d="M4.5 12h15" />
      <path d="M12 4a11.7 11.7 0 0 1 0 16" />
      <path d="M12 4a11.7 11.7 0 0 0 0 16" />
    </svg>
  );
}

export function ManagePublishedIcon(props: IconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="19"
      height="19"
      viewBox="0 0 19 19"
      fill="none"
      aria-hidden="true"
      {...props}
    >
      <path
        d="M9.49998 1.58331C5.12998 1.58331 1.58331 5.12998 1.58331 9.49998C1.58331 13.87 5.12998 17.4166 9.49998 17.4166C13.87 17.4166 17.4166 13.87 17.4166 9.49998C17.4166 5.12998 13.87 1.58331 9.49998 1.58331ZM8.70831 15.7779C5.58123 15.39 3.16665 12.73 3.16665 9.49998C3.16665 9.00915 3.22998 8.54206 3.3329 8.0829L7.12498 11.875V12.6666C7.12498 13.5375 7.83748 14.25 8.70831 14.25V15.7779ZM14.1708 13.7671C13.965 13.1258 13.3791 12.6666 12.6666 12.6666H11.875V10.2916C11.875 9.85623 11.5187 9.49998 11.0833 9.49998H6.33331V7.91665H7.91665C8.35206 7.91665 8.70831 7.5604 8.70831 7.12498V5.54165H10.2916C11.1625 5.54165 11.875 4.82915 11.875 3.95831V3.63373C14.1946 4.57581 15.8333 6.8479 15.8333 9.49998C15.8333 11.1466 15.2 12.6429 14.1708 13.7671Z"
        fill="#3B9A9A"
        fillOpacity="0.5"
      />
    </svg>
  );
}

export function LockIcon(props: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      <rect x="5.5" y="10.5" width="13" height="9" rx="2" />
      <path d="M8.5 10.5V8a3.5 3.5 0 1 1 7 0v2.5" />
    </svg>
  );
}

export function ManageDraftLockIcon(props: IconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="19"
      height="19"
      viewBox="0 0 19 19"
      fill="none"
      aria-hidden="true"
      {...props}
    >
      <path
        d="M4.75002 17.4167C4.3146 17.4167 3.94199 17.2618 3.63219 16.952C3.32238 16.6422 3.16721 16.2693 3.16669 15.8334V7.91669C3.16669 7.48127 3.32185 7.10866 3.63219 6.79885C3.94252 6.48905 4.31513 6.33388 4.75002 6.33335H5.54169V4.75002C5.54169 3.65488 5.92776 2.72151 6.6999 1.9499C7.47203 1.17828 8.40541 0.792215 9.50002 0.791688C10.5946 0.79116 11.5283 1.17723 12.3009 1.9499C13.0736 2.72256 13.4594 3.65594 13.4584 4.75002V6.33335H14.25C14.6854 6.33335 15.0583 6.48852 15.3686 6.79885C15.679 7.10919 15.8339 7.4818 15.8334 7.91669V15.8334C15.8334 16.2688 15.6785 16.6416 15.3686 16.952C15.0588 17.2623 14.686 17.4172 14.25 17.4167H4.75002ZM10.6186 12.9936C10.9285 12.6833 11.0834 12.3104 11.0834 11.875C11.0834 11.4396 10.9285 11.067 10.6186 10.7572C10.3088 10.4474 9.93596 10.2922 9.50002 10.2917C9.06408 10.2912 8.69146 10.4463 8.38219 10.7572C8.07291 11.068 7.91774 11.4407 7.91669 11.875C7.91563 12.3094 8.0708 12.6823 8.38219 12.9936C8.69358 13.305 9.06619 13.4599 9.50002 13.4584C9.93385 13.4568 10.3067 13.3019 10.6186 12.9936ZM7.12502 6.33335H11.875V4.75002C11.875 4.0903 11.6441 3.52953 11.1823 3.06773C10.7205 2.60592 10.1597 2.37502 9.50002 2.37502C8.8403 2.37502 8.27953 2.60592 7.81773 3.06773C7.35592 3.52953 7.12502 4.0903 7.12502 4.75002V6.33335Z"
        fill="#3B9A9A"
        fillOpacity="0.5"
      />
    </svg>
  );
}

export function PlusSmallIcon(props: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      <path d="M12 7v10" />
      <path d="M7 12h10" />
    </svg>
  );
}

export function ManageAddIcon(props: IconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
      aria-hidden="true"
      {...props}
    >
      <rect x="0.5" y="0.5" width="19" height="19" rx="2.61475" stroke="#3B9A9A" />
      <path
        d="M9.32333 10.1772H5.26318V8.82382H9.32333V4.76367H10.6767V8.82382H14.7369V10.1772H10.6767V14.2374H9.32333V10.1772Z"
        fill="#3B9A9A"
      />
    </svg>
  );
}

export function ManageEyeIcon(props: IconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="21"
      height="15"
      viewBox="0 0 21 15"
      fill="none"
      aria-hidden="true"
      {...props}
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M13.5 7.5C13.5 9.157 12.157 10.5 10.5 10.5C8.843 10.5 7.5 9.157 7.5 7.5C7.5 5.843 8.843 4.5 10.5 4.5C12.157 4.5 13.5 5.843 13.5 7.5ZM10.5 12.5C7.739 12.5 5.5 10.262 5.5 7.5C5.5 4.739 7.739 2.5 10.5 2.5C13.262 2.5 15.5 4.739 15.5 7.5C15.5 10.262 13.262 12.5 10.5 12.5ZM10.5 0C6.358 0 1.729 3.417 0 7.5C1.729 11.583 6.358 15 10.5 15C14.642 15 19.271 11.583 21 7.5C19.271 3.417 14.642 0 10.5 0Z"
        fill="#6C6C6C"
      />
    </svg>
  );
}

export function ManageEditIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <path d="M4.5 19.5H19.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path
        d="M7 16.5L8.1 12.9L15.9 5.1C16.5 4.5 17.5 4.5 18.1 5.1L18.9 5.9C19.5 6.5 19.5 7.5 18.9 8.1L11.1 15.9L7 16.5Z"
        fill="currentColor"
      />
      <path d="M14.9 6.1L17.9 9.1" stroke="#F2F9F8" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}

export function EditPencilIcon(props: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      <path d="m4.5 19.5 4.1-.7 8.2-8.2a1.8 1.8 0 0 0-2.55-2.55L6.05 16.25l-.7 4.1h-.85Z" />
      <path d="m12.9 5.4 5.7 5.7" />
    </svg>
  );
}

export function SortArrowIcon(props: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      <path d="m12 5 5 5" />
      <path d="m12 5-5 5" />
      <path d="M12 5v14" />
    </svg>
  );
}

export function ManageSortIcon(props: IconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="13"
      height="15"
      viewBox="0 0 13 15"
      fill="none"
      aria-hidden="true"
      {...props}
    >
      <path
        d="M7 -2.72274e-05L7 12.25L12.25 6.99997L13 7.65997L6.5 14.16L5.68248e-07 7.65997L0.750001 6.99997L6 12.25L6 -2.73148e-05L7 -2.72274e-05Z"
        fill="black"
      />
    </svg>
  );
}

export function LeafIcon(props: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      <path d="M6 14c0-5 4-8 12-8 0 8-3 12-8 12-3 0-4-2-4-4Z" />
      <path d="M8 16c3-3 6-5 10-7" />
    </svg>
  );
}

export function PeopleIcon(props: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      <circle cx="9" cy="8" r="3" />
      <circle cx="17" cy="10" r="2" />
      <path d="M4 18c0-2.8 2.2-5 5-5s5 2.2 5 5" />
      <path d="M14 18c0-1.9 1.4-3.4 3.2-3.8" />
    </svg>
  );
}

export function MoneyIcon(props: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      <rect x="3" y="6" width="18" height="12" rx="2" />
      <circle cx="12" cy="12" r="3" />
      <path d="M7 9h.01" />
      <path d="M17 15h.01" />
    </svg>
  );
}

export function LocationIcon(props: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      <path d="M12 21s7-5.4 7-11a7 7 0 1 0-14 0c0 5.6 7 11 7 11Z" />
      <circle cx="12" cy="10" r="2.5" />
    </svg>
  );
}

export function TrashIcon(props: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      <path d="M4 7H20M10 11V17M14 11V17M5 7L6 19C6 19.5304 6.21071 20.0391 6.58579 20.4142C6.96086 20.7893 7.46957 21 8 21H16C16.5304 21 17.0391 20.7893 17.4142 20.4142C17.7893 20.0391 18 19.5304 18 19L19 7M9 7V4C9 3.73478 9.10536 3.48043 9.29289 3.29289C9.48043 3.10536 9.73478 3 10 3H14C14.2652 3 14.5196 3.10536 14.7071 3.29289C14.8946 3.48043 15 3.73478 15 4V7" />
    </svg>
  );
}
