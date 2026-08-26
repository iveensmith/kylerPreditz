import { DayPredictionsPage } from "@/components/day/DayPredictionsPage";
import { dayPageMetadata } from "@/lib/seo";

export const revalidate = 900;

export const metadata = dayPageMetadata("Tuesday", "tuesday-predictions");

export default function Page() {
  return <DayPredictionsPage weekday={2} />;
}
