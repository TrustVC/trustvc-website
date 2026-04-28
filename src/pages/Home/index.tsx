import HeroSection from '../../components/home/HeroSection'
import VerifySection from '../../components/home/VerifySection'
import Carousel from '../../components/home/Carousel'
import BuiltForDev from '../../components/home/BuiltForDev'

interface HomeProps {
  isDarkMode: boolean
}

const Home = ({ isDarkMode }: HomeProps) => {
  return (
    <div className="w-full mx-auto">
      <div className="flex flex-col items-center p-[80px] max-w-[1440px] mx-auto">
        <HeroSection isDarkMode={isDarkMode} />
        <VerifySection isDarkMode={isDarkMode} />
        <Carousel isDarkMode={isDarkMode} />
        <BuiltForDev isDarkMode={isDarkMode} />
      </div>
    </div>
  )
}

export default Home
