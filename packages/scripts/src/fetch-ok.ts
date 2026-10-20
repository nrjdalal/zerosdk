// Fetches url and returns the response, failing with its status when it is not ok.
export const fetchOk = async (url: string) => {
  const response = await fetch(url)
  if (!response.ok) throw new Error(`${response.status} ${url}`)
  return response
}
