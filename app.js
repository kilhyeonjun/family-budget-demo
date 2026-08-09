const storageKey = 'family-budget-demo';
const currency = new Intl.NumberFormat('ko-KR', { style: 'currency', currency: 'KRW', maximumFractionDigits: 0 });
const seed = await fetch('./demo/seed-data.json').then((response) => response.json());

const load = () => {
  try { return JSON.parse(localStorage.getItem(storageKey)) || structuredClone(seed); }
  catch { return structuredClone(seed); }
};
let data = load();

function render() {
  const income = data.transactions.filter((item) => item.type === 'income').reduce((sum, item) => sum + item.amount, 0);
  const expense = data.transactions.filter((item) => item.type !== 'income').reduce((sum, item) => sum + item.amount, 0);
  document.querySelector('#income').textContent = currency.format(income);
  document.querySelector('#expense').textContent = currency.format(expense);
  document.querySelector('#balance').textContent = currency.format(income - expense);
  document.querySelector('#count').textContent = `${data.transactions.length} items`;
  document.querySelector('#ledger').replaceChildren(...[...data.transactions].reverse().map((item) => {
    const row = document.createElement('div');
    row.className = 'row';
    const date = document.createElement('small'); date.textContent = item.date;
    const detail = document.createElement('div');
    const description = document.createElement('div'); description.textContent = item.description;
    const category = document.createElement('small'); category.textContent = item.category;
    detail.append(description, category);
    const amount = document.createElement('strong');
    amount.className = item.type === 'income' ? 'positive' : 'negative';
    amount.textContent = `${item.type === 'income' ? '+' : '−'}${currency.format(item.amount)}`;
    row.append(date, detail, amount);
    return row;
  }));
}

document.querySelector('#transaction-form').addEventListener('submit', (event) => {
  event.preventDefault();
  const form = new FormData(event.currentTarget);
  data.transactions.push({
    date: String(form.get('date')),
    owner: 'shared',
    category: String(form.get('category')),
    description: String(form.get('description')).trim(),
    amount: Number(form.get('amount')),
  });
  localStorage.setItem(storageKey, JSON.stringify(data));
  event.currentTarget.reset();
  document.querySelector('#status').textContent = 'Expense saved in this browser demo.';
  render();
});

document.querySelector('#reset').addEventListener('click', () => {
  data = structuredClone(seed);
  localStorage.removeItem(storageKey);
  document.querySelector('#status').textContent = 'Synthetic data reset.';
  render();
});

render();
