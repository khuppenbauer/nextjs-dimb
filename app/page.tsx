import MapComponent from '@/components/Map'

export default async function Home() {
  const baseUrl: string = process.env.NEXT_PUBLIC_BASE_URL as string
  const url = `${baseUrl}/api/igs?simplified=0.005`
  return (
    <MapComponent baseUrl={baseUrl} url={url} controls={['search', 'locate']} label={false} />
  )
}