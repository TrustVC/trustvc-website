import React, { ReactNode } from 'react'

export type MockSwiperApi = {
  slideNext: () => void
  slidePrev: () => void
}

export function MockSwiper({
  children,
  onSwiper,
}: {
  children: ReactNode
  // eslint-disable-next-line no-unused-vars
  onSwiper?: (swiper: MockSwiperApi) => void
}) {
  const [slideNumber, setSlideNumber] = React.useState(0)

  const slides = React.Children.toArray(children)
  const totalSlides = slides.length

  const swiper = React.useMemo<MockSwiperApi>(
    () => ({
      slideNext: () =>
        setSlideNumber(i => (totalSlides === 0 ? 0 : (i + 1) % totalSlides)),
      slidePrev: () =>
        setSlideNumber(i =>
          totalSlides === 0 ? 0 : (i - 1 + totalSlides) % totalSlides
        ),
    }),
    [totalSlides]
  )

  // Call onSwiper once when the Swiper object is ready
  React.useEffect(() => {
    onSwiper?.(swiper)
  }, [onSwiper, swiper])

  return <div data-testid="swiper">{slides[slideNumber]}</div>
}

export function MockSwiperSlide({
  children,
  ...rest
}: {
  children: ReactNode
}) {
  return (
    <div data-testid="swiper-slide" {...rest}>
      {children}
    </div>
  )
}
