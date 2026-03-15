/**
 * Restart Banner Component
 *
 * Shows when session needs restart to pick up skill changes.
 */

interface RestartBannerProps {
  onRestart: () => void
}

export function RestartBanner({ onRestart }: RestartBannerProps) {
  return (
    <div className="bg-amber-50 border-l-4 border-amber-400 p-4 mb-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-amber-500 text-xl">&#9888;</span>
          <div>
            <h4 className="font-medium text-amber-800">Skills Updated</h4>
            <p className="text-sm text-amber-700">
              Restart the session to use the updated skills.
            </p>
          </div>
        </div>
        <button
          onClick={onRestart}
          className="px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors font-medium"
        >
          Restart Session
        </button>
      </div>
    </div>
  )
}
