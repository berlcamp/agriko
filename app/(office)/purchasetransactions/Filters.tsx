import SearchCustomerInput from '@/components/SearchCustomerInput'
import { CustomButton } from '@/components/index'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { useSupabase } from '@/context/SupabaseProvider'
import { AccountTypes, CustomerTypes } from '@/types'
import { cn } from '@/utils/shadcn'
import { format } from 'date-fns'
import { Calendar as CalendarIcon } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

interface FilterTypes {
  setFilterDate: (date: Date | undefined) => void
  setFilterCustomer: (customer: string | undefined) => void
}

interface OldCustomerValues {
  customer_id: string
  name_address: string
}

const FormSchema = z.object({
  transaction_date: z.date().optional(),
  old_customer_id: z.string().optional(),
})

const Filters = ({ setFilterDate, setFilterCustomer }: FilterTypes) => {
  const [oldCustomers, setOldCustomers] = useState<OldCustomerValues[] | []>([])

  const { currentUser, supabase } = useSupabase()

  const activeUser: AccountTypes = currentUser

  //
  const form = useForm<z.infer<typeof FormSchema>>({
    defaultValues: { transaction_date: undefined, old_customer_id: undefined },
  })

  const onSubmit = async (data: z.infer<typeof FormSchema>) => {
    setFilterDate(data.transaction_date)
    setFilterCustomer(data.old_customer_id)
  }

  // clear all filters
  const handleClear = () => {
    form.reset()
    setFilterDate(undefined)
    setFilterCustomer(undefined)
  }

  useEffect(() => {
    ;(async () => {
      // Fetch customers
      const { data: customers } = await supabase
        .from('agriko_customers')
        .select()
        .eq('office_id', activeUser.active_office_id)

      if (customers) {
        const oldCust: any = []
        customers.forEach((c: CustomerTypes) => {
          oldCust.push({
            name_address: `${c.name} - ${c.address} #${c.id}`,
            customer_id: c.id,
          })
        })
        setOldCustomers(oldCust)
      }
    })()
  }, [])

  return (
    <div className="">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <div className="items-center space-x-2 space-y-1">
            <div className="items-center inline-flex app__filter_field_container">
              <FormField
                control={form.control}
                name="transaction_date"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel className="app__form_label">
                      Transaction Date
                    </FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={'outline'}
                            className={cn(
                              'w-[240px] pl-3 text-left font-normal',
                              !field.value && 'text-muted-foreground'
                            )}>
                            {field.value ? (
                              format(field.value, 'PPP')
                            ) : (
                              <span>Pick a date</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent
                        className="w-auto p-0"
                        align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) => date < new Date('1900-01-01')}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="items-center inline-flex app__filter_field_container">
              <FormField
                control={form.control}
                name="old_customer_id"
                render={() => (
                  <FormItem className="w-full">
                    <FormLabel className="app__form_label">
                      Customer Name
                    </FormLabel>
                    <SearchCustomerInput
                      customers={oldCustomers}
                      handleSelectedId={(selected) => {
                        form.setValue('old_customer_id', selected.toString())
                      }}
                    />
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>
          <div className="flex items-center space-x-2 mt-4">
            <CustomButton
              containerStyles="app__btn_green"
              title="Apply Filter"
              btnType="submit"
              handleClick={form.handleSubmit(onSubmit)}
            />
            <CustomButton
              containerStyles="app__btn_gray"
              title="Clear Filter"
              btnType="button"
              handleClick={handleClear}
            />
          </div>
        </form>
      </Form>
    </div>
  )
}

export default Filters
