import { MutableRefObject, useRef } from 'react'

import { Swiper, SwiperSlide } from 'swiper/react'
import 'swiper/css'
import 'swiper/css/pagination'
import 'swiper/css/navigation'
import { Navigation, Pagination, Autoplay } from 'swiper/modules'
import type { Swiper as SwiperInstance } from 'swiper'
import { LinkButton } from '../../common/Button'
import RightArrowIcon from '../../icons/RightArrowIcon'
import carouselData from '../../../data/carousel.json'
import clsx from 'clsx'

interface Stat {
  value: string
  label: string
}

interface StatsGridProps {
  topLeft: Stat
  topRight: Stat
  bottomLeft: Stat
  bottomRight: Stat
}

interface CarouselSlideProps {
  isDarkMode: boolean
  logo: string
  title: string
  subtitle: string
  description: string
  image: string
  stats?: StatsGridProps
  link?: string
}

interface CarouselControlBarProps {
  isDarkMode: boolean
  swiperRef: MutableRefObject<SwiperInstance | null>
}
interface CarouselProps {
  isDarkMode: boolean
}

const StatDisplay = ({ value, label }: Stat) => (
  <div>
    <div className="text-4xl font-extrabold text-primary-60">
      <span>{value}</span>
    </div>
    <div className={clsx('text-sm text-neutral-30 max-w-28')}>
      <span>{label}</span>
    </div>
  </div>
)

const StatsGridDisplay = ({ stats }: { stats: StatsGridProps }) => (
  <div className="flex flex-col items-center text-center font-avenir pb-8">
    <div
      className="grid grid-cols-2 mx-auto mt-4 gap-x-10 gap-y-5 w-fit
        sm:grid-cols-4 
        md:grid-cols-4 md:mt-0
        lg:grid-cols-2
        xl:grid-cols-2 xl:gap-x-20"
    >
      <StatDisplay value={stats.topLeft.value} label={stats.topLeft.label} />
      <StatDisplay value={stats.topRight.value} label={stats.topRight.label} />
      <StatDisplay
        value={stats.bottomLeft.value}
        label={stats.bottomLeft.label}
      />
      <StatDisplay
        value={stats.bottomRight.value}
        label={stats.bottomRight.label}
      />
    </div>
  </div>
)

const CarouselSlide = ({
  isDarkMode,
  logo,
  title,
  subtitle,
  description,
  image,
  stats,
  link,
}: CarouselSlideProps) => {
  return (
    <div className="relative px-2 max-w-[1280px] m-4 flex flex-col lg:flex-row sm:min-h-[444px] md:min-h-[410px] lg:min-h-[380px] xl:min-h-[360px]">
      <div className="inset-0 z-20 w-full h-full flex flex-col lg:flex-row">
        <div className="w-full">
          <img
            src={logo}
            alt={`${title}-${subtitle}-logo`}
            className="lg:pl-8 pt-8 lg:pt-16 pb-4"
          />
          <div className="lg:pl-8 py-4 text-3xl lg:text-4xl font-bold text-neutral-10">
            <div className="py-1">{title}</div>
            <div className="text-primary-60">{subtitle}</div>
          </div>
          {link && (
            <div className="lg:pl-8 pt-4">
              <LinkButton
                href={link}
                isDarkMode={isDarkMode}
                aria-label={`Learn more — ${title}`}
              >
                <span className="pr-2">Learn more</span>
                <RightArrowIcon className="w-4" />
              </LinkButton>
            </div>
          )}
        </div>
      </div>
      <div className="sm:absolute z-10 flex-1 lg:col-start-2 lg:row-start-1 sm:w-full xl:max-h-[600px]">
        <div className="relative overflow-hidden md:overflow-visible sm:h-[400px] xl:max-h-[600px]">
          <img
            src={image}
            alt={`hero-image-${title}`}
            className="translate-y-4 -translate-x-[39%] sm:translate-x-[18%] sm:top-1 md:top-1/3 md:left-1/3 max-w-[500px] lg:w-[600px] xl:max-w-[800px] xl:w-[640px] md:translate-x-56 md:translate-y-1 lg:translate-x-40 lg:translate-y-12 xl:translate-x-52 xl:translate-y-8"
          />
        </div>
      </div>
      <div>
        <div className="relative h-full lg:w-[58%] z-20 ml-auto flex justify-center items-center flex-col text-neutral-20 font-avenir font-medium sm:pt-4 lg:pt-0">
          {stats && <StatsGridDisplay stats={stats} />}
          <div className="px-4 text-lg leading-6 sm:pt-4 lg:pl-12 lg:pt-0">
            {description}
          </div>
        </div>
      </div>
    </div>
  )
}

const CarouselControlBar = ({ swiperRef }: CarouselControlBarProps) => {
  return (
    <div
      className="flex items-center justify-center gap-4 text-neutral-30"
      style={{ width: 'fit-content', margin: '0 auto' }}
    >
      <button
        type="button"
        aria-label="carousel-prev-button"
        onClick={() => swiperRef.current?.slidePrev()}
        className="flex items-center justify-center h-6 w-6 bg-transparent border-none outline-none focus-visible:outline-2 focus-visible:outline-primary-60 focus-visible:rounded hover:text-primary-60"
      >
        <div className="rotate-180">
          <RightArrowIcon />
        </div>
      </button>
      <div
        aria-label="carousel-pagination"
        className="hero-carousel-pagination"
        // Inline style to override default pagination styles
        style={{
          display: 'flex',
          gap: '0.5rem',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      />
      <button
        type="button"
        aria-label="carousel-next-button"
        onClick={() => swiperRef.current?.slideNext()}
        className="flex items-center justify-center h-6 w-6 bg-transparent border-none outline-none focus-visible:outline-2 focus-visible:outline-primary-60 focus-visible:rounded hover:text-primary-60"
      >
        <RightArrowIcon />
      </button>
    </div>
  )
}

const Carousel = ({ isDarkMode }: CarouselProps) => {
  const swiperRef = useRef<SwiperInstance | null>(null)

  return (
    <div className="flex flex-col mx-auto mt-10 mb-20 gap-6 max-w-[1340px] w-full">
      <div className="w-full">
        <Swiper
          modules={[Pagination, Navigation, Autoplay]}
          autoplay={{ delay: 5000, disableOnInteraction: true }}
          slidesPerView={1}
          centeredSlides={true}
          autoHeight={true}
          loop={true}
          onSwiper={swiper => {
            swiperRef.current = swiper
          }}
          pagination={{
            clickable: true,
            el: '.hero-carousel-pagination',
          }}
        >
          {carouselData.items.map((item, index) => (
            <SwiperSlide aria-label={`carousel-slide-${index}`} key={index}>
              <CarouselSlide isDarkMode={isDarkMode} {...item} />
            </SwiperSlide>
          ))}
        </Swiper>
      </div>
      <CarouselControlBar isDarkMode={isDarkMode} swiperRef={swiperRef} />
    </div>
  )
}

export default Carousel
