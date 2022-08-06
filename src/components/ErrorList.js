import { useState } from "react"
// @mui
import { Stack, SwipeableDrawer, TablePagination, Typography, useTheme } from "@mui/material"
import ErrorEntry from "./ErrorEntry"

export default function ErrorList({ open, onClose, jobs, handleQueueRemove, handleImport }) {
  const theme = useTheme()
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(5)

  const handleChangePage = (event, newPage) => {
    setPage(newPage)
  }

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10))
    setPage(0)
  }

  return (
    <SwipeableDrawer anchor="bottom" open={open} onClose={onClose}>
      <Stack
        sx={{
          p: {
            xs: 1,
            md: 3,
          },
        }}
        spacing={1}
      >
        {jobs.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)?.map((job, index) => (
          <ErrorEntry
            index={index}
            key={job.job_id}
            job={job}
            handleQueueRemove={handleQueueRemove}
            handleImport={handleImport}
          ></ErrorEntry>
        ))}
      </Stack>

      {jobs.length > 5 && (
        <TablePagination
          component="div"
          count={jobs.length || 0}
          page={page}
          onPageChange={handleChangePage}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      )}
    </SwipeableDrawer>
  )
}
