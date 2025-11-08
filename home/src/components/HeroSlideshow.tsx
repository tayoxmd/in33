import { useEffect, useState } from "react";
import vocoMakkah1 from "@/assets/slideshow/voco-makkah-1.webp";
import vocoMakkah2 from "@/assets/slideshow/voco-makkah-2.webp";
import rafflesMakkah from "@/assets/slideshow/raffles-makkah.jpg";
import makkahView from "@/assets/slideshow/makkah-view.jpg";
import pullmanZamzam from "@/assets/slideshow/pullman-zamzam.jpg";
import madinah from "@/assets/slideshow/madinah.jpg";
import rafflesSuite from "@/assets/slideshow/raffles-suite.jpg";
import holySite from "@/assets/slideshow/holy-site.jpg";
import kaaba from "@/assets/slideshow/kaaba.jpeg";

const slides = [
  { type: "image", image: holySite, title: "المسجد الحرام" },
  { type: "image", image: madinah, title: "المسجد النبوي" },
  { type: "image", image: makkahView, title: "برج الساعة" },
  { type: "image", image: vocoMakkah1, title: "فنادق فاخرة" },
  { type: "image", image: vocoMakkah2, title: "إطلالات مميزة" },
  { type: "image", image: rafflesMakkah, title: "رافلز مكة" },
  { type: "image", image: pullmanZamzam, title: "بولمان زمزم" },
  { type: "image", image: rafflesSuite, title: "أجنحة فاخرة" },
];

export const HeroSlideshow = () => {
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    // Slideshow timer - 5 seconds per slide
    const slideInterval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);

    return () => {
      clearInterval(slideInterval);
    };
  }, []);

  return (
    <div className="absolute inset-0 z-0 overflow-hidden">
      {/* Slideshow Items */}
      {slides.map((slide, index) => (
        <div
          key={index}
          className={`absolute inset-0 transition-opacity duration-1000 ${
            index === currentSlide ? "opacity-100" : "opacity-0"
          }`}
        >
          <img
            src={slide.image}
            alt={slide.title}
            className="w-full h-full object-cover animate-slowPan"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/70" />
        </div>
      ))}

      {/* Slide Indicator Dots */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex gap-2 z-20">
        {slides.map((_, index) => (
          <div
            key={index}
            className={`w-2 h-2 rounded-full transition-all duration-300 ${
              index === currentSlide
                ? "bg-white w-8"
                : "bg-white/50 hover:bg-white/75"
            }`}
          />
        ))}
      </div>

      <style>{`
        @keyframes slowPan {
          0% {
            transform: scale(1.1) translateX(2%);
          }
          100% {
            transform: scale(1.1) translateX(-2%);
          }
        }

        .animate-slowPan {
          animation: slowPan 20s ease-in-out infinite alternate;
        }
      `}</style>
    </div>
  );
};
