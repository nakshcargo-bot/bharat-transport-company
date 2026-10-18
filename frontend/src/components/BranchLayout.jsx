import { useEffect, useState } from 'react'
import { NavLink, useNavigate, useParams } from 'react-router-dom'
import { BRANCH_MODULES } from './branchModules'

export default function BranchLayout({ children }) {
  const { branchSlug } = useParams()
  const navigate = useNavigate()
  const [branch, setBranch] = useState(null)

  useEffect(() => {
    let session
    try {
      session = JSON.parse(localStorage.getItem('branch_session') || 'null')
    } catch (error) {
      console.error('Unable to read the saved branch session:', error)
      localStorage.removeItem('branch_session')
    }

    if (!session?.token || session.branch?.url_slug !== branchSlug) {
      navigate(`/branch-login/${branchSlug}`, { replace: true })
      return
    }
    setBranch(session.branch)
  }, [branchSlug, navigate])

  function logout() {
    localStorage.removeItem('branch_session')
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    navigate(`/branch-login/${branchSlug}`, { replace: true })
  }

  if (!branch) {
    return <main className="min-h-screen flex items-center justify-center bg-slate-100 text-slate-600">Loading branch workspace...</main>
  }

  return (
    <div className="min-h-screen bg-slate-100 lg:flex">
      <aside className="bg-slate-900 text-white lg:min-h-screen lg:w-72 lg:shrink-0">
        <div className="border-b border-white/10 px-5 py-5">
          <NavLink to={`/branch/${branchSlug}`} className="flex items-center gap-3">
            <span className="grid h-11 w-11 place-items-center rounded-xl bg-blue-600 text-xl font-extrabold">B</span>
            <span>
              <span className="block text-sm font-extrabold tracking-wide">BHARAT TRANSPORT</span>
              <span className="block text-xs text-slate-300">Branch Workspace</span>
            </span>
          </NavLink>
          <p className="mt-4 truncate text-sm font-semibold text-blue-200">{branch.branch_name}</p>
        </div>
        <nav aria-label="Branch modules" className="grid max-h-[70vh] grid-cols-2 gap-1 overflow-y-auto p-3 sm:grid-cols-3 lg:block lg:max-h-[calc(100vh-170px)]">
          {BRANCH_MODULES.map((module) => (
            <NavLink
              key={module.path || 'dashboard'}
              to={module.path ? `/branch/${branchSlug}/${module.path}` : `/branch/${branchSlug}`}
              end={module.path === ''}
              className={({ isActive }) => `flex min-h-10 items-center gap-2 rounded-lg px-3 py-2 text-sm transition ${
                isActive ? 'bg-blue-600 font-semibold text-white' : 'text-slate-300 hover:bg-white/10 hover:text-white'
              }`}
            >
              <span aria-hidden="true">{module.icon}</span>
              <span>{module.label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="border-t border-white/10 p-4">
          <button type="button" onClick={logout} className="w-full rounded-lg border border-white/20 px-4 py-2 text-left text-sm font-semibold text-slate-200 hover:bg-white/10">
            Log out
          </button>
        </div>
      </aside>
      <main className="min-w-0 flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
    </div>
  )
}
