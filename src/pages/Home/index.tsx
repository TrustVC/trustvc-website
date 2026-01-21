
import BuiltForDev from "../../components/Home/BuiltForDev";

const Home = () => {
    return (
        <div className="min-h-screen bg-cover bg-gradient-to-br from-blue-50 to-indigo-100"
            style={{ backgroundImage: "url('/background.png')" }}>
            <div className="container mx-auto px-4 py-16">
                <div className="max-w-4xl mx-auto">
                    <BuiltForDev />
                </div>
            </div>
        </div>
    )
}

export default Home;