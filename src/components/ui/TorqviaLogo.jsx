export default function TorqviaLogo({ size = 40, className }) {
  return (
    <img
      src="/torqvia-logo.png?v=2"
      width={size}
      height={size}
      alt="Torqvia"
      className={className}
      style={{ objectFit: 'contain' }}
    />
  )
}
