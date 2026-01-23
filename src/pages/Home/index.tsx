import BuiltForDev from '../../components/Home/BuiltForDev'
import Carousel from '../../components/Home/Carousel'

const Home = () => {
  return (
    <div className="container mx-auto px-4 py-16">
      <div className="max-w-[1440px] mx-auto">
        <Carousel />
        <BuiltForDev />
      </div>
    </div>
  )
}

export default Home
