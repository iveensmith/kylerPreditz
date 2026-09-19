import { withPageSeo } from "@/lib/page-seo";
import { DayPredictionsPage } from "@/components/day/DayPredictionsPage";
import { dayPageMetadata } from "@/lib/seo";

export const revalidate = 900;

export async function generateMetadata() {
  return withPageSeo(dayPageMetadata("Thursday", "thursday-predictions"), "/thursday-predictions");
}

export default function Page() {
  return <DayPredictionsPage weekday={4} />;
}
