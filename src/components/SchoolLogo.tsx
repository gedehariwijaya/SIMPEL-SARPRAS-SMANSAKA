import React from 'react';

interface SchoolLogoProps {
  className?: string;
  size?: number | string;
  showText?: boolean;
}

export const SchoolLogo: React.FC<SchoolLogoProps> = ({
  className = 'w-10 h-10',
  size,
  showText = false,
}) => {
  const style = size ? { width: size, height: size } : undefined;

  return (
    <div className={`inline-flex items-center gap-2.5 ${className}`} style={style}>
      <svg
        viewBox="0 0 200 200"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full drop-shadow-sm select-none"
      >
        {/* Outer Pentagon Border (Black) */}
        <path
          d="M100 4 L192 68 L158 190 L42 190 L8 68 Z"
          fill="#000000"
          stroke="#000000"
          strokeWidth="4"
          strokeLinejoin="round"
        />

        {/* Inner White Margin */}
        <path
          d="M100 8 L188 70 L155 186 L45 186 L12 70 Z"
          fill="#FFFFFF"
          stroke="#000000"
          strokeWidth="2"
          strokeLinejoin="round"
        />

        {/* Main Cyan/Turquoise Shield Fill */}
        <path
          d="M100 12 L184 72 L152 182 L48 182 L16 72 Z"
          fill="#00F0FF"
          stroke="#000000"
          strokeWidth="2.5"
          strokeLinejoin="round"
        />

        {/* Top Arc Text: WIDYA STHITI DHARMA */}
        <path
          id="textArc"
          d="M 28,95 A 86,86 0 0,1 172,95"
          fill="none"
          stroke="none"
        />
        <text
          fill="#000000"
          fontSize="13.5"
          fontWeight="900"
          fontFamily="system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif"
          letterSpacing="2.5"
        >
          <textPath href="#textArc" startOffset="50%" textAnchor="middle">
            WIDYA STHITI DHARMA
          </textPath>
        </text>

        {/* Green Wings (Left & Right) */}
        {/* Left Wing */}
        <path
          d="M 75 130 C 50 135 30 115 35 95 C 40 80 55 60 72 65 C 62 75 55 90 60 102 C 65 112 72 120 75 130 Z"
          fill="#39E524"
          stroke="#000000"
          strokeWidth="2.5"
          strokeLinejoin="round"
        />
        <path
          d="M 45 92 C 55 75 68 62 76 60 C 65 72 60 88 64 100"
          fill="#4DF030"
          stroke="#000000"
          strokeWidth="1.5"
        />
        <path
          d="M 40 110 C 48 118 60 126 74 128"
          fill="none"
          stroke="#000000"
          strokeWidth="1.5"
        />

        {/* Right Wing */}
        <path
          d="M 125 130 C 150 135 170 115 165 95 C 160 80 145 60 128 65 C 138 75 145 90 140 102 C 135 112 128 120 125 130 Z"
          fill="#39E524"
          stroke="#000000"
          strokeWidth="2.5"
          strokeLinejoin="round"
        />
        <path
          d="M 155 92 C 145 75 132 62 124 60 C 135 72 140 88 136 100"
          fill="#4DF030"
          stroke="#000000"
          strokeWidth="1.5"
        />
        <path
          d="M 160 110 C 152 118 140 126 126 128"
          fill="none"
          stroke="#000000"
          strokeWidth="1.5"
        />

        {/* Golden Central Padma / Lotus Flower Motif */}
        <path
          d="M 100 85 C 90 85 80 92 80 105 C 80 120 90 130 100 132 C 110 130 120 120 120 105 C 120 92 110 85 100 85 Z"
          fill="#FFDD00"
          stroke="#000000"
          strokeWidth="2.5"
          strokeLinejoin="round"
        />
        {/* Flower Petals Details */}
        <path
          d="M 100 85 L 100 130 M 82 105 L 118 105 M 88 94 L 112 122 M 112 94 L 88 122"
          stroke="#D4A000"
          strokeWidth="2"
        />
        <circle cx="100" cy="105" r="7" fill="#FFF275" stroke="#000000" strokeWidth="2" />

        {/* Torch Handle (Black) */}
        <path
          d="M 94 72 L 106 72 L 104 88 L 96 88 Z"
          fill="#1E293B"
          stroke="#000000"
          strokeWidth="2"
        />

        {/* Red Flame */}
        <path
          d="M 100 42 C 92 52 90 62 94 72 C 98 72 102 72 106 72 C 110 62 108 52 100 42 Z"
          fill="#FF2200"
          stroke="#000000"
          strokeWidth="2"
          strokeLinejoin="round"
        />
        <path
          d="M 100 47 C 95 56 94 63 96 70 C 99 70 101 70 104 70 C 106 63 105 56 100 47 Z"
          fill="#FFAA00"
        />

        {/* Open White Book */}
        {/* Book Left Page */}
        <path
          d="M 58 135 C 75 130 90 132 99 137 L 99 148 C 90 143 75 141 58 146 Z"
          fill="#FFFFFF"
          stroke="#000000"
          strokeWidth="2.5"
          strokeLinejoin="round"
        />
        {/* Book Right Page */}
        <path
          d="M 142 135 C 125 130 110 132 101 137 L 101 148 C 110 143 125 141 142 146 Z"
          fill="#FFFFFF"
          stroke="#000000"
          strokeWidth="2.5"
          strokeLinejoin="round"
        />
        {/* Book Spine & Bottom Lines */}
        <path
          d="M 58 143 C 75 138 90 140 99 145 M 142 143 C 125 138 110 140 101 145"
          stroke="#94A3B8"
          strokeWidth="1.5"
        />

        {/* Yellow Bottom Banner Ribbon: SMAN 1 TEJAKULA */}
        <path
          d="M 38 170 L 48 162 C 75 152 125 152 152 162 L 162 170 L 152 176 C 125 166 75 166 48 176 Z"
          fill="#FFEB3B"
          stroke="#000000"
          strokeWidth="2.5"
          strokeLinejoin="round"
        />
        {/* Ribbon Tail Left */}
        <path
          d="M 38 170 L 26 166 L 36 177 L 24 179 L 44 174 Z"
          fill="#FDD835"
          stroke="#000000"
          strokeWidth="2"
          strokeLinejoin="round"
        />
        {/* Ribbon Tail Right */}
        <path
          d="M 162 170 L 174 166 L 164 177 L 176 179 L 156 174 Z"
          fill="#FDD835"
          stroke="#000000"
          strokeWidth="2"
          strokeLinejoin="round"
        />

        {/* Banner Text Path */}
        <path
          id="bannerTextArc"
          d="M 46,172 Q 100,154 154,172"
          fill="none"
          stroke="none"
        />
        <text
          fill="#000000"
          fontSize="9.5"
          fontWeight="900"
          fontFamily="system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif"
          letterSpacing="0.8"
        >
          <textPath href="#bannerTextArc" startOffset="50%" textAnchor="middle">
            SMAN 1 TEJAKULA
          </textPath>
        </text>
      </svg>

      {showText && (
        <div className="flex flex-col">
          <span className="font-black text-sm text-slate-900 tracking-tight leading-none">
            SMAN 1 TEJAKULA
          </span>
          <span className="text-[10px] text-slate-500 font-bold tracking-wider uppercase mt-0.5">
            Widya Sthiti Dharma
          </span>
        </div>
      )}
    </div>
  );
};
