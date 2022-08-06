import { useState } from "react"
// @mui
import { Stack, TablePagination } from "@mui/material"

import QueueEntry from "@components/QueueEntry"

export default function Queue({ jobs, handleQueueRemove, handleImport }) {
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(10)

  const handleChangePage = (event, newPage) => {
    setPage(newPage)
  }

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10))
    setPage(0)
  }

  return (
    <>
      <Stack spacing={1}>
        {jobs.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)?.map((job, index) => (
          <QueueEntry
            index={index}
            key={job.job_id}
            job={job}
            handleQueueRemove={handleQueueRemove}
            handleImport={handleImport}
          ></QueueEntry>
        ))}
      </Stack>

      {jobs.length > 10 && (
        <TablePagination
          component="div"
          count={jobs.length || 0}
          page={page}
          onPageChange={handleChangePage}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      )}
    </>
  )
}
