import { Link } from 'react-router-dom'
import { Wrench, ArrowRight, Shield, Zap, Users, Car } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import TorqviaLogo from '../components/ui/TorqviaLogo'

export default function Home() {
  const { user } = useAuth()

  return (
    <div className="py-12">
      <div className="text-center max-w-3xl mx-auto mb-20">
        <div className="flex justify-center mb-6">
          <div className="flex items-center gap-3 bg-zinc-900/80 border border-zinc-800 rounded-2xl px-5 py-3">
            <TorqviaLogo size={36} />
            <div className="text-left">
              <span className="text-xl font-bold text-white tracking-tight">Torqvia</span>
              <p className="text-[10px] text-zinc-500 tracking-widest uppercase">Automotive Community</p>
            </div>
          </div>
        </div>
        <h1 className="text-5xl font-bold text-white mb-6 leading-tight">
          Connect your vehicle<br />
          <span className="text-brand-400">with the right pros</span>
        </h1>
        <p className="text-zinc-400 text-lg mb-8 max-w-xl mx-auto">
          Torqvia connects car owners with verified service providers. List your vehicle, receive tailored offers, and get the work done.
        </p>
        <div className="flex items-center justify-center gap-3">
          {user ? (
            <Link to="/dashboard" className="btn-primary flex items-center gap-2 text-base px-6 py-3">
              Go to Dashboard
              <ArrowRight className="h-4 w-4" />
            </Link>
          ) : (
            <>
              <Link to="/register" className="btn-primary flex items-center gap-2 text-base px-6 py-3">
                Get Started Free
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link to="/login" className="btn-secondary text-base px-6 py-3">
                Sign In
              </Link>
            </>
          )}
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-6 mb-16">
        <div className="card border-brand-500/20 hover:border-brand-500/40 transition-colors">
          <div className="bg-brand-500/10 w-12 h-12 rounded-xl flex items-center justify-center mb-4">
            <Car className="h-6 w-6 text-brand-400" />
          </div>
          <h3 className="text-lg font-semibold text-white mb-2">For Car Owners</h3>
          <p className="text-zinc-500 text-sm mb-4">List your vehicle, describe what you need, and receive competitive offers from qualified service providers in your area.</p>
          <ul className="space-y-1.5 text-sm text-zinc-400">
            {['Create listings in minutes', 'Receive & compare offers', 'Accept or reject with one click'].map(item => (
              <li key={item} className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 bg-brand-500 rounded-full" />
                {item}
              </li>
            ))}
          </ul>
        </div>

        <div className="card border-zinc-700/50 hover:border-zinc-600 transition-colors">
          <div className="bg-zinc-800 w-12 h-12 rounded-xl flex items-center justify-center mb-4">
            <Wrench className="h-6 w-6 text-zinc-300" />
          </div>
          <h3 className="text-lg font-semibold text-white mb-2">For Service Pros</h3>
          <p className="text-zinc-500 text-sm mb-4">Browse vehicle listings, find work that matches your skills, and grow your client base through Torqvia.</p>
          <ul className="space-y-1.5 text-sm text-zinc-400">
            {['Browse all open listings', 'Send targeted offers', 'Track your offer pipeline'].map(item => (
              <li key={item} className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 bg-zinc-500 rounded-full" />
                {item}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 text-center">
        {[
          { icon: Shield, title: 'Secure', desc: 'End-to-end encrypted communication and verified accounts' },
          { icon: Zap, title: 'Fast', desc: 'Get your first offer within hours of listing' },
          { icon: Users, title: 'Community', desc: 'Growing network of owners and pros across the country' },
        ].map(({ icon: Icon, title, desc }) => (
          <div key={title} className="p-6">
            <Icon className="h-6 w-6 text-brand-400 mx-auto mb-3" />
            <h4 className="font-semibold text-white mb-1">{title}</h4>
            <p className="text-xs text-zinc-500">{desc}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
