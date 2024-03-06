import { createBrowserClient } from '@supabase/ssr'
import { format } from 'date-fns'

const supabase = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

export async function fetchAccounts (filters: { filterUser?: string, filterStatus?: string }, perPageCount: number, rangeFrom: number) {
  try {
    let query = supabase
      .from('agriko_users')
      .select('*, office:active_office_id(*)', { count: 'exact' })
      .neq('email', 'berlcamp@gmail.com')


    // Search match
    if (filters.filterUser && filters.filterUser !== '') {
      query = query.eq('id', filters.filterUser)
    }

    // filter status
    if (filters.filterStatus && filters.filterStatus !== '') {
      query = query.eq('status', filters.filterStatus)
    }

    // Per Page from context
    const from = rangeFrom
    const to = from + (perPageCount - 1)

    // Per Page from context
    query = query.range(from, to)

    // Order By
    query = query.order('id', { ascending: false })

    const { data, error, count } = await query

    if (error) {
      throw new Error(error.message)
    }

    return { data, count }
  } catch (error) {
    console.error('fetch accounts error', error)
    return { data: [], count: 0 }
  }
}

export async function fetchRawMaterials (perPageCount: number, rangeFrom: number) {
  try {
    let query = supabase
      .from('agriko_rawmaterials')
      .select('*', { count: 'exact' })

    // Per Page from context
    const from = rangeFrom
    const to = from + (perPageCount - 1)

    // Per Page from context
    query = query.range(from, to)

    // Order By
    query = query.order('id', { ascending: false })

    const { data, error, count } = await query

    if (error) {
      throw new Error(error.message)
    }

    return { data, count }
  } catch (error) {
    console.error('fetch raw materials error', error)
    return { data: [], count: 0 }
  }
}

export async function fetchProducts (perPageCount: number, rangeFrom: number) {
  try {
    let query = supabase
      .from('agriko_products')
      .select('*', { count: 'exact' })

    // Per Page from context
    const from = rangeFrom
    const to = from + (perPageCount - 1)

    // Per Page from context
    query = query.range(from, to)

    // Order By
    query = query.order('id', { ascending: false })

    const { data, error, count } = await query

    if (error) {
      throw new Error(error.message)
    }

    return { data, count }
  } catch (error) {
    console.error('fetch products error', error)
    return { data: [], count: 0 }
  }
}

export async function fetchPackages (perPageCount: number, rangeFrom: number) {
  try {
    let query = supabase
      .from('agriko_packages')
      .select('*', { count: 'exact' })

    // Per Page from context
    const from = rangeFrom
    const to = from + (perPageCount - 1)

    // Per Page from context
    query = query.range(from, to)

    // Order By
    query = query.order('id', { ascending: false })

    const { data, error, count } = await query

    if (error) {
      throw new Error(error.message)
    }

    return { data, count }
  } catch (error) {
    console.error('fetch packages error', error)
    return { data: [], count: 0 }
  }
}

export async function fetchTransfers (filters: { filterOffice?: string, filterDate?: Date | undefined }, perPageCount: number, rangeFrom: number) {
  try {
    let query = supabase
      .from('agriko_transfer_transactions')
      .select('*, office:office_id(*)', { count: 'exact' })


    // Filter date
    if (filters.filterDate) {
      query = query.eq('transfer_date', format(new Date(filters.filterDate), 'yyyy-MM-dd'))
    }

    // Filter office
    if (filters.filterOffice) {
      query = query.eq('office_id', filters.filterOffice)
    }

    // Per Page from context
    const from = rangeFrom
    const to = from + (perPageCount - 1)

    // Per Page from context
    query = query.range(from, to)

    // Order By
    query = query.order('id', { ascending: false })

    const { data, error, count } = await query

    if (error) {
      throw new Error(error.message)
    }

    return { data, count }
  } catch (error) {
    console.error('fetch transfers error', error)
    return { data: [], count: 0 }
  }
}

export async function fetchOrderTransactions (filters: { filterOffice?: string, filterCashier?: string | undefined, filterCustomer?: string | undefined, filterDate?: Date | undefined }, perPageCount: number, rangeFrom: number) {
  try {
    let query = supabase
      .from('agriko_order_transactions')
      .select('*, customer:customer_id(*), agriko_ordered_products(*), cashier:cashier_id(firstname,middlename,lastname,avatar_url)', { count: 'exact' })


    // Filter date
    if (filters.filterDate) {
      query = query.eq('transaction_date', format(new Date(filters.filterDate), 'yyyy-MM-dd'))
    }

    // Filter Cashier
    if (filters.filterCashier && filters.filterCashier !== 'All') {
      query = query.eq('cashier_id', filters.filterCashier)
    }

    // Filter Customer
    if (filters.filterCustomer) {
      query = query.eq('customer_id', filters.filterCustomer)
    }

    // Filter office
    if (filters.filterOffice) {
      query = query.eq('office_id', filters.filterOffice)
    }

    // Per Page from context
    const from = rangeFrom
    const to = from + (perPageCount - 1)

    // Per Page from context
    query = query.range(from, to)

    // Order By
    query = query.order('id', { ascending: false })

    const { data, error, count } = await query

    if (error) {
      throw new Error(error.message)
    }

    return { data, count }
  } catch (error) {
    console.error('fetch order transactions error', error)
    return { data: [], count: 0 }
  }
}

export async function logError (transaction: string, table: string, data: string, error: string) {
  await supabase
    .from('error_logs')
    .insert({
      system: 'agriko',
      transaction,
      table,
      data,
      error
    })
}

export async function logChanges (log: any, referenceColumn: string, referenceValue: string, userId: string, customMessage: string) {
  const { error } = await supabase
    .from('agriko_change_logs')
    .insert({
      log,
      user_id: userId,
      [referenceColumn]: referenceValue,
      custom_message: customMessage
    })
  return { error: error }
}

export async function fetchErrorLogs (perPageCount: number, rangeFrom: number) {
  try {
    let query = supabase
      .from('error_logs')
      .select('*', { count: 'exact' })

    // Per Page from context
    const from = rangeFrom
    const to = from + (perPageCount - 1)

    // Per Page from context
    query = query.range(from, to)

    // Order By
    query = query.order('id', { ascending: false })

    const { data, error, count } = await query

    if (error) {
      throw new Error(error.message)
    }

    return { data, count }
  } catch (error) {
    console.error('fetch error logs error', error)
    return { data: [], count: 0 }
  }
}
