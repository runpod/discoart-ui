import { getAuth } from "@utils/getAuth"

const handler = async (req, res) => {
  try {
    const { loggedIn } = await getAuth({ req, res })

    res.status(200).json({
      loggedIn,
    })
  } catch (e) {
    res.status(200).json({
      success: false,
    })
  }
}

export default handler
