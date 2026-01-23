import React from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import 'swiper/css';
import 'swiper/css/pagination';
import 'swiper/css/navigation';
import { Pagination } from 'swiper/modules';
import LinkButton from '../../common/components/LinkButton';
import RightArrowIcon from '../../common/icons/RightArrowIcon';
import carouselData from '../../../public/data/carouselData.json';

interface Stat {
    value: string;
    label: string;
}

interface ContentSection {
    title: string;
    subtitle: string;
    description: string;
    ctaUrl?: string;
}

interface StatsGrid {
    topLeft: Stat;
    topRight: Stat;
    bottomLeft: Stat;
    bottomRight: Stat;
}

interface CarouselSlide {
    content: ContentSection;
    image: string;
    stats?: StatsGrid;
}

const StatDisplay = ({ value, label }: Stat) => (
    <div>
        <div className="text-4xl font-bold text-trustvc-purple">
            <span>{value}</span>
        </div>
        <div className="py-2 text-md font-avenir-medium text-gray-600">
            <span>{label}</span>
        </div>
    </div>
);

const ContentSection = ({
    title,
    subtitle,
    description,
    ctaUrl
}: ContentSection) => {
    const isComingSoon = !ctaUrl;

    return (
        <div>
            <div className="flex min-h-[112px] flex-col text-4xl font-bold">
                <span className="py-1">{title}</span>
                <span className="text-trustvc-purple">{subtitle}</span>
            </div>
            <div className="pb-5 font-avenir-medium text-gray-600">
                <span>{description}</span>
            </div>
            <LinkButton
                href={ctaUrl || ""}
                className={`mt-3 w-fit items-center gap-2 bg-trustvc-button-purple text-white ${isComingSoon ? 'cursor-not-allowed opacity-50' : ''
                    }`}
            >
                <span>{isComingSoon ? 'Coming Soon' : 'Learn More'}</span>
                {!isComingSoon && <RightArrowIcon />}
            </LinkButton>
        </div>
    );
};

const StatsDisplay = ({ stats }: { stats: StatsGrid }) => (
    <div className="flex h-full flex-col items-center justify-center text-center font-avenir-medium">
        <div className="mx-auto flex w-fit items-center justify-center rounded-lg border bg-gray-200 px-3 py-2 font-bold">
            <span>Logo Here</span>
        </div>
        <div className="mx-auto mt-4 grid w-fit grid-cols-2 items-center justify-items-center gap-x-20 gap-y-5">
            <StatDisplay value={stats.topLeft.value} label={stats.topLeft.label} />
            <StatDisplay value={stats.topRight.value} label={stats.topRight.label} />
            <StatDisplay value={stats.bottomLeft.value} label={stats.bottomLeft.label} />
            <StatDisplay value={stats.bottomRight.value} label={stats.bottomRight.label} />
        </div>
        <div className="mx-auto mt-4 w-fit rounded-full border border-gray-300 bg-white px-3 py-2">
            <span>2025 Growth to date</span>
        </div>
    </div>
);

const ComingSoonPlaceholder = () => (
    <div className="flex h-full flex-col items-center justify-center text-center font-avenir-medium">
        <div className="mx-auto flex w-fit items-center justify-center rounded-lg border bg-gray-200 px-3 py-2 font-bold">
            <span>Logo Here</span>
        </div>
        <div className="py-4">
            <div className="py-2 text-4xl font-bold text-trustvc-purple">
                <span>Coming Soon</span>
            </div>
            <div className="py-1 text-md font-avenir-medium text-gray-600">
                <span>Stay Tuned</span>
            </div>
        </div>
    </div>
);

const StatsSection = ({ stats }: { stats?: StatsGrid }) => (
    <div className="flex h-full flex-col justify-center">
        {stats ? (
            <StatsDisplay stats={stats} />
        ) : (
            <div className="flex h-full items-center justify-center">
                <div className="min-w-[420px]">
                    <ComingSoonPlaceholder />
                </div>
            </div>
        )}
    </div>
);

const CarouselSlide = ({ content, image, stats }: CarouselSlide) => {
    const focalX = 67;
    const focalY = 45;
    const translateX = 50 - focalX;
    const translateY = 50 - focalY;

    return (
        <div className="relative mx-auto max-w-[1280px] overflow-hidden px-6 py-10">
            <div
                className="relative mx-auto flex max-w-3xl items-center justify-center"
                style={{
                    transform: `translateX(${translateX}%) translateY(${translateY}%)`
                }}
            >
                <img src={image} alt="" className="max-h-full max-w-full object-contain" />
            </div>
            <div className="absolute top-1/2 left-0 right-0 z-10 flex -translate-y-1/2 items-stretch justify-between">
                <div className="max-w-[420px] min-h-[320px] p-5">
                    <ContentSection
                        title={content.title}
                        subtitle={content.subtitle}
                        description={content.description}
                        ctaUrl={content.ctaUrl}
                    />
                </div>
                <div className="max-w-[420px] min-h-[320px] p-5">
                    <StatsSection stats={stats} />
                </div>
            </div>
        </div>
    );
};

const Carousel = () => (
    <div className="mx-auto my-10 max-w-[1440px]">
        <Swiper
            slidesPerView={1}
            loop={true}
            pagination={{ clickable: true }}
            modules={[Pagination]}
        >
            {carouselData.items.map((item, index) => (
                <SwiperSlide key={index}>
                    <CarouselSlide
                        content={item.content}
                        image={item.image}
                        stats={item.stats}
                    />
                </SwiperSlide>
            ))}
        </Swiper>
    </div>
);

export default Carousel;