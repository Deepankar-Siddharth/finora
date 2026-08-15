export interface TransactionFiltersState {
  query: string
  from: string
  to: string
  category: string
  type: '' | 'income' | 'expense'
  paymentMethod: string
  sort: 'newest' | 'oldest' | 'highest' | 'lowest'
}

export const DEFAULT_FILTERS: TransactionFiltersState = {
  query: '',
  from: '',
  to: '',
  category: '',
  type: '',
  paymentMethod: '',
  sort: 'newest',
}
