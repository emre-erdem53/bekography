import { AboutGoogleReviewsSlider } from "@/components/about/about-google-reviews-slider";
import { Reveal } from "@/components/motion/reveal";
import { getFiveStarGoogleReviews } from "@/lib/google-reviews";

export async function AboutGoogleReviewsSection() {
  const { reviews, rating, totalRatings } = await getFiveStarGoogleReviews();

  if (reviews.length === 0) {
    return null;
  }

  return (
    <Reveal y={20} viewportAmount="some">
      <AboutGoogleReviewsSlider
        reviews={reviews}
        rating={rating}
        totalRatings={totalRatings}
      />
    </Reveal>
  );
}
