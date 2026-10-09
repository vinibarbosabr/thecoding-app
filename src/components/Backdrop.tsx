const COLUMNS = 7;
const ROWS = 26;
const GLYPHS_PER_ROW = 7;

function binaryColumns(): string[] {
  let seed = 42;
  const rnd = () => {
    seed = (seed * 1103515245 + 12345) % 2147483648;
    return seed / 2147483648;
  };
  return Array.from({ length: COLUMNS }, () =>
    Array.from({ length: ROWS }, () =>
      Array.from(
        { length: GLYPHS_PER_ROW },
        () => (rnd() < 0.5 ? "0" : "1"),
      ).join(""),
    ).join("\n"),
  );
}

const COLUMNS_TEXT = binaryColumns();

export function Backdrop() {
  return (
    <div
      aria-hidden="true"
      className="backdrop-glyphs pointer-events-none fixed inset-0 z-0 flex select-none justify-between overflow-hidden px-1.5 font-mono text-xs leading-[1.8] text-paper"
    >
      {COLUMNS_TEXT.map((column, i) => (
        <span key={i} className="whitespace-pre">
          {column}
        </span>
      ))}
    </div>
  );
}
