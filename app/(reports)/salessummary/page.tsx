'use client'
import ProductsChart from '@/components/Charts/ProductsChart'
import TwoColTableLoading from '@/components/Loading/TwoColTableLoading'
import {
  CustomButton,
  MainSideBar,
  Sidebar,
  Title,
  TopBar,
} from '@/components/index'
import { useSupabase } from '@/context/SupabaseProvider'
import { AccountTypes, OrderedProductTypes, ProductTypes } from '@/types'
import { format, subMonths } from 'date-fns'
import Excel from 'exceljs'
import { saveAs } from 'file-saver'
import { useEffect, useState } from 'react'
import { TbCurrencyPeso } from 'react-icons/tb'
import Filters from './Filters'

const colors = [
  '#55d978',
  '#d9ca55',
  '#d9985f',
  '#5caecc',
  '#adedd9',
  '#d0e3f7',
  '#c3ffad',
  '#ffc4ef',
  '#87f5ff',
  '#8ce37d',
  '#6dd6b5',
]

export default function Page() {
  const [filterFrom, setFilterFrom] = useState<Date>(
    new Date(subMonths(new Date(), 1))
  )
  const [filterTo, setFilterTo] = useState<Date>(new Date())
  const [filterCashier, setFilterCashier] = useState('All')

  // Loading
  const [downloading, setDownloading] = useState(false)
  const [loading, setLoading] = useState(false)

  const { supabase, currentUser } = useSupabase()

  const activeUser: AccountTypes = currentUser

  // Products chart data
  const [dataSets, setDataSets] = useState([])
  const [labels, setLabels] = useState<string[] | []>([])

  // Summary Data
  const [grossSales, setGrossSales] = useState(0)
  const [refunds, setRefunds] = useState(0)
  const [discounts, setDiscounts] = useState(0)
  const [netSales, setNetSales] = useState(0)

  const fetchProducts = async () => {
    setLoading(true)
    const { data: productsData } = await supabase
      .from('agriko_products')
      .select()

    const pIds: number[] = []
    productsData.forEach((p: ProductTypes) => {
      pIds.push(p.id)
    })

    let query = supabase
      .from('agriko_ordered_products')
      .select()
      .in('product_id', pIds)
      .gte('transaction_date', format(new Date(filterFrom), 'yyyy-MM-dd'))
      .lte('transaction_date', format(new Date(filterTo), 'yyyy-MM-dd'))
      .eq('office_id', activeUser.active_office_id)

    if (filterCashier !== 'All') {
      query = query.eq('cashier_id', filterCashier)
    }
    const { data: orderedProductsData } = await query

    const orderedProducts: OrderedProductTypes[] = orderedProductsData
    const dataSetsData: any = []

    let grossTotal = 0
    let refundsTotal = 0
    let discountsTotal = 0
    let ordersTotal = 0

    productsData.forEach((p: ProductTypes) => {
      //
      orderedProducts.forEach((op: OrderedProductTypes) => {
        if (op.product_id === p.id && op.status !== 'Canceled') {
          grossTotal += Number(op.product_price) * Number(op.quantity)
          discountsTotal += Number(op.discount_total)
          ordersTotal += Number(op.quantity)
        }
        if (op.product_id === p.id && op.status === 'Canceled') {
          refundsTotal += Number(op.total_amount)
        }
      })

      const randomIdx = Math.floor(Math.random() * 11)

      // Create datasets array
      if (ordersTotal > 0) {
        dataSetsData.push({
          label: `${p.name} (${
            p.size === 'Custom Size' ? p.custom_size : p.size
          })`,
          data: [ordersTotal],
          bgColor: colors[randomIdx],
        })
      }

      // reset product order total
      ordersTotal = 0
    })

    // Set summary data
    setGrossSales(grossTotal)
    setRefunds(refundsTotal)
    setDiscounts(discountsTotal)
    setNetSales(Number(grossTotal) - Number(refundsTotal + discountsTotal))

    const label = `${format(new Date(filterFrom), 'MMM dd, yy')} - ${format(
      new Date(filterTo),
      'MMM dd, yy'
    )}`

    setLabels([label])
    setDataSets(dataSetsData)
    setLoading(false)
  }

  const handleDownloadExcel = async () => {
    setDownloading(true)

    // Create a new workbook and add a worksheet
    const workbook = new Excel.Workbook()
    const worksheet = workbook.addWorksheet('Sheet 1')

    // Add data to the worksheet
    worksheet.columns = [
      { header: '#', key: 'no', width: 20 },
      { header: 'Product', key: 'product', width: 20 },
      { header: 'Unit Price', key: 'price', width: 20 },
      { header: 'Quantity', key: 'quantity', width: 20 },
      { header: 'Sub Total', key: 'subtotal', width: 20 },
      { header: 'Status', key: 'status', width: 20 },
      // Add more columns based on your data structure
    ]

    const { data: productsData } = await supabase
      .from('agriko_products')
      .select('id, name')

    const pIds: number[] = []
    productsData.forEach((p: ProductTypes) => {
      pIds.push(p.id)
    })

    let query = supabase
      .from('agriko_ordered_products')
      .select()
      .in('product_id', pIds)
      .gte('transaction_date', format(new Date(filterFrom), 'yyyy-MM-dd'))
      .lte('transaction_date', format(new Date(filterTo), 'yyyy-MM-dd'))
      .eq('office_id', activeUser.active_office_id)

    if (filterCashier !== 'All') {
      query = query.eq('cashier_id', filterCashier)
    }
    const { data: orderedProductsData } = await query

    const orderedProducts: OrderedProductTypes[] = orderedProductsData

    // Data for the Excel file
    const data: any[] = []
    orderedProducts.forEach((item, index) => {
      data.push({
        no: index + 1,
        product: `${item.product_name} (${item.product_size})`,
        price:
          Number(item.discounted_price) > 0
            ? item.discounted_price
            : item.product_price,
        quantity: item.quantity,
        subtotal: item.total_amount,
        status: item.status === 'Canceled' ? 'Refunded' : '',
      })
    })

    data.forEach((item) => {
      worksheet.addRow(item)
    })

    // Generate the Excel file
    await workbook.xlsx.writeBuffer().then((buffer) => {
      const blob = new Blob([buffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      })
      saveAs(blob, 'Summary.xlsx')
    })
    setDownloading(false)
  }

  useEffect(() => {
    fetchProducts()
  }, [filterCashier, filterFrom, setFilterTo])

  return (
    <>
      <Sidebar>
        <MainSideBar />
      </Sidebar>
      <TopBar />
      <div className="app__main">
        <div className="app__title">
          <Title title="Sales Summary" />
        </div>

        {/* Filters */}
        <div className="app__filters">
          <Filters
            setFilterFrom={setFilterFrom}
            setFilterTo={setFilterTo}
            setFilterCashier={setFilterCashier}
          />
        </div>

        {loading && <TwoColTableLoading />}
        {!loading && (
          <>
            <div className="mx-4 flex justify-end">
              <CustomButton
                containerStyles="app__btn_blue"
                isDisabled={downloading}
                title={downloading ? 'Downloading...' : 'Export To Excel'}
                btnType="submit"
                handleClick={handleDownloadExcel}
              />
            </div>
            <div className="mx-4 mt-2 bg-slate-100">
              <div className="border-b grid grid-cols-4">
                <div className="hover:bg-slate-200 text-gray-700">
                  <div className="p-2">
                    <div className="text-center font-extralight">
                      Gross Sales
                    </div>
                    <div className="flex items-center justify-center">
                      <TbCurrencyPeso className="w-7 h-7" />
                      <span className="text-2xl">{grossSales}</span>
                    </div>
                  </div>
                </div>
                <div className="hover:bg-slate-200 text-gray-700">
                  <div className="p-2">
                    <div className="text-center font-extralight">Refunds</div>
                    <div className="flex items-center justify-center">
                      <TbCurrencyPeso className="w-7 h-7" />
                      <span className="text-2xl">{refunds}</span>
                    </div>
                  </div>
                </div>
                <div className="hover:bg-slate-200 text-gray-700">
                  <div className="p-2">
                    <div className="text-center font-extralight">Discounts</div>
                    <div className="flex items-center justify-center">
                      <TbCurrencyPeso className="w-7 h-7" />
                      <span className="text-2xl">{discounts}</span>
                    </div>
                  </div>
                </div>
                <div className="hover:bg-slate-200 text-gray-700">
                  <div className="p-2">
                    <div className="text-center font-extralight">Net Sales</div>
                    <div className="flex items-center justify-center">
                      <TbCurrencyPeso className="w-7 h-7" />
                      <span className="text-2xl">{netSales}</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="p-2 mt-4">Sales by Product</div>
              <div className="p-2">
                <ProductsChart
                  labels={labels}
                  dataSets={dataSets}
                />
              </div>
            </div>
          </>
        )}
      </div>
    </>
  )
}
