import React, {
    FC,
    useState,
    useCallback,
    useRef,
    useEffect,
    useMemo,
  } from "react";
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
  
  const CountAndSolve: FC = () => {
    // --- Solve states ---
    const [detectionPairs, setDetectionPairs] = useState<number[][]>([]);
    const [composeResponse, setComposeResponse] = useState<any[]>([]);
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
    const handleOpenHelp = () => setHelpOpen(true);
    const handleCloseHelp = () => setHelpOpen(false);
  
    // --- Combined onDetections callback ---
    const handleDetections = useCallback((newDetections: Prediction[]) => {
      // Solve: update detection pairs
      const pairs: number[][] = newDetections.map((det) => {
        const parts = det.class.split("x");
        return parts.map((part) => parseInt(part, 10));
      });
      if (JSON.stringify(pairs) !== JSON.stringify(prevPairsRef.current)) {
        prevPairsRef.current = pairs;
        setDetectionPairs(pairs);
      }
  
      // Count: update total sum and count
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
          const response = await combine(detectionPairs, selectedValue);
          setComposeResponse(response);
        } else {
          setComposeResponse([]);
        }
      }
      updateComposeResponse();
    }, [detectionPairs, selectedValue]);
  
    // --- Solve: handle dropdown changes and sorting ---
    const handleSelectChange = (event: SelectChangeEvent<number>) => {
      setSelectedValue(Number(event.target.value));
    };
  
    const handleSort = (column: string) => {
      if (sortBy === column) {
        setSortDirection(sortDirection === "asc" ? "desc" : "asc");
      } else {
        setSortBy(column);
        setSortDirection("asc");
      }
    };
  
    const sortedComposeResponse = useMemo(() => {
      return composeResponse.slice().sort((a, b) => {
        const aVal = a[sortBy];
        const bVal = b[sortBy];
        if (aVal < bVal) return sortDirection === "asc" ? -1 : 1;
        if (aVal > bVal) return sortDirection === "asc" ? 1 : -1;
        return 0;
      });
    }, [composeResponse, sortBy, sortDirection]);
  
    // --- Solve Accordion onChange handler ---
    const handleSolveAccordionChange = (
      event: React.SyntheticEvent,
      isExpanded: boolean
    ) => {
      if (isExpanded) {
        if (!hasSeenSolveAlert) {
          setShowSolveAlert(true);
        } else {
          setSolveExpanded(true);
        }
      } else {
        setSolveExpanded(false);
      }
    };
  
    const handleSolveAlertConfirm = () => {
      setSolveExpanded(true);
      setShowSolveAlert(false);
      setHasSeenSolveAlert(true);
    };
  
    const handleSolveAlertCancel = () => {
      setSolveExpanded(false);
      setShowSolveAlert(false);
      setHasSeenSolveAlert(true);
    };
  
    return (
      <Box sx={{ p: 1 }}>
        {/* Top Header with combined Help Icon */}
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
          <IconButton onClick={handleOpenHelp}>
            <HelpOutlineIcon sx={{ color: "white" }} />
          </IconButton>
        </Box>
  
        {/* Shared Webcam */}
        <Box sx={{ maxWidth: 800, mx: "auto", mt: 1 }}>
          <Webcam modelConfig={DOMINO_YOLOV8s} onDetections={handleDetections} />
        </Box>
  
        {/* Detected Pieces Count displayed above the Count section */}
        <Box sx={{ maxWidth: 800, mx: "auto", mt: 2 }}>
          <Typography variant="body1" sx={{ textAlign: "center" }}>
            Detected pieces count: {totalCount}
          </Typography>
        </Box>
  
        {/* ----- Count Section (Collapsible, Expanded by default) ----- */}
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
            expandIcon={<ExpandMoreIcon sx={{ color: "black" }} />}
            sx={{ "& .MuiTypography-root": { color: "black" } }}
          >
            <Typography variant="h6" sx={{ color: "black" }}>
              Count
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Typography variant="body1" sx={{ color: "black" }}>
              Total sum: {totalSum}
            </Typography>
          </AccordionDetails>
        </Accordion>
  
        {/* ----- Solve Section (Collapsible, Collapsed by default) ----- */}
        <Accordion
          disableGutters
          expanded={solveExpanded}
          onChange={handleSolveAccordionChange}
          sx={{
            maxWidth: 800,
            mx: "auto",
            mt: 2,
            "&.Mui-expanded": { margin: "16px auto" },
          }}
        >
          <AccordionSummary
            expandIcon={<ExpandMoreIcon sx={{ color: "black" }} />}
            sx={{ "& .MuiTypography-root": { color: "black" } }}
          >
            <Typography variant="h6" sx={{ color: "black" }}>
              Solve
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Box sx={{ mt: 2, display: "flex", alignItems: "center", gap: 2 }}>
              <FormControl sx={{ minWidth: 120 }}>
                <InputLabel id="dropdown-label" sx={{ color: "black" }}>
                  Starting value
                </InputLabel>
                <Select<number>
                  labelId="dropdown-label"
                  id="dropdown"
                  value={selectedValue}
                  label="Starting value"
                  onChange={handleSelectChange}
                  sx={{ color: "black" }}
                >
                  {Array.from({ length: 13 }, (_, i) => (
                    <MenuItem key={i} value={12 - i} sx={{ color: "black" }}>
                      {12 - i}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <Domino left={selectedValue} right={selectedValue} width="75px" />
            </Box>
    
            {detectionPairs.length > 0 &&
              composeResponse &&
              composeResponse.length > 0 && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="body1" sx={{ color: "black" }}>
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
                            <TableCell key={id} sx={{ color: "black" }}>
                              <TableSortLabel
                                active={sortBy === id}
                                direction={sortBy === id ? sortDirection : "asc"}
                                onClick={() => handleSort(id)}
                                sx={{
                                  color: "black",
                                  "& .MuiTableSortLabel-icon": {
                                    color: "black !important",
                                  },
                                  "&.Mui-active": { color: "black" },
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
                          const rowBgColor =
                            index % 2 === 0 ? "grey.100" : "grey.200";
                          return (
                            <React.Fragment key={index}>
                              <TableRow sx={{ backgroundColor: rowBgColor }}>
                                <TableCell sx={{ color: "black" }}>
                                  {item.sequenceLength}
                                </TableCell>
                                <TableCell sx={{ color: "black" }}>
                                  {item.sequenceScore}
                                </TableCell>
                                <TableCell sx={{ color: "black" }}>
                                  {item.unusedScore}
                                </TableCell>
                                <TableCell sx={{ color: "black" }}>
                                  {item.unused}
                                </TableCell>
                              </TableRow>
                              <TableRow sx={{ backgroundColor: rowBgColor }}>
                                <TableCell sx={{ color: "black" }} colSpan={4}>
                                  {item.sequence.map(
                                    ([left, right]: [number, number], idx: number) => (
                                      <Domino
                                        key={idx}
                                        left={left}
                                        right={right}
                                        width="50px"
                                        margin="2px 3px 2px 0"
                                      />
                                    )
                                  )}
                                </TableCell>
                              </TableRow>
                            </React.Fragment>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </Box>
                </Box>
              )}
          </AccordionDetails>
        </Accordion>
    
        {/* Alert Dialog for Solve expansion (opens only once) */}
        <Dialog open={showSolveAlert} onClose={handleSolveAlertCancel}>
          <DialogTitle sx={{ color: "black" }}>Warning</DialogTitle>
          <DialogContent>
            <DialogContentText>
              Proceeding may spoil the fun of the game. Are you sure you want to
              continue?
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
    
        {/* Combined Help Dialog */}
        <Dialog open={helpOpen} onClose={handleCloseHelp}>
          <DialogTitle sx={{ color: "black" }}>Instructions</DialogTitle>
          <DialogContent sx={{ color: "black" }}>
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
            <Button onClick={handleCloseHelp} color="primary">
              Close
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    );
  };
  
  export default CountAndSolve;
  