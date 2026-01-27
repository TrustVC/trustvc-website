import BuiltForDev from '../../components/HomePageContent/BuiltForDev'
import Carousel from '../../components/HomePageContent/Carousel'

interface HomeProps {
  isDarkMode: boolean
}

const Home = ({ isDarkMode }: HomeProps) => {
  return (
    <div className="container mx-auto px-4 py-16">
      <div className="max-w-[1440px] mx-auto">
        <Carousel isDarkMode={isDarkMode} />
        <BuiltForDev isDarkMode={isDarkMode} />
      </div>
    </div>
  )
}

export default Home
