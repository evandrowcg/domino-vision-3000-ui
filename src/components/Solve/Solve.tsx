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
  CardContent,
  Card,
  IconButton,
  TableSortLabel,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button
} from "@mui/material";
import { SelectChangeEvent } from "@mui/material/Select";
import Domino from "../Domino/Domino";

interface SolveProps {}

const Solve: FC<SolveProps> = () => {
  const [detectionPairs, setDetectionPairs] = useState<number[][]>([]);
  const [composeResponse, setComposeResponse] = useState<any[]>([]);
  const [selectedValue, setSelectedValue] = useState<number>(0);
  const prevPairsRef = useRef<number[][]>([]);

  const [sortBy, setSortBy] = useState<string>("sequenceLength");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

  const [helpOpen, setHelpOpen] = useState(false);
  const handleOpenHelp = () => setHelpOpen(true);
  const handleCloseHelp = () => setHelpOpen(false);

  const handleDetections = useCallback((newDetections: Prediction[]) => {
    const pairs: number[][] = newDetections.map((det) => {
      const parts = det.class.split("x");
      return parts.map((part) => parseInt(part, 10));
    });

    if (JSON.stringify(pairs) !== JSON.stringify(prevPairsRef.current)) {
      prevPairsRef.current = pairs;
      setDetectionPairs(pairs);
    }
  }, []);

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

  return (
    <Box sx={{ p: 1 }}>
      <Box
        sx={{
          maxWidth: 800,
          mx: "auto",
          mt: 1,
          mb: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center" }}>
          <IconButton component={Link} to="/" sx={{ p: 0 }}>
            <ArrowBackIcon sx={{ color: "white" }} />
          </IconButton>
          <Typography variant="h5" component="h1" sx={{ ml: 1 }}>
            Solve
          </Typography>
        </Box>

        <IconButton onClick={handleOpenHelp}>
          <HelpOutlineIcon sx={{ color: "white" }} />
        </IconButton>
      </Box>

      <Webcam modelConfig={DOMINO_YOLOV8s} onDetections={handleDetections} />

      <Card sx={{ maxWidth: 800, mx: "auto", mt: 1, color: "black" }}>
        <CardContent sx={{ color: "black" }}>
          <Box sx={{ mt: 2 }}>
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
                  <MenuItem key={i} value={i} sx={{ color: "black" }}>
                    {i}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <Typography variant="h6" sx={{ mt: 1 }}>
              Detected pieces count: {detectionPairs.length}
            </Typography>
          </Box>

          {detectionPairs.length > 0 &&
            composeResponse &&
            composeResponse.length > 0 && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="h6">Possible paths:</Typography>
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
                              direction={
                                sortBy === id ? sortDirection : "asc"
                              }
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
                                  (
                                    [left, right]: [number, number],
                                    index: number
                                  ) => (
                                    <Domino
                                      key={index}
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
        </CardContent>
      </Card>

      {/* Help Dialog */}
      <Dialog open={helpOpen} onClose={handleCloseHelp}>
        <DialogTitle sx={{ color: "black" }}>Instructions</DialogTitle>
        <DialogContent sx={{ color: "black" }}>
          <Typography>
            1. Capture or upload the dominoes image
          </Typography>
          <Typography>
            2. Check if all pieces were detected correctly
          </Typography>
          <Typography>
            3. Add / remove / edit boxes if needed
          </Typography>
          <Typography>
            4. Select a starting value from the dropdown
          </Typography>
          <Typography>
            5. Check the table to explore different paths
          </Typography>
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

export default Solve;
