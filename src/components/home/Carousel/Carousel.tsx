import { MutableRefObject, useRef } from 'react'

import { Swiper, SwiperSlide } from 'swiper/react'
import 'swiper/css'
import 'swiper/css/pagination'
import 'swiper/css/navigation'
import { Navigation, Pagination, Autoplay } from 'swiper/modules'
import type { Swiper as SwiperInstance } from 'swiper'
import LinkButton from '../../common/LinkButton'
import RightArrowIcon from '../../icons/RightArrowIcon'
import carouselData from '../../../data/carousel.json'
import clsx from 'clsx'

interface Stat {
  value: string
  label: string
}

interface ContentSectionProps {
  title: string
  subtitle: string
  description: string
  link?: string
}

interface StatsGridProps {
  topLeft: Stat
  topRight: Stat
  bottomLeft: Stat
  bottomRight: Stat
}

interface CarouselSlideProps {
  isDarkMode: boolean
  content: ContentSectionProps
  image: string
  stats?: StatsGridProps
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
    <div className="text-4xl font-bold text-primary-60">
      <span>{value}</span>
    </div>
    <div className={clsx('py-2 text-md font-avenir-medium text-neutral-30')}>
      <span>{label}</span>
    </div>
  </div>
)

const ContentSection = ({
  isDarkMode,
  title,
  subtitle,
  description,
  link,
}: ContentSectionProps & { isDarkMode: boolean }) => {
  const isComingSoon = !link

  return (
    <div>
      <div
        className={clsx(
          'flex flex-col min-h-[112px] text-4xl font-bold',
          isDarkMode ? 'text-neutral-60' : 'text-neutral-10'
        )}
      >
        <span className="py-1">{title}</span>
        <span className="text-primary-60">{subtitle}</span>
      </div>
      <div
        className={clsx(
          'pb-5 font-avenir',
          isDarkMode ? 'text-neutral-50' : 'text-neutral-20'
        )}
      >
        <span>{description}</span>
      </div>
      <div className="mt-4">
        <LinkButton
          href={link}
          isDarkMode={isDarkMode}
          isDisabled={isComingSoon}
        >
          <span>{isComingSoon ? 'Coming Soon' : 'Learn More'}</span>
          {!isComingSoon && (
            <span className="ml-2">
              <RightArrowIcon height={24} width={20} />
            </span>
          )}
        </LinkButton>
      </div>
    </div>
  )
}

const ComingSoonPlaceholder = ({ isDarkMode }: { isDarkMode: boolean }) => (
  <div
    className="flex flex-col items-center text-center font-avenir-medium
      lg:flex-row lg:gap-8 lg:text-center
      xl:flex-col xl:gap-0 xl:text-center"
  >
    <div
      className={clsx(
        'flex mx-auto px-3 py-2 w-fit rounded-xl',
        isDarkMode
          ? 'bg-neutral-10 text-neutral-30'
          : 'bg-neutral-60 text-neutral-10',
        'lg:mx-0',
        'xl:mx-auto'
      )}
    >
      <span>Logo Here</span>
    </div>
    <div className="py-4 lg:py-0">
      <div className="py-2 text-4xl font-bold text-primary-60 lg:py-0 lg:text-3xl xl:py-2 xl:text-4xl">
        <span>Coming Soon</span>
      </div>
      <div
        className={clsx(
          'py-1 text-md font-avenir lg:mt-1 xl:mt-0',
          isDarkMode ? 'text-neutral-30' : 'text-neutral-10'
        )}
      >
        <span>Stay Tuned</span>
      </div>
    </div>
  </div>
)

const StatsGridDisplay = ({
  isDarkMode,
  stats,
}: {
  isDarkMode: boolean
  stats: StatsGridProps
}) => (
  <div
    className="flex flex-col items-center text-center font-avenir-medium
      lg:grid lg:grid-cols-[auto_1fr] lg:items-center lg:gap-x-8 lg:text-center
      xl:flex xl:flex-col xl:gap-0 xl:text-center"
  >
    <div
      className={clsx(
        'flex mx-auto px-3 py-2 w-fit rounded-xl',
        isDarkMode
          ? 'bg-neutral-10 text-neutral-30'
          : 'bg-neutral-60 text-neutral-10',
        'lg:mx-0',
        'xl:mx-auto'
      )}
    >
      <span>Logo Here</span>
    </div>
    <div
      className="grid grid-cols-2 mx-auto mt-4 gap-x-10 gap-y-5 w-fit
        lg:grid-cols-4 lg:mt-0
        xl:grid-cols-2 xl:mt-4 xl:gap-x-20"
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
    <div
      className={clsx(
        'mx-auto mt-4 px-3 py-2 w-fit rounded-full',
        isDarkMode
          ? 'bg-neutral-10 text-neutral-30'
          : 'bg-neutral-60 text-neutral-10',
        'lg:col-span-2 lg:row-start-2 lg:mt-4',
        'xl:col-span-1 xl:row-auto xl:mt-4'
      )}
    >
      <span>2025 Growth to date</span>
    </div>
  </div>
)

const StatsSection = ({
  isDarkMode,
  stats,
}: {
  isDarkMode: boolean
  stats?: StatsGridProps
}) => (
  <div className="flex flex-col justify-center items-center md:min-w-[300px] lg:min-h-[100px] xl:min-w-[300px] xl:min-h-[300px]">
    {stats ? (
      <StatsGridDisplay isDarkMode={isDarkMode} stats={stats} />
    ) : (
      <ComingSoonPlaceholder isDarkMode={isDarkMode} />
    )}
  </div>
)

const CarouselSlide = ({
  isDarkMode,
  content,
  image,
  stats,
}: CarouselSlideProps) => {
  return (
    <div className="relative mx-auto px-6 max-w-[1280px]">
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:flex xl:flex-row xl:justify-between">
        <div className="z-20 justify-center items-center p-6 min-h-[350px] lg:col-start-1 lg:row-start-1 lg:max-w-[420px]">
          <ContentSection isDarkMode={isDarkMode} {...content} />
        </div>
        <div className="z-10 flex-1 lg:col-start-2 lg:row-start-1 lg:w-full xl:max-h-[600px]">
          <div className="relative overflow-hidden min-h-[400px] md:overflow-visible xl:max-h-[600px]">
            <img
              src={image}
              alt="hero-carousel-image"
              className="absolute left-1/2 top-1/2 min-w-[750px] min-h-[300px] translate-x-[-65%] translate-y-[-50%] transition-all
                xl:translate-x-[-70%]"
            />
          </div>
        </div>
        <div className="z-20 pt-6 lg:col-span-2 xl:col-span-1 min-w-[350px]">
          <StatsSection isDarkMode={isDarkMode} stats={stats} />
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
        aria-label="carousel-prev-button"
        onClick={() => swiperRef.current?.slidePrev()}
        className="flex items-center justify-center h-6 w-6 hover:text-primary-60"
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
        aria-label="carousel-next-button"
        onClick={() => swiperRef.current?.slideNext()}
        className="flex items-center justify-center h-6 w-6 hover:text-primary-60"
      >
        <RightArrowIcon />
      </button>
    </div>
  )
}

const Carousel = ({ isDarkMode }: CarouselProps) => {
  const swiperRef = useRef<SwiperInstance | null>(null)

  return (
    <div className="flex flex-col mx-auto mt-10 mb-20 gap-6 max-w-[1440px]">
      <div>
        <Swiper
          modules={[Pagination, Navigation, Autoplay]}
          autoplay={{ delay: 5000, disableOnInteraction: true }}
          slidesPerView={1}
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
