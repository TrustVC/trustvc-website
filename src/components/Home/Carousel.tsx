import { MutableRefObject, useRef } from 'react'
import { Swiper, SwiperSlide } from 'swiper/react'
import 'swiper/css'
import 'swiper/css/pagination'
import 'swiper/css/navigation'
import { Navigation, Pagination, Autoplay } from 'swiper/modules'
import type { Swiper as SwiperInstance } from 'swiper'
import LinkButton from '../../common/components/LinkButton'
import RightArrowIcon from '../../common/icons/RightArrowIcon'
import carouselData from '../../data/carouselData.json'

interface Stat {
  value: string
  label: string
}

interface ContentSection {
  title: string
  subtitle: string
  description: string
  link?: string
}

interface StatsGrid {
  topLeft: Stat
  topRight: Stat
  bottomLeft: Stat
  bottomRight: Stat
}

interface CarouselSlide {
  content: ContentSection
  image: string
  stats?: StatsGrid
}

const StatDisplay = ({ value, label }: Stat) => (
  <div>
    <div className="text-4xl font-bold text-trustvc-purple">{value}</div>
    <div className="py-2 text-md font-avenir-medium text-gray-600">{label}</div>
  </div>
)

const ContentSection = ({
  title,
  subtitle,
  description,
  link,
}: ContentSection) => {
  const isComingSoon = !link

  return (
    <div>
      <div className="flex min-h-[112px] flex-col text-4xl font-bold">
        <span className="py-1">{title}</span>
        <span className="text-trustvc-purple">{subtitle}</span>
      </div>

      <div className="pb-5 font-avenir-medium text-gray-600">{description}</div>

      <LinkButton
        href={link || ''}
        className={`
                    mt-3 w-fit 
                    flex items-center gap-2 
                    bg-trustvc-button-purple text-white
                    ${isComingSoon ? 'cursor-not-allowed opacity-50' : ''}
                `}
      >
        <span>{isComingSoon ? 'Coming Soon' : 'Learn More'}</span>
        {!isComingSoon && <RightArrowIcon />}
      </LinkButton>
    </div>
  )
}

const ComingSoonPlaceholder = () => (
  <div
    className="
        flex flex-col items-center text-center
        font-avenir-medium
        lg:flex-row lg:gap-8
        xl:flex-col xl:gap-0
    "
  >
    <div
      className="
            mx-auto flex w-fit
            rounded-xl border bg-gray-200
            px-3 py-2
            font-bold
            lg:mx-0
            xl:mx-auto
        "
    >
      Logo Here
    </div>

    <div className="py-4 lg:py-0">
      <div
        className="
                py-2 text-4xl font-bold text-trustvc-purple
                lg:py-0 lg:text-3xl
                xl:py-2 xl:text-4xl
            "
      >
        Coming Soon
      </div>
      <div
        className="
                py-1 text-md font-avenir-medium text-gray-600
                lg:mt-1
                xl:mt-0
            "
      >
        Stay Tuned
      </div>
    </div>
  </div>
)

const StatsGridDisplay = ({ stats }: { stats: StatsGrid }) => (
  <div
    className="
        flex flex-col items-center text-center
        font-avenir-medium
        lg:flex-row lg:gap-8
        xl:flex-col xl:gap-0
    "
  >
    <div
      className="
            mx-auto flex w-fit
            rounded-xl border bg-gray-200
            px-3 py-2
            font-bold
            lg:mx-0
            xl:mx-auto
        "
    >
      Logo Here
    </div>

    <div
      className="
            mx-auto mt-4 w-fit
            grid grid-cols-2 gap-x-10 gap-y-5
            lg:mt-0 lg:grid-cols-4
            xl:mt-4 xl:grid-cols-2 xl:gap-x-20
        "
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

    {/* Badge */}
    <div
      className="
            mx-auto mt-4 w-fit
            rounded-full border border-gray-300 bg-white
            px-3 py-2
            lg:mt-0
            xl:mt-4
        "
    >
      2025 Growth to date
    </div>
  </div>
)

const StatsSection = ({ stats }: { stats?: StatsGrid }) => (
  <div
    className="
        flex flex-col items-center justify-center
        md:min-w-[300px]
        lg:min-h-[100px]
        xl:min-w-[300px] xl:min-h-[300px]
    "
  >
    {stats ? <StatsGridDisplay stats={stats} /> : <ComingSoonPlaceholder />}
  </div>
)

const CarouselSlideItem = ({ content, image, stats }: CarouselSlide) => {
  return (
    <div className="relative mx-auto max-w-[1280px] overflow-hidden px-6">
      <div
        className="
                grid grid-cols-1
                lg:grid-cols-2
                xl:flex xl:flex-row xl:justify-between
            "
      >
        <div
          className="
                    z-20 p-6
                    flex items-center justify-center
                    min-h-[350px]
                    lg:max-w-[420px] lg:col-start-1 lg:row-start-1
                    xl:-mr-32
                "
        >
          <ContentSection {...content} />
        </div>

        <div
          className="
                    z-10 flex-1
                    lg:col-start-2 lg:row-start-1 lg:w-full
                    xl:max-h-[600px]
                "
        >
          <img
            src={image}
            alt="hero-carousel-image"
            className="
                            mx-auto
                            min-w-[600px] min-h-[300px]
                            translate-x-[-35%]
                            sm:min-h-[410px] sm:min-w-[820px] sm:translate-x-[-33%]
                            md:translate-x-[-25%]
                            lg:translate-x-[-40%]
                            xl:translate-x-[-25%] xl:translate-y-[5%]
                        "
          />
        </div>

        {/* Stats Section */}
        <div
          className="
                    z-20 p-6
                    lg:col-span-2
                    xl:col-span-1 xl:mt-0 xl:-ml-48
                "
        >
          <StatsSection stats={stats} />
        </div>
      </div>
    </div>
  )
}

const CarouselControlBar = ({
  swiperRef,
}: {
  swiperRef: MutableRefObject<SwiperInstance | null>
}) => {
  return (
    <div className="flex items-center justify-center gap-4 w-fit mx-auto">
      <button
        onClick={() => swiperRef.current?.slidePrev()}
        className="
                    flex h-6 w-6 items-center justify-center
                    text-gray-400 hover:text-trustvc-purple
                    transition-colors
                "
        aria-label="Previous slide"
      >
        <div className="rotate-180">
          <RightArrowIcon />
        </div>
      </button>

      <div className="hero-carousel-pagination flex items-center justify-center gap-2" />

      <button
        onClick={() => swiperRef.current?.slideNext()}
        className="
                    flex h-6 w-6 items-center justify-center
                    text-gray-400 hover:text-trustvc-purple
                    transition-colors
                "
        aria-label="Next slide"
      >
        <RightArrowIcon />
      </button>
    </div>
  )
}

const Carousel = () => {
  const swiperRef = useRef<SwiperInstance | null>(null)

  return (
    <div className="mx-auto my-10 max-w-[1440px] flex flex-col gap-6">
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
          <SwiperSlide key={index}>
            <CarouselSlideItem {...item} />
          </SwiperSlide>
        ))}
      </Swiper>

      <CarouselControlBar swiperRef={swiperRef} />
    </div>
  )
}

export default Carousel
