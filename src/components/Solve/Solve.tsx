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
} from "@mui/material";
import { SelectChangeEvent } from "@mui/material/Select";

interface SolveProps {}

const Solve: FC<SolveProps> = () => {
  const [detectionPairs, setDetectionPairs] = useState<number[][]>([]);
  const [composeResponse, setComposeResponse] = useState<any[]>([]);
  const [selectedValue, setSelectedValue] = useState<number>(0);
  const prevPairsRef = useRef<number[][]>([]);

  // Set default sort: "sequenceLength" descending by default.
  const [sortBy, setSortBy] = useState<string>("sequenceLength");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

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

  const handleSelectChange = (
    event: SelectChangeEvent<number>,
    child: React.ReactNode
  ) => {
    setSelectedValue(Number(event.target.value));
  };

  // Toggle sorting when a header is clicked.
  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortBy(column);
      setSortDirection("asc");
    }
  };

  // Memoize sorted response.
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
        }}
      >
        <IconButton component={Link} to="/" sx={{ p: 0 }}>
          <ArrowBackIcon sx={{ color: "white" }} />
        </IconButton>
        <Typography variant="h5" component="h1" sx={{ ml: 1 }}>
          Solve
        </Typography>
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
                <Typography variant="h6">
                  Possible paths:
                </Typography>
                <Box sx={{ overflowX: "auto" }}>
                  <Table sx={{ fontSize: "0.8rem" }}>
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ color: "black" }}>
                          <TableSortLabel
                            active={sortBy === "sequenceLength"}
                            direction={
                              sortBy === "sequenceLength"
                                ? sortDirection
                                : "asc"
                            }
                            onClick={() => handleSort("sequenceLength")}
                            sx={{
                              color: "black",
                              "& .MuiTableSortLabel-icon": {
                                color: "black !important",
                              },
                              "&.Mui-active": { color: "black" },
                            }}
                          >
                            Sequence Length
                          </TableSortLabel>
                        </TableCell>
                        <TableCell sx={{ color: "black" }}>
                          <TableSortLabel
                            active={sortBy === "sequenceScore"}
                            direction={
                              sortBy === "sequenceScore" ? sortDirection : "asc"
                            }
                            onClick={() => handleSort("sequenceScore")}
                            sx={{
                              color: "black",
                              "& .MuiTableSortLabel-icon": {
                                color: "black !important",
                              },
                              "&.Mui-active": { color: "black" },
                            }}
                          >
                            Sequence Score
                          </TableSortLabel>
                        </TableCell>
                        <TableCell sx={{ color: "black" }}>
                          <TableSortLabel
                            active={sortBy === "unusedScore"}
                            direction={
                              sortBy === "unusedScore" ? sortDirection : "asc"
                            }
                            onClick={() => handleSort("unusedScore")}
                            sx={{
                              color: "black",
                              "& .MuiTableSortLabel-icon": {
                                color: "black !important",
                              },
                              "&.Mui-active": { color: "black" },
                            }}
                          >
                            Unused Score
                          </TableSortLabel>
                        </TableCell>
                        <TableCell sx={{ color: "black" }}>
                          <TableSortLabel
                            active={sortBy === "unused"}
                            direction={
                              sortBy === "unused" ? sortDirection : "asc"
                            }
                            onClick={() => handleSort("unused")}
                            sx={{
                              color: "black",
                              "& .MuiTableSortLabel-icon": {
                                color: "black !important",
                              },
                              "&.Mui-active": { color: "black" },
                            }}
                          >
                            Unused Pieces
                          </TableSortLabel>
                        </TableCell>
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
                                <Typography
                                  variant="body2"
                                  sx={{ fontStyle: "italic", color: "black" }}
                                >
                                  {item.sequence}
                                </Typography>
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
    </Box>
  );
};

export default Solve;
