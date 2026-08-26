import { FixtureStatus } from "@/generated/prisma/enums";

const STATUS_MAP: Record<string, FixtureStatus> = {
  TBD: FixtureStatus.SCHEDULED,
  NS: FixtureStatus.SCHEDULED,
  "1H": FixtureStatus.LIVE,
  "2H": FixtureStatus.LIVE,
  ET: FixtureStatus.LIVE,
  BT: FixtureStatus.LIVE,
  P: FixtureStatus.LIVE,
  LIVE: FixtureStatus.LIVE,
  HT: FixtureStatus.HALFTIME,
  FT: FixtureStatus.FINISHED,
  AET: FixtureStatus.FINISHED,
  PEN: FixtureStatus.FINISHED,
  PST: FixtureStatus.POSTPONED,
  CANC: FixtureStatus.CANCELLED,
  ABD: FixtureStatus.ABANDONED,
  WO: FixtureStatus.ABANDONED,
  SUSP: FixtureStatus.POSTPONED,
  INT: FixtureStatus.POSTPONED,
};

export function mapApiFixtureStatus(short: string): FixtureStatus {
  return STATUS_MAP[short] ?? FixtureStatus.SCHEDULED;
}
