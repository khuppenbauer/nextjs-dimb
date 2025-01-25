import MapComponent from '@/components/Map'
  
export default async function PageApp() {
  const baseUrl: string = process.env.NEXT_PUBLIC_BASE_URL as string
  const url = `${baseUrl}/api/igs?simplified=0.004`
  return (
    <MapComponent baseUrl={baseUrl} url={url} controls={['search', 'locate']} label={false} />
  )
}
