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
import { AccountTypes } from '@/types'
import { cn } from '@/utils/shadcn'
import { format, subMonths } from 'date-fns'
import { Calendar as CalendarIcon } from 'lucide-react'
import { nanoid } from 'nanoid'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

interface FilterTypes {
  setFilterFrom: (date: Date) => void
  setFilterTo: (date: Date) => void
  setFilterCashier: (cashier: string) => void
}

const FormSchema = z.object({
  from: z.date(),
  to: z.date(),
  cashier: z.string(),
})

const Filters = ({
  setFilterFrom,
  setFilterTo,
  setFilterCashier,
}: FilterTypes) => {
  //
  const [cashiers, setCashiers] = useState<AccountTypes[] | []>([])
  const { supabase, systemUsers, currentUser } = useSupabase()

  const activeUser: AccountTypes = currentUser

  const form = useForm<z.infer<typeof FormSchema>>({
    defaultValues: {
      from: new Date(subMonths(new Date(), 1)),
      to: new Date(),
      cashier: 'All',
    },
  })

  const onSubmit = async (data: z.infer<typeof FormSchema>) => {
    setFilterFrom(data.from)
    setFilterTo(data.to)
    setFilterCashier(data.cashier)
  }

  // clear all filters
  const handleClear = () => {
    form.reset()
    setFilterFrom(new Date(subMonths(new Date(), 1)))
    setFilterTo(new Date())
    setFilterCashier('All')
  }

  useEffect(() => {
    // Fetch cashiers
    ;(async () => {
      const filteredCashiers = systemUsers.filter(
        (c: AccountTypes) =>
          c.active_office_id.toString() ===
          activeUser.active_office_id.toString()
      )

      setCashiers(filteredCashiers)
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
                name="from"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel className="app__form_label">From</FormLabel>
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
                name="to"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel className="app__form_label">To</FormLabel>
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
                name="cashier"
                render={({ field }) => (
                  <FormItem className="w-[240px] flex flex-col items-start justify-start">
                    <FormLabel className="app__form_label">Cashier</FormLabel>
                    <select
                      onChange={(e) => {
                        form.setValue('cashier', e.target.value)
                      }}
                      value={field.value}
                      className="flex h-9 w-full items-center justify-between whitespace-nowrap rounded-md border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm ring-offset-white placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-950 disabled:cursor-not-allowed disabled:opacity-50 [&>span]:line-clamp-1 dark:border-slate-800 dark:ring-offset-slate-950 dark:placeholder:text-slate-400 dark:focus:ring-slate-300">
                      <option value="All">Select Cashier</option>
                      {cashiers?.map((c) => (
                        <option
                          key={nanoid()}
                          value={c.id}>
                          {c.firstname} {c.middlename} {c.lastname}
                        </option>
                      ))}
                    </select>
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
              title="Reset Filter"
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
