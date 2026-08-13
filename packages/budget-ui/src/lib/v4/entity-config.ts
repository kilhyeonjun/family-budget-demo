// v4 엔티티 그리드 config — 목적통장/자산/반복이 원장과 같은 CRUD 엔진(api-ledger)을
// 공유하므로, 컬럼 정의 + 드롭다운 옵션 소스만 엔티티별로 바꿔 EntityGrid에 주입한다.
// 신규 추상화가 아니라 원장 그리드의 하드코딩 컬럼을 config로 뽑아낸 것.

export type ColKind = 'date' | 'month' | 'text' | 'number' | 'dropdown' | 'flag';
export type EntityColumn = { key: string; title: string; width: number; kind: ColKind; optionKey?: string; optionLabels?: Record<string, string> };

export type EntityKind = 'transactions' | 'purpose' | 'assets' | 'recurring';

// 드롭다운 옵션 소스 — settings 페이로드의 어떤 배열을 쓸지.
export type EntityOptions = Record<string, string[]>;

export type EntitySpec = {
  kind: EntityKind;
  apiPath: string;            // /api/<path>
  columns: EntityColumn[];
  empty: (month: string) => Record<string, unknown>;  // 새 행 기본값
  // 빈 신규행 판정: 아래 두 필드(식별 텍스트 + 금액)가 모두 비면 저장에서 스킵.
  emptyCheck: { text: string; amount: string };
};

