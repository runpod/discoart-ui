import { useState } from "react"

const useOpenState = () => {
  const [open, setOpen] = useState(false)

  const toggleModal = () => (open ? setOpen(false) : setOpen(true))

  const openModal = () => setOpen(true)
  const closeModal = () => setOpen(false)

  return [open, openModal, closeModal, toggleModal]
}

export default useOpenState
