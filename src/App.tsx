import BuiltForDev from "./components/Home/BuiltForDev";

function App() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-5xl font-bold text-gray-900 mb-4 text-center">
            TrustVC
          </h1>
          <BuiltForDev />
        </div>
      </div>
    </div>
  )
}

export default App
