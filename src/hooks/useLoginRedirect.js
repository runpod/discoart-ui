import { useRouter } from "next/router"
import { useEffect } from "react"

export const useLoginRedirect = (loggedIn) => {
  const router = useRouter()
  useEffect(() => {
    if (!loggedIn) {
      router.replace("/")
    }
  }, [loggedIn])
}