export const ENTITY_SPECS: Record<EntityKind, EntitySpec> = {
  transactions: {
    kind: 'transactions',
    apiPath: '/api/transactions',
    columns: [
      { key: 'date', title: '날짜', width: 120, kind: 'date' },
      { key: 'owner_type', title: '부담', width: 90, kind: 'dropdown', optionKey: 'owners' },
      { key: 'major_category', title: '대분류', width: 120, kind: 'dropdown', optionKey: 'categories' },
      { key: 'minor_category', title: '소분류', width: 130, kind: 'dropdown', optionKey: 'subcategories' },
      { key: 'description', title: '내용', width: 240, kind: 'text' },
      { key: 'amount', title: '금액', width: 130, kind: 'number' },
      { key: 'budget_treatment', title: '예산처리', width: 140, kind: 'dropdown', optionKey: 'budgetTreatments' },
      { key: 'purpose_account', title: '목적통장', width: 140, kind: 'dropdown', optionKey: 'purposeAccounts' },
      { key: 'payment_method', title: '결제수단', width: 120, kind: 'dropdown', optionKey: 'paymentMethods' },
      { key: 'memo', title: '메모', width: 200, kind: 'text' },
      { key: 'status', title: '상태', width: 100, kind: 'dropdown', optionKey: 'statuses' },
    ],
    empty: (month) => ({ date: `${month}-01`, owner_type: '공동', major_category: '식비', minor_category: '기타', description: '', budget_treatment: '예산포함', purpose_account: '', payment_method: '체크카드', amount: 0, memo: '', status: '정상' }),
    emptyCheck: { text: 'description', amount: 'amount' },
  },
  purpose: {
    kind: 'purpose',
    apiPath: '/api/purpose',
    columns: [
      { key: 'date', title: '날짜', width: 130, kind: 'date' },
      { key: 'purpose_account', title: '목적통장', width: 160, kind: 'dropdown', optionKey: 'purposeAccounts' },
      { key: 'deposit_type', title: '입금종류', width: 140, kind: 'dropdown', optionKey: 'depositTypes' },
      { key: 'amount', title: '금액', width: 140, kind: 'number' },
      { key: 'memo', title: '메모', width: 280, kind: 'text' },
    ],
    empty: (month) => ({ date: `${month}-01`, purpose_account: '', deposit_type: '', amount: 0, memo: '' }),
    emptyCheck: { text: 'purpose_account', amount: 'amount' },
  },
  assets: {
    kind: 'assets',
    apiPath: '/api/assets',
    columns: [
      { key: 'owner_type', title: '부담', width: 90, kind: 'dropdown', optionKey: 'owners' },
      { key: 'asset_type', title: '자산종류', width: 140, kind: 'dropdown', optionKey: 'assetTypes' },
      { key: 'account_name', title: '계좌/자산명', width: 200, kind: 'text' },
      { key: 'balance', title: '잔액', width: 150, kind: 'number' },
      { key: 'exclude_from_household_assets', title: '가계자산 제외', width: 120, kind: 'flag' },
      { key: 'memo', title: '메모', width: 240, kind: 'text' },
    ],
    empty: (month) => ({ month, owner_type: '공동', asset_type: '', account_name: '', balance: 0, exclude_from_household_assets: 0, memo: '' }),
    emptyCheck: { text: 'account_name', amount: 'balance' },
  },
  recurring: {
    kind: 'recurring',
    apiPath: '/api/recurring',
    columns: [
      { key: 'item_type', title: '종류', width: 110, kind: 'dropdown', optionKey: 'recurringTypes' },
      { key: 'cadence', title: '예상 생성 주기', width: 130, kind: 'dropdown', optionKey: 'cadences', optionLabels: { monthly: '매월', 'one-time': '한 번' } },
      { key: 'billing_cycle', title: '실제 결제 주기', width: 130, kind: 'dropdown', optionKey: 'billingCycles', optionLabels: { monthly: '매월', quarterly: '분기', annual: '연간' } },
      { key: 'billing_months', title: '결제월', width: 110, kind: 'text' },
      { key: 'name', title: '이름', width: 160, kind: 'text' },
      { key: 'owner_type', title: '부담', width: 90, kind: 'dropdown', optionKey: 'owners' },
      { key: 'major_category', title: '대분류', width: 120, kind: 'dropdown', optionKey: 'categories' },
      { key: 'minor_category', title: '소분류', width: 120, kind: 'dropdown', optionKey: 'subcategories' },
      { key: 'monthly_amount', title: '월 예산', width: 130, kind: 'number' },
      { key: 'expected_charge_amount', title: '결제 예정액', width: 130, kind: 'number' },
      { key: 'expected_day', title: '예정일', width: 90, kind: 'number' },
      { key: 'payment_method', title: '결제수단', width: 120, kind: 'dropdown', optionKey: 'paymentMethods' },
      { key: 'budget_treatment', title: '예산처리', width: 130, kind: 'dropdown', optionKey: 'budgetTreatments' },
      { key: 'purpose_account', title: '목적통장', width: 130, kind: 'dropdown', optionKey: 'purposeAccounts' },
      { key: 'deposit_type', title: '입금종류', width: 120, kind: 'dropdown', optionKey: 'depositTypes' },
      { key: 'start_month', title: '시작월', width: 110, kind: 'month' },
      { key: 'end_month', title: '종료월', width: 110, kind: 'month' },
      { key: 'status', title: '상태', width: 90, kind: 'dropdown', optionKey: 'statuses' },
      { key: 'reconciliation_mode', title: '확인 방식', width: 120, kind: 'dropdown', optionKey: 'reconciliationModes', optionLabels: { tracked: '확인함', excluded: '계획만' } },
      { key: 'reconciliation_note', title: '확인 메모', width: 180, kind: 'text' },
    ],
    empty: (month) => ({ item_type: '고정지출', cadence: 'monthly', billing_cycle: 'monthly', billing_months: '', name: '', owner_type: '공동', major_category: '기타', minor_category: '기타', monthly_amount: 0, expected_charge_amount: 0, expected_day: 1, payment_method: '자동이체', budget_treatment: '예산포함', purpose_account: '', deposit_type: '정기입금', start_month: month, end_month: '', status: '진행', reconciliation_mode: 'tracked', reconciliation_note: '' }),
    emptyCheck: { text: 'name', amount: 'monthly_amount' },
  },
};
