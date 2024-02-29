import type { MouseEventHandler, ReactNode } from 'react'

export interface SelectUserNamesProps {
  settingsData: any[]
  multiple: boolean
  type: string
  handleManagerChange: (newdata: any[], type: string) => void
  title: string
}

export interface UserAccessTypes {
  user_id: string
  type: string
  ceedo_user: namesType
}

export interface searchUser {
  firstname: string
  middlename: string
  lastname: string
  uuid?: string
  id: string
}

export interface namesType {
  firstname: string
  middlename: string
  lastname: string
  avatar_url: string
  id: string
}

export interface CustomButtonTypes {
  isDisabled?: boolean
  btnType?: 'button' | 'submit'
  containerStyles?: string
  textStyles?: string
  title: string
  rightIcon?: ReactNode
  handleClick?: MouseEventHandler<HTMLButtonElement>
}

export interface AccountTypes {
  id: string
  name: string
  firstname: string
  middlename: string
  lastname: string
  status: string
  password: string
  avatar_url: string
  email: string
  org_id: string
  created_by: string
  temp_password: string
  offices: string
  active_office_id: string
}

export interface excludedItemsTypes {
  id: string
}

export interface LogsTypes {
  id: string
  created_at: string
  log: any
  custom_message: string
  user: AccountTypes
}

export interface LogMessageTypes {
  field: string
  old_value: string
  new_value: string
}

export interface RawMaterialTypes {
  id: number
  name: string
  quantity: string
  unit: string
  quantity_warning: number
  status: string
}

export interface FinalProductTypes {
  product_id: number
  quantity: number
  product: ProductTypes
}

export interface ProductTypes {
  id: number
  name: string
  size: string
  custom_size: string
  status: string
  category: string
  price: number
}

export interface OrderTypes {
  id: number
  product_id: number
  order_date: string
  quantity: string
  order_transaction_id: number
  total_amount: string
}

export interface PTypes {
  product_name: string
  unit: string
  quantity: number
  id: number
}

export interface OfficeTypes {
  id: string
  name: string
  type: string
}

export interface OfficeProductTypes {
  id: number
  product_id: number
  office_id: number
  quantity: number
  category: string
  product: ProductTypes
}

export interface TransferedProductTypes {
  product_id: number
  name: string
  size: string
  category: string
  quantity: number
}

export interface TransferTransactionTypes {
  id: number
  office_id: number
  status: string
  memo: string
  transfer_date: string
  products: TransferedProductTypes[]
  transfered_by: string
  office: OfficeTypes
}
