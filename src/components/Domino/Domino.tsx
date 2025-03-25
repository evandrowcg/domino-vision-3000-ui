import React from "react";

interface DominoProps {
  left: number;
  right: number;
  width: string;
  margin?: string;
}

const Domino: React.FC<DominoProps> = ({ left, right, width, margin = "" }) => {
  const halfStyle = (
    value: number,
    isRightHalf: boolean = false
  ): React.CSSProperties => ({
    width: "50%",
    height: "100%",
    backgroundImage: `url(/images/domino_half_${value}.png)`,
    backgroundSize: "cover",
    backgroundPosition: "center",
    backgroundRepeat: "no-repeat",
    transform: isRightHalf ? "rotate(180deg)" : undefined,
    marginLeft: isRightHalf ? "-1px" : "0", // Overlap right half slightly
    boxSizing: "border-box",
  });

  return (
    <div
      style={{
        width,
        aspectRatio: "2 / 1", // Horizontal domino: width is 2x height
        display: "flex",
        float: "left",
        margin: margin,
        flexDirection: "row",
        overflow: "hidden",
      }}
    >
      <div style={halfStyle(left)} />
      <div style={halfStyle(right, true)} />
    </div>
  );
};

export default Domino;
