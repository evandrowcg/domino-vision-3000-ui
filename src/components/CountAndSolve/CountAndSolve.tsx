import React, { FC, useState, useCallback, useRef, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import Webcam from "../Webcam/Webcam";
import { DOMINO_YOLOV8s } from "../../ai/ModelConfig";
import { Prediction } from "../../ai/YoloModelTF";
import { combine } from "../../utils/tiles";
import {
  Box,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  IconButton,
  TableSortLabel,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from "@mui/material";
import { SelectChangeEvent } from "@mui/material/Select";
import Domino from "../Domino/Domino";

// --- Custom Deep Equality Function ---
const arePairsEqual = (arr1: number[][], arr2: number[][]): boolean => {
  if (arr1.length !== arr2.length) return false;
  for (let i = 0; i < arr1.length; i++) {
    if (arr1[i].length !== arr2[i].length) return false;
    for (let j = 0; j < arr1[i].length; j++) {
      if (arr1[i][j] !== arr2[i][j]) return false;
    }
  }
  return true;
};

// --- Type Definitions ---
interface ComposeResponseItem {
  sequenceLength: number;
  sequenceScore: number;
  unusedScore: number;
  unused: number;
  sequence: [number, number][];
}

const commonTextColor = "black";

// --- Subcomponents ---

const Header: FC<{ onOpenHelp: () => void }> = ({ onOpenHelp }) => (
  <Box
    sx={{
      maxWidth: 800,
      mx: "auto",
      mt: 1,
      mb: 2,
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
    }}
  >
    <Box sx={{ display: "flex", alignItems: "center" }}>
      <IconButton component={Link} to="/" sx={{ p: 0 }}>
        <ArrowBackIcon sx={{ color: "white" }} />
      </IconButton>
      <Typography variant="h5" component="h1" sx={{ ml: 1, color: "white" }}>
        Domino Vision 3000!
      </Typography>
    </Box>
    <IconButton onClick={onOpenHelp}>
      <HelpOutlineIcon sx={{ color: "white" }} />
    </IconButton>
  </Box>
);

const WebcamWrapper: FC<{ onDetections: (newDetections: Prediction[]) => void }> = ({
  onDetections,
}) => (
  <Box sx={{ maxWidth: 800, mx: "auto", mt: 1 }}>
    <Webcam modelConfig={DOMINO_YOLOV8s} onDetections={onDetections} />
  </Box>
);

const CountSection: FC<{ totalCount: number; totalSum: number }> = ({
  totalCount,
  totalSum,
}) => (
  <>
    <Box sx={{ maxWidth: 800, mx: "auto", mt: 2 }}>
      <Typography variant="body1" sx={{ textAlign: "center" }}>
        Detected pieces count: {totalCount}
      </Typography>
    </Box>
    <Accordion
      disableGutters
      defaultExpanded
      sx={{
        maxWidth: 800,
        mx: "auto",
        mt: 2,
        "&.Mui-expanded": { margin: "16px auto" },
      }}
    >
      <AccordionSummary
        expandIcon={<ExpandMoreIcon sx={{ color: commonTextColor }} />}
        sx={{
          backgroundColor: "lightgray",
          "& .MuiTypography-root": { color: commonTextColor },
        }}
      >
        <Typography variant="h6" sx={{ color: commonTextColor }}>
          Count
        </Typography>
      </AccordionSummary>
      <AccordionDetails>
        <Typography variant="body1" sx={{ color: commonTextColor, textAlign: "center" }}>
          Total sum: {totalSum}
        </Typography>
      </AccordionDetails>
    </Accordion>
  </>
);

interface SolveSectionProps {
  selectedValue: number;
  onSelectChange: (event: SelectChangeEvent<number>) => void;
  sortedComposeResponse: ComposeResponseItem[];
  sortBy: string;
  sortDirection: "asc" | "desc";
  onSort: (column: string) => void;
  solveExpanded: boolean;
  onAccordionChange: (event: React.SyntheticEvent, isExpanded: boolean) => void;
}
const SolveSection: FC<SolveSectionProps> = ({
  selectedValue,
  onSelectChange,
  sortedComposeResponse,
  sortBy,
  sortDirection,
  onSort,
  solveExpanded,
  onAccordionChange,
}) => (
  <Accordion
    disableGutters
    expanded={solveExpanded}
    onChange={onAccordionChange}
    sx={{
      maxWidth: 800,
      mx: "auto",
      mt: 2,
      "&.Mui-expanded": { margin: "16px auto" },
    }}
  >
    <AccordionSummary
      expandIcon={<ExpandMoreIcon sx={{ color: commonTextColor }} />}
      sx={{
        backgroundColor: "lightgray",
        "& .MuiTypography-root": { color: commonTextColor },
      }}
    >
      <Typography variant="h6" sx={{ color: commonTextColor }}>
        Solve
      </Typography>
    </AccordionSummary>
    <AccordionDetails>
      <Box sx={{ mt: 2, display: "flex", alignItems: "center", justifyContent: "center", gap: 2 }}>
        <FormControl sx={{ minWidth: 120 }}>
          <InputLabel id="dropdown-label" sx={{ color: commonTextColor }}>
            Starting value
          </InputLabel>
          <Select<number>
            labelId="dropdown-label"
            id="dropdown"
            value={selectedValue}
            label="Starting value"
            onChange={onSelectChange}
            sx={{ color: commonTextColor }}
          >
            {Array.from({ length: 13 }, (_, i) => (
              <MenuItem key={i} value={12 - i} sx={{ color: commonTextColor }}>
                {12 - i}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <Domino left={selectedValue} right={selectedValue} width="75px" />
      </Box>
      <Box sx={{ mt: 2 }}>
        <Typography variant="body1" sx={{ color: commonTextColor }}>
          Possible paths:
        </Typography>
        <Box sx={{ overflowX: "auto" }}>
          <Table sx={{ fontSize: "0.8rem" }}>
            <TableHead>
              <TableRow>
                {[
                  { id: "sequenceLength", label: "Sequence Length" },
                  { id: "sequenceScore", label: "Sequence Score" },
                  { id: "unusedScore", label: "Unused Score" },
                  { id: "unused", label: "Unused Pieces" },
                ].map(({ id, label }) => (
                  <TableCell key={id} sx={{ color: commonTextColor }}>
                    <TableSortLabel
                      active={sortBy === id}
                      direction={sortBy === id ? sortDirection : "asc"}
                      onClick={() => onSort(id)}
                      sx={{
                        color: commonTextColor,
                        "& .MuiTableSortLabel-icon": {
                          color: `${commonTextColor} !important`,
                        },
                        "&.Mui-active": { color: commonTextColor },
                      }}
                    >
                      {label}
                    </TableSortLabel>
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {sortedComposeResponse.map((item, index) => {
                const rowBgColor = index % 2 === 0 ? "grey.100" : "grey.200";
                return (
                  <React.Fragment key={index}>
                    <TableRow sx={{ backgroundColor: rowBgColor }}>
                      <TableCell sx={{ color: commonTextColor }}>
                        {item.sequenceLength}
                      </TableCell>
                      <TableCell sx={{ color: commonTextColor }}>
                        {item.sequenceScore}
                      </TableCell>
                      <TableCell sx={{ color: commonTextColor }}>
                        {item.unusedScore}
                      </TableCell>
                      <TableCell sx={{ color: commonTextColor }}>
                        {item.unused}
                      </TableCell>
                    </TableRow>
                    <TableRow sx={{ backgroundColor: rowBgColor }}>
                      <TableCell sx={{ color: commonTextColor }} colSpan={4}>
                        {item.sequence.map(([left, right], idx) => (
                          <Domino
                            key={idx}
                            left={left}
                            right={right}
                            width="50px"
                            margin="2px 3px 2px 0"
                          />
                        ))}
                      </TableCell>
                    </TableRow>
                  </React.Fragment>
                );
              })}
            </TableBody>
          </Table>
        </Box>
      </Box>
    </AccordionDetails>
  </Accordion>
);

const HelpDialog: FC<{ helpOpen: boolean; onClose: () => void }> = ({
  helpOpen,
  onClose,
}) => (
  <Dialog open={helpOpen} onClose={onClose}>
    <DialogTitle sx={{ color: commonTextColor }}>Instructions</DialogTitle>
    <DialogContent sx={{ color: commonTextColor }}>
      <DialogContentText>
        1. Capture or upload the dominoes image.
        <br />
        2. Check if all pieces were detected correctly.
        <br />
        3. Add, remove, or edit boxes if needed.
        <br />
        4. In the Count section, check the sum of all pips.
        <br />
        5. In the Solve section, select a starting value from the dropdown and check the table to explore possible paths.
      </DialogContentText>
    </DialogContent>
    <DialogActions>
      <Button onClick={onClose} color="primary">
        Close
      </Button>
    </DialogActions>
  </Dialog>
);

// --- Main Component ---
const CountAndSolve: FC = () => {
  // --- Solve states ---
  const [detectionPairs, setDetectionPairs] = useState<number[][]>([]);
  const [composeResponse, setComposeResponse] = useState<ComposeResponseItem[]>([]);
  const [selectedValue, setSelectedValue] = useState<number>(12);
  const prevPairsRef = useRef<number[][]>([]);
  const [sortBy, setSortBy] = useState<string>("sequenceLength");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

  // --- Count states ---
  const [totalSum, setTotalSum] = useState<number>(0);
  const [totalCount, setTotalCount] = useState<number>(0);
  const prevTotalRef = useRef<number>(0);

  // --- Accordion control for Solve ---
  const [solveExpanded, setSolveExpanded] = useState(false);
  const [showSolveAlert, setShowSolveAlert] = useState(false);
  const [hasSeenSolveAlert, setHasSeenSolveAlert] = useState(false);

  // --- Combined Help Dialog state ---
  const [helpOpen, setHelpOpen] = useState(false);
  const handleOpenHelp = useCallback(() => setHelpOpen(true), []);
  const handleCloseHelp = useCallback(() => setHelpOpen(false), []);

  // --- Combined onDetections callback ---
  const handleDetections = useCallback((newDetections: Prediction[]) => {
    // Update detection pairs for solving
    const pairs: number[][] = newDetections.map((det) => {
      const parts = det.class.split("x");
      return parts.map((part) => parseInt(part, 10));
    });
    if (!arePairsEqual(pairs, prevPairsRef.current)) {
      prevPairsRef.current = pairs;
      setDetectionPairs(pairs);
    }

    // Update total sum and count for counting
    const newTotal: number = newDetections.reduce((acc, det) => {
      const parts = det.class.split("x");
      const detectionSum = parts.reduce(
        (sum, part) => sum + parseInt(part, 10),
        0
      );
      return acc + detectionSum;
    }, 0);
    if (newTotal !== prevTotalRef.current) {
      prevTotalRef.current = newTotal;
      setTotalSum(newTotal);
    }
    setTotalCount(newDetections.length);
  }, []);

  // --- Solve: update possible paths ---
  useEffect(() => {
    async function updateComposeResponse() {
      if (detectionPairs.length > 0) {
        try {
          const response = await combine(detectionPairs, selectedValue);
          setComposeResponse(response);
        } catch (error) {
          console.error("Error combining detection pairs:", error);
          setComposeResponse([]);
        }
      } else {
        setComposeResponse([]);
      }
    }
    updateComposeResponse();
  }, [detectionPairs, selectedValue]);

  // --- Solve: handle dropdown changes and sorting ---
  const handleSelectChange = useCallback((event: SelectChangeEvent<number>) => {
    setSelectedValue(Number(event.target.value));
  }, []);

  const handleSort = useCallback(
    (column: string) => {
      if (sortBy === column) {
        setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
      } else {
        setSortBy(column);
        setSortDirection("asc");
      }
    },
    [sortBy]
  );

  const sortedComposeResponse = useMemo(() => {
    return [...composeResponse].sort((a, b) => {
      const aVal = a[sortBy as keyof ComposeResponseItem];
      const bVal = b[sortBy as keyof ComposeResponseItem];
      if (aVal < bVal) return sortDirection === "asc" ? -1 : 1;
      if (aVal > bVal) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });
  }, [composeResponse, sortBy, sortDirection]);

  // --- Solve Accordion onChange handler ---
  const handleSolveAccordionChange = useCallback(
    (event: React.SyntheticEvent, isExpanded: boolean) => {
      if (isExpanded) {
        if (!hasSeenSolveAlert) {
          setShowSolveAlert(true);
        } else {
          setSolveExpanded(true);
        }
      } else {
        setSolveExpanded(false);
      }
    },
    [hasSeenSolveAlert]
  );

  const handleSolveAlertConfirm = useCallback(() => {
    setSolveExpanded(true);
    setShowSolveAlert(false);
    setHasSeenSolveAlert(true);
  }, []);

  const handleSolveAlertCancel = useCallback(() => {
    setSolveExpanded(false);
    setShowSolveAlert(false);
    setHasSeenSolveAlert(true);
  }, []);

  return (
    <Box sx={{ p: 1 }}>
      <Header onOpenHelp={handleOpenHelp} />
      <WebcamWrapper onDetections={handleDetections} />
      <CountSection totalCount={totalCount} totalSum={totalSum} />
      <SolveSection
        selectedValue={selectedValue}
        onSelectChange={handleSelectChange}
        sortedComposeResponse={sortedComposeResponse}
        sortBy={sortBy}
        sortDirection={sortDirection}
        onSort={handleSort}
        solveExpanded={solveExpanded}
        onAccordionChange={handleSolveAccordionChange}
      />
      {showSolveAlert && (
        <Dialog open={showSolveAlert} onClose={handleSolveAlertCancel}>
          <DialogTitle sx={{ color: commonTextColor }}>Warning</DialogTitle>
          <DialogContent>
            <DialogContentText>
              Proceeding may spoil the fun of the game. Are you sure you want to continue?
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleSolveAlertCancel} color="primary">
              Cancel
            </Button>
            <Button onClick={handleSolveAlertConfirm} color="primary" autoFocus>
              Proceed
            </Button>
          </DialogActions>
        </Dialog>
      )}
      <HelpDialog helpOpen={helpOpen} onClose={handleCloseHelp} />
    </Box>
  );
};

export default CountAndSolve;
