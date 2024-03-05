'use client'

import { CustomButton } from '@/components/index'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { useSupabase } from '@/context/SupabaseProvider'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
// Redux imports
import { useFilter } from '@/context/FilterContext'
import { AccountTypes, OfficeTypes } from '@/types'
import axios from 'axios'

// Redux imports
import { updateList } from '@/GlobalRedux/Features/listSlice'
import { updateResultCounter } from '@/GlobalRedux/Features/resultsCounterSlice'
import { nanoid } from 'nanoid'
import { useDispatch, useSelector } from 'react-redux'

const FormSchema = z.object({
  firstname: z.string().min(1, {
    message: 'Firstname is required.',
  }),
  middlename: z.string().optional(),
  lastname: z.string().min(1, {
    message: 'Lastname is required.',
  }),
  email: z.string().email().min(1, {
    message: 'Email is required.',
  }),
  office: z.string().min(1, {
    message: 'Office is required.',
  }),
  confirmed: z.literal(true, {
    errorMap: () => ({ message: 'Confirmation is required' }),
  }),
})

interface ModalProps {
  hideModal: () => void
  editData: AccountTypes | null
}

const AddEdit = ({ editData, hideModal }: ModalProps) => {
  const { supabase, systemOffices } = useSupabase()
  const { setToast } = useFilter()

  const offices: OfficeTypes[] = systemOffices

  // Redux staff
  const globallist = useSelector((state: any) => state.list.value)
  const resultsCounter = useSelector((state: any) => state.results.value)
  const dispatch = useDispatch()

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      firstname: editData ? editData.firstname : '',
      middlename: editData ? editData.middlename : '',
      lastname: editData ? editData.lastname : '',
      email: editData ? editData.email : '',
      office: editData ? editData.active_office_id : '',
    },
  })

  const onSubmit = async (data: z.infer<typeof FormSchema>) => {
    if (!editData) {
      await handleCreate(data)
    } else {
      await handleUpdate(data)
    }
  }

  const handleCreate = async (data: z.infer<typeof FormSchema>) => {
    try {
      const newData = {
        firstname: data.firstname,
        middlename: data.middlename,
        lastname: data.lastname,
        status: 'Active',
        email: data.email,
        temp_password: tempPassword.toString(),
        active_office_id: data.office,
      }

      // Sign up the user on the server side to fix pkce issue https://github.com/supabase/auth-helpers/issues/569
      axios
        .post('/api/signup', {
          item: newData,
        })
        .then(async function (response) {
          const { error: error2 } = await supabase
            .from('agriko_users')
            .insert({ ...newData, id: response.data.insert_id })

          if (error2) throw new Error(error2.message)

          // Append new data in redux
          const updatedData = {
            ...newData,
            id: response.data.insert_id,
          }
          dispatch(updateList([updatedData, ...globallist]))

          // pop up the success message
          setToast('success', 'Successfully saved.')

          // Updating showing text in redux
          dispatch(
            updateResultCounter({
              showing: Number(resultsCounter.showing) + 1,
              results: Number(resultsCounter.results) + 1,
            })
          )

          // hide the modal
          hideModal()
        })
    } catch (e) {
      console.error(e)
    }
  }

  const handleUpdate = async (formdata: z.infer<typeof FormSchema>) => {
    if (!editData) return

    const newData = {
      firstname: formdata.firstname,
      middlename: formdata.middlename,
      lastname: formdata.lastname,
      active_office_id: formdata.office,
    }

    try {
      const { error } = await supabase
        .from('agriko_users')
        .update(newData)
        .eq('id', editData.id)

      if (error) throw new Error(error.message)

      // Update data in redux
      const items = [...globallist]
      const updatedData = {
        ...newData,
        id: editData.id,
      }
      const foundIndex = items.findIndex((x) => x.id === updatedData.id)
      items[foundIndex] = { ...items[foundIndex], ...updatedData }
      dispatch(updateList(items))

      // pop up the success message
      setToast('success', 'Successfully saved.')

      // hide the modal
      hideModal()
    } catch (e) {
      console.error(e)
    }
  }

  const tempPassword = Math.floor(Math.random() * 999999) + 1000

  return (
    <>
      <div className="app__modal_wrapper">
        <div className="app__modal_wrapper2">
          <div className="app__modal_wrapper3">
            <div className="app__modal_header">
              <h5 className="app__modal_header_text">Account Details</h5>
              <button
                onClick={hideModal}
                disabled={form.formState.isSubmitting}
                type="button"
                className="app__modal_header_btn">
                &times;
              </button>
            </div>

            <div className="app__modal_body">
              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(onSubmit)}
                  className="space-y-6">
                  <FormField
                    control={form.control}
                    name="office"
                    render={({ field }) => (
                      <FormItem className="w-[240px] flex flex-col items-start justify-start">
                        <FormLabel className="app__form_label">
                          Office
                        </FormLabel>
                        <select
                          onChange={(e) => {
                            form.setValue('office', e.target.value)
                          }}
                          value={field.value}
                          className="flex h-9 w-full items-center justify-between whitespace-nowrap rounded-md border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm ring-offset-white placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-950 disabled:cursor-not-allowed disabled:opacity-50 [&>span]:line-clamp-1 dark:border-slate-800 dark:ring-offset-slate-950 dark:placeholder:text-slate-400 dark:focus:ring-slate-300">
                          <option value="">Select Office</option>
                          {offices?.map((o) => (
                            <option
                              key={nanoid()}
                              value={o.id}>
                              {o.name}
                            </option>
                          ))}
                        </select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="flex items-start justify-between space-x-2">
                    <div className="w-1/2 space-y-6">
                      <FormField
                        control={form.control}
                        name="firstname"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="app__form_label">
                              First Name
                            </FormLabel>
                            <FormControl>
                              <Input
                                placeholder="First Name"
                                className="w-full"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <div className="w-1/2 space-y-6">
                      <FormField
                        control={form.control}
                        name="middlename"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="app__form_label">
                              Middle Name
                            </FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Middle Name"
                                className="w-full"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  <div className="flex items-start justify-between space-x-2">
                    <div className="w-1/2 space-y-6">
                      <FormField
                        control={form.control}
                        name="lastname"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="app__form_label">
                              Last Name
                            </FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Last Name"
                                className="w-full"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <div className="w-1/2 space-y-6">
                      <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="app__form_label">
                              Email
                            </FormLabel>
                            <FormControl>
                              {editData ? (
                                <div className="app__label_value">
                                  {field.value}
                                </div>
                              ) : (
                                <Input
                                  placeholder="Email"
                                  className="w-full"
                                  {...field}
                                />
                              )}
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  <hr />
                  <FormField
                    control={form.control}
                    name="confirmed"
                    render={({ field }) => (
                      <FormItem>
                        <div className="flex items-center space-x-2">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <FormLabel className="font-normal text-gray-600 text-xs">
                            By checking this, you acknowledge that the provided
                            details are accurate.
                          </FormLabel>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="app__modal_footer">
                    <CustomButton
                      btnType="submit"
                      isDisabled={form.formState.isSubmitting}
                      title={
                        form.formState.isSubmitting ? 'Saving...' : 'Submit'
                      }
                      containerStyles="app__btn_green"
                    />
                    <CustomButton
                      btnType="button"
                      isDisabled={form.formState.isSubmitting}
                      title="Cancel"
                      handleClick={hideModal}
                      containerStyles="app__btn_gray"
                    />
                  </div>
                </form>
              </Form>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default AddEdit
