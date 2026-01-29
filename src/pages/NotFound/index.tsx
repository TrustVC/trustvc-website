interface NotFoundProps {
  isDarkMode: boolean
}

const NotFound = ({ isDarkMode }: NotFoundProps) => {
  return (
    <div className="w-full px-4 flex justify-center">
      <div className="max-w-2xl text-center py-24">
        <h1
          className={`text-4xl sm:text-5xl font-bold mt-4 ${
            isDarkMode ? 'text-neutral-60' : 'text-neutral-10'
          }`}
        >
          Page not found
        </h1>
        <p
          className={`mt-4 text-lg font-avenir ${
            isDarkMode ? 'text-neutral-40' : 'text-neutral-20'
          }`}
        >
          The page you are looking for doesn’t exist or has been moved.
        </p>
        <a
          href="/"
          className="inline-flex mt-8 px-6 py-3 rounded-full font-bold bg-primary-60 text-white hover:opacity-90"
        >
          Back to Home
        </a>
      </div>
    </div>
  )
}

export default NotFound
