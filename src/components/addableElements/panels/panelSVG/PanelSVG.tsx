import React from "react";
import { useTheme } from "@mui/material/styles";

export default function PanelSVG() {
  const theme = useTheme();

  const boxWidth = 75;
  const boxHeight = 75;
  const spacingBetweenBoxes = 16;
  const marginSides = 16;

  const labels = ["1", "2", "3"];

  const totalWidth =
    marginSides * 2 +
    labels.length * boxWidth +
    (labels.length - 1) * spacingBetweenBoxes;

  const svgHeight = boxHeight + 32; // include top padding

  const textStyle: React.CSSProperties = {
    fontSize: "1.5rem",
    fill: theme.palette.text.primary,
    dominantBaseline: "middle",
    textAnchor: "middle",
  };

  return (
    <svg
      width={totalWidth}
      height={svgHeight}
      style={{
        backgroundColor: theme.palette.primary.main,
        display: "block",
      }}
    >
      {labels.map((label, index) => {
        const xOffset = marginSides + index * (boxWidth + spacingBetweenBoxes);

        return (
          <g key={label} transform={`translate(${xOffset}, 16)`}>
            <rect
              width={boxWidth}
              height={boxHeight}
              fill={theme.palette.secondary.main}
            />
            <text x={boxWidth / 2} y={boxHeight / 2} style={textStyle}>
              {label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
