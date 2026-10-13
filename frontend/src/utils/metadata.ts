import { ethers } from 'ethers';

export interface PoolMetadata {
  version: 1;
  participants?: number;
}

/**
 * Encodes description with backward-compatible versioned metadata.
 * Uses an HTML comment trailer so non-metadata readers see clean text.
 */
export function encodeDescription(
  userDescription: string,
  expectedParticipants?: number | null
): string {
  const clean = (userDescription || '').trim();
  if (!expectedParticipants || expectedParticipants <= 1) {
    return clean;
  }
  const meta: PoolMetadata = {
    version: 1,
    participants: Math.floor(expectedParticipants),
  };
  return `${clean}\n\n<!--metadata:${JSON.stringify(meta)}-->`;
}

/**
 * Parses description and extracts versioned metadata.
 * Fully backward-compatible with older pools that only have plain text.
 */
export function parseDescription(rawDescription: string | null | undefined): {
  cleanDescription: string;
  expectedParticipants?: number;
} {
  if (!rawDescription) return { cleanDescription: '' };

  // 1. Check for HTML comment marker: <!--metadata:{"v":1,"participants":5}-->
  const htmlMatch = rawDescription.match(/<!--metadata:(.*?)-->$/s);
  if (htmlMatch) {
    try {
      const parsed = JSON.parse(htmlMatch[1]);
      const clean = rawDescription.replace(/<!--metadata:(.*?)-->$/s, '').trim();
      const participants =
        typeof parsed.participants === 'number' && parsed.participants > 1
          ? parsed.participants
          : undefined;
      return { cleanDescription: clean, expectedParticipants: participants };
    } catch {
      // Fall through if JSON parsing failed
    }
  }

  // 2. Check for JSON trailer format: \n\n---\n{"v":1,...}
  const trailerMatch = rawDescription.match(/\n\n---\n(\{"v":\s*1,.*?\})$/s);
  if (trailerMatch) {
    try {
      const parsed = JSON.parse(trailerMatch[1]);
      const clean = rawDescription.replace(/\n\n---\n\{.*\}$/s, '').trim();
      const participants =
        typeof parsed.participants === 'number' && parsed.participants > 1
          ? parsed.participants
          : undefined;
      return { cleanDescription: clean, expectedParticipants: participants };
    } catch {
      // Fall through
    }
  }

  return { cleanDescription: rawDescription.trim() };
}

export interface FairShareCalculation {
  hasTargetParticipants: boolean;
  expectedParticipants: number;
  suggestedPerPersonWei: bigint;
  userContributionWei: bigint;
  remainingUserShareWei: bigint;
  isUserShareFulfilled: boolean;
  guidanceNotice: string;
}

/**
 * Computes FairShare suggested breakdown.
 * Emphasizes that this is voluntary coordination guidance, never mandatory debt.
 */
export function calculateFairShare(
  targetAmountWei: bigint,
  expectedParticipants?: number | null,
  userContributionWei: bigint = 0n
): FairShareCalculation {
  const participants = expectedParticipants && expectedParticipants > 1 ? expectedParticipants : 0;
  if (participants <= 1 || targetAmountWei <= 0n) {
    return {
      hasTargetParticipants: false,
      expectedParticipants: 0,
      suggestedPerPersonWei: 0n,
      userContributionWei,
      remainingUserShareWei: 0n,
      isUserShareFulfilled: false,
      guidanceNotice: 'Suggested shares are optional guidance to help coordinate, not mandatory debt.',
    };
  }

  const suggestedPerPersonWei = targetAmountWei / BigInt(participants);
  const remainingUserShareWei =
    suggestedPerPersonWei > userContributionWei ? suggestedPerPersonWei - userContributionWei : 0n;
  const isUserShareFulfilled = userContributionWei >= suggestedPerPersonWei;

  return {
    hasTargetParticipants: true,
    expectedParticipants: participants,
    suggestedPerPersonWei,
    userContributionWei,
    remainingUserShareWei,
    isUserShareFulfilled,
    guidanceNotice:
      'Suggested share is voluntary guidance to split costs evenly across participants, not an enforceable debt or invoice.',
  };
}

export interface FundingPaceCalculation {
  remainingNeededWei: bigint;
  isTargetMet: boolean;
  isExpired: boolean;
  secondsRemaining: number;
  hoursRemaining: number;
  daysRemaining: number;
  pacePerHourWei: bigint;
  pacePerDayWei: bigint;
}

/**
 * Calculates remaining funds and required pace (per day/hour) to reach the goal
 */
export function calculateFundingPace(
  targetAmountWei: bigint,
  totalContributedWei: bigint,
  deadlineSeconds: number
): FundingPaceCalculation {
  const now = Math.floor(Date.now() / 1000);
  const secondsRemaining = Math.max(0, deadlineSeconds - now);
  const isExpired = secondsRemaining === 0;
  const isTargetMet = totalContributedWei >= targetAmountWei && targetAmountWei > 0n;
  const remainingNeededWei = isTargetMet ? 0n : targetAmountWei - totalContributedWei;

  const hoursRemaining = secondsRemaining / 3600;
  const daysRemaining = secondsRemaining / 86400;

  const pacePerHourWei =
    remainingNeededWei > 0n && hoursRemaining >= 1
      ? remainingNeededWei / BigInt(Math.max(1, Math.floor(hoursRemaining)))
      : remainingNeededWei;

  const pacePerDayWei =
    remainingNeededWei > 0n && daysRemaining >= 1
      ? remainingNeededWei / BigInt(Math.max(1, Math.floor(daysRemaining)))
      : remainingNeededWei;

  return {
    remainingNeededWei,
    isTargetMet,
    isExpired,
    secondsRemaining,
    hoursRemaining,
    daysRemaining,
    pacePerHourWei,
    pacePerDayWei,
  };
}
