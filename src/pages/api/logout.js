import Cookies from "cookies"

const handler = async (req, res) => {
  try {
    const cookies = new Cookies(req, res)
    // Get a cookie
    cookies.set("password", "", { maxAge: 0 })

    res.status(200).json({
      success: true,
    })
  } catch (e) {
    res.status(200).json({
      success: false,
    })
  }
}

export default handler
