import HeroSection from '../../components/home/HeroSection'
import VerifySection from '../../components/home/VerifySection'
import Carousel from '../../components/home/Carousel'
import BuiltForDev from '../../components/home/BuiltForDev'

interface HomeProps {
  isDarkMode: boolean
}

const Home = ({ isDarkMode }: HomeProps) => {
  return (
    <>
      <div
        style={{
          marginTop: '88px',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <HeroSection isDarkMode={isDarkMode} />
        <VerifySection isDarkMode={isDarkMode} />
      </div>
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-[1440px] mx-auto">
          <Carousel isDarkMode={isDarkMode} />
          <BuiltForDev isDarkMode={isDarkMode} />
        </div>
      </div>
    </>
  )
}

export default Home
