export type MonthlyDecisionTone = 'needs-check' | 'reduce-needed' | 'ready';

export type MonthlyPurposeRisk = {
  account: string;
  balance: number;
  deposits: number;
  usage: number;
};

export type MonthlyDecisionInput = {
  surplus: number;
  purposeRisks: MonthlyPurposeRisk[];
  needCheckCount: number;
  closeReady?: boolean;
  dataAvailable?: boolean;
};

export type MonthlyDecision = {
  tone: MonthlyDecisionTone;
  badge: '확인 필요' | '줄이기 필요' | '마감 가능';
  reason: string;
  purposeRisk?: MonthlyPurposeRisk;
};

export function deriveMonthlyDecision(input: MonthlyDecisionInput): MonthlyDecision {
  const purposeRisk = input.purposeRisks.find(p => Number(p.balance || 0) < 0 || Number(p.usage || 0) > Number(p.deposits || 0));

  if (input.dataAvailable === false) {
    return {
      tone: 'needs-check',
      badge: '확인 필요',
      reason: '이번 달 판단 자료를 불러오지 못했어요. 잠시 후 다시 확인해 주세요.',
      purposeRisk,
    };
  }

  if (input.needCheckCount > 0) {
    return {
      tone: 'needs-check',
      badge: '확인 필요',
      reason: '확인할 내역이 남아 있어요.',
      purposeRisk,
    };
  }

  if (purposeRisk) {
    return {
      tone: 'needs-check',
      badge: '확인 필요',
      reason: input.surplus < 0
        ? `예상 잉여가 ${formatWon(Math.abs(input.surplus))} 부족하고 ${purposeRisk.account} 잔액 확인도 필요해요.`
        : `예상 잉여 ${formatWon(input.surplus)}이지만 ${purposeRisk.account} 잔액 확인이 필요해요.`,
      purposeRisk,
    };
  }

  if (input.surplus < 0) {
    return {
      tone: 'reduce-needed',
      badge: '줄이기 필요',
      reason: `예상 잉여가 ${formatWon(Math.abs(input.surplus))} 부족해요.`,
    };
  }

  if (input.closeReady === false) {
    return {
      tone: 'needs-check',
      badge: '확인 필요',
      reason: '마감 전 입력할 항목이 남아 있어요.',
    };
  }

  return {
    tone: 'ready',
    badge: '마감 가능',
    reason: `예상 잉여 ${formatWon(input.surplus)}이에요.`,
  };
}

function formatWon(value: number) {
  return `${Math.round(Math.abs(value || 0)).toLocaleString('ko-KR')}원`;
}
