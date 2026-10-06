import type { SVGProps } from "react";

const PATHS: Record<string, string> = {
  building: "M4 21V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v16M16 9h2a2 2 0 0 1 2 2v10M3 21h18M8 7h4M8 11h4M8 15h4",
  home: "M3 11.5 12 4l9 7.5M5 10v10h5v-6h4v6h5V10",
  villa: "M2 21h20M4 21V10l6-4 6 4v11M16 13l4 2v6M9 21v-5h2v5M8 11h4",
  door: "M6 21V4a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v17M4 21h16M14 12v1",
  land: "M3 20h18M4 20l4-9 4 5 3-4 5 8M15 6a2 2 0 1 0 0 .01",
  layers: "m12 3 9 5-9 5-9-5 9-5ZM3 12l9 5 9-5M3 16l9 5 9-5",
  roof: "M3 12 12 4l9 8M6 10v10h12V10M10 20v-5h4v5",
  users: "M16 20v-1a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v1M9.5 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7ZM21 20v-1a4 4 0 0 0-3-3.87M16 4.13a3.5 3.5 0 0 1 0 6.75",
  store: "M4 9v11h16V9M3 9l1.5-5h15L21 9a3 3 0 0 1-6 0 3 3 0 0 1-6 0 3 3 0 0 1-6 0ZM9 20v-5h6v5",
  briefcase: "M3 8h18v11a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V8ZM8 8V5a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v3M3 13h18",
  box: "m3 8 9-5 9 5v8l-9 5-9-5V8ZM3 8l9 5 9-5M12 13v8",
  tree: "M12 22v-6M7 16h10l-3-4h2l-4-5-4 5h2l-3 4Z",
  sun: "M12 17a5 5 0 1 0 0-10 5 5 0 0 0 0 10ZM12 2v2M12 20v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M2 12h2M20 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4",
  bed: "M3 18v-7a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v7M3 15h18M3 18v2M21 18v2M7 9V7a1 1 0 0 1 1-1h8a1 1 0 0 1 1 1v2",
  bath: "M4 12h16v3a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4v-3ZM6 12V6a2 2 0 0 1 4 0M7 19l-1 2M17 19l1 2",
  area: "M4 4h16v16H4V4ZM4 9h3M4 15h3M9 4v3M15 4v3",
  pin: "M12 21s7-6.2 7-11.5A7 7 0 0 0 5 9.5C5 14.8 12 21 12 21ZM12 12a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z",
  clock: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18ZM12 7v5l3 2",
  camera: "M4 8h3l1.5-2h7L17 8h3a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1ZM12 16a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z",
  phone: "M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a1 1 0 0 1-1 1A16 16 0 0 1 4 5a1 1 0 0 1 1-1Z",
  chevron: "m9 6 6 6-6 6",
  search: "M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16ZM21 21l-4.3-4.3",
  shield: "M12 3 5 6v6c0 4.5 3 7.5 7 9 4-1.5 7-4.5 7-9V6l-7-3ZM9 12l2 2 4-4",
  chart: "M4 20V10M10 20V4M16 20v-7M22 20H2",
  refresh: "M20 11a8 8 0 0 0-14.9-3M4 5v4h4M4 13a8 8 0 0 0 14.9 3M20 19v-4h-4",
  star: "m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1-5.4-2.9-5.4 2.9 1-6.1L3.200 9.5l6.1-.9L12 3Z",
  globe: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18ZM3 12h18M12 3c2.5 2.5 3.8 5.5 3.8 9S14.5 18.500 12 21c-2.5-2.5-3.800-5.500-3.800-9S9.500 5.500 12 3Z",
  app: "M8 2h8a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2ZM11 18h2",
  check: "m5 12 5 5 9-10",
  alert: "M12 4 2.500 20h19L12 4ZM12 10v4M12 17v.5",
  menu: "M4 7h16M4 12h16M4 17h16",
  plus: "M12 5v14M5 12h14",
  sparkle: "M12 3l1.800 4.700L18.500 9.500l-4.700 1.800L12 16l-1.800-4.700L5.500 9.500l4.700-1.800L12 3ZM19 14l.900 2.100L22 17l-2.100.900L19 20l-.900-2.100L16 17l2.100-.900L19 14Z",
  mic: "M12 15a3 3 0 0 0 3-3V6a3 3 0 0 0-6 0v6a3 3 0 0 0 3 3ZM6 11a6 6 0 0 0 12 0M12 17v4M9 21h6",
  filter: "M4 6h16M7 12h10M10 18h4",
  close: "M6 6l12 12M18 6 6 18",
  user: "M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM4 21a8 8 0 0 1 16 0",
  stairs: "M4 20h4v-4h4v-4h4V8h4",
  whatsapp: "M4 20l1.300-4.200A8 8 0 1 1 8.300 18.800L4 20ZM9 9.500c0 3 2.500 5.500 5.500 5.500l1-1.500-2-1-1 .800c-.800-.400-1.400-1-1.800-1.800l.800-1-1-2L9 9.500Z",
  upload: "M12 16V4M7 9l5-5 5 5M5 20h14",
  trash: "M5 7h14M10 7V4h4v3M7 7l1 13h8l1-13",
  heart: "M12 20s-7-4.400-7-9.800A4.200 4.200 0 0 1 12 7.500a4.200 4.200 0 0 1 7 2.700C19 15.600 12 20 12 20Z",
  arrow: "M5 12h14M13 6l6 6-6 6",
  image: "M4 5h16a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1ZM3 16l5-5 4 4 3-3 6 6M15 9.5a1.500 1.500 0 1 0 0-.01",
  video: "M4 6h10a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2ZM16 10l6-3v10l-6-3",
  chat: "M4 5h16a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1h-7l-5 4v-4H4a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1ZM8 10h8M8 13h5",
};

export type IconName = keyof typeof PATHS;

export default function Icon({ name, size = 20, ...props }: { name: string; size?: number } & SVGProps<SVGSVGElement>) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.7}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      <path d={PATHS[name] ?? PATHS.building} />
    </svg>
  );
}
