export type DashboardCloseInput = {
  needCheckCount: number;
  purposeInputCount: number;
  assetInputCount: number;
};

export type DashboardCloseStatus = {
  needCheck: string;
  purpose: '입력됨' | '입력 필요';
  assets: '완료' | '입력 필요';
  close: '마감 가능' | '마감 전';
};

export const unavailableDashboardCloseStatus: DashboardCloseStatus = {
  needCheck: '확인 필요',
  purpose: '입력 필요',
  assets: '입력 필요',
  close: '마감 전',
};

export function deriveDashboardCloseStatus(input: DashboardCloseInput): DashboardCloseStatus {
  const needCheckCount = Math.max(0, Number(input.needCheckCount || 0));
  const purpose = Number(input.purposeInputCount || 0) > 0 ? '입력됨' : '입력 필요';
  const assets = Number(input.assetInputCount || 0) > 0 ? '완료' : '입력 필요';
  const close = needCheckCount === 0 && purpose === '입력됨' && assets === '완료' ? '마감 가능' : '마감 전';
  return { needCheck: `${needCheckCount}건`, purpose, assets, close };
}
