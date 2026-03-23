export async function embed(text: string): Promise<number[]> {
  const res = await fetch('https://api.voyageai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.VOYAGE_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'voyage-law-2',
      input: text,
    }),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Voyage AI embeddings error ${res.status}: ${err}`)
  }

  const data = await res.json()
  return data.data[0].embedding
}
