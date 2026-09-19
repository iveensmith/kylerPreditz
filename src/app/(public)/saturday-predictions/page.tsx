import { withPageSeo } from "@/lib/page-seo";
import { DayPredictionsPage } from "@/components/day/DayPredictionsPage";
import { dayPageMetadata } from "@/lib/seo";

export const revalidate = 900;

export async function generateMetadata() {
  return withPageSeo(dayPageMetadata("Saturday", "saturday-predictions"), "/saturday-predictions");
}

export default function Page() {
  return <DayPredictionsPage weekday={6} />;
}
