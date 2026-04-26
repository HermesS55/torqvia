export default function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      {Icon && <Icon className="h-12 w-12 text-zinc-600 mb-4" />}
      <h3 className="text-lg font-semibold text-zinc-300 mb-1">{title}</h3>
      {description && <p className="text-zinc-500 text-sm mb-6 max-w-sm">{description}</p>}
      {action}
    </div>
  )
}
