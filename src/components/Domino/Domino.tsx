import React from "react";

interface DominoProps {
  left: number;
  right: number;
  width: string;
  margin?: string;
}

const Domino: React.FC<DominoProps> = ({ left, right, width, margin = "" }) => {
  const halfStyle = (value: number, rotate: boolean = false): React.CSSProperties => ({
    flex: 1,
    backgroundImage: `url(/images/domino_half_${value}.png)`,
    backgroundSize: "cover",
    backgroundPosition: "center",
    backgroundRepeat: "no-repeat",
    transform: rotate ? "rotate(180deg)" : undefined,
  });

  return (
    <div
      style={{
        width,
        aspectRatio: "2 / 1", // horizontal domino: width is 2x height
        display: "flex",
        float: "left",
        margin: margin,
        flexDirection: "row", // side-by-side
        overflow: "hidden",
      }}
    >
      <div style={halfStyle(left)} />
      <div style={halfStyle(right, true)} />
    </div>
  );
};

export default Domino;
