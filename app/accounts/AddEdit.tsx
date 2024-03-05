'use client'

import { CustomButton } from '@/components/index'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Form,
  FormControl,
  FormDescription,
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
  offices: z.array(z.string()).refine((value) => value.some((item) => item), {
    message: 'You have to select at least one office.',
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
  const { supabase, systemOffices, session } = useSupabase()
  const { setToast } = useFilter()

  const offices: { id: string; label: string }[] = []
  systemOffices.forEach((office: OfficeTypes) => {
    if (office.type === 'Office')
      offices.push({ id: office.name, label: office.name })
  })

  // Redux staff
  const globallist = useSelector((state: any) => state.list.value)
  const resultsCounter = useSelector((state: any) => state.results.value)
  const dispatch = useDispatch()

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      firstname: '',
      middlename: '',
      lastname: '',
      email: '',
      offices: [],
    },
  })

  const onSubmit = async (data: z.infer<typeof FormSchema>) => {
    const officeIds: string[] = []
    data.offices.forEach((office: string) => {
      const ofc: OfficeTypes = systemOffices.find(
        (so: OfficeTypes) => office === so.name
      )
      officeIds.push(ofc.id)
    })

    try {
      const newData = {
        firstname: data.firstname,
        middlename: data.middlename,
        lastname: data.lastname,
        status: 'Active',
        email: data.email,
        temp_password: tempPassword.toString(),
        offices: officeIds,
        active_office_id: Number(officeIds[0]),
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
                    name="offices"
                    render={() => (
                      <FormItem>
                        <div className="mb-4">
                          <FormLabel className="app__form_label">
                            Office
                          </FormLabel>
                          <FormDescription>
                            This user can access the following Office
                          </FormDescription>
                        </div>
                        {offices.map((item) => (
                          <FormField
                            key={item.id}
                            control={form.control}
                            name="offices"
                            render={({ field }) => {
                              return (
                                <FormItem
                                  key={item.id}
                                  className="flex flex-row items-start space-x-3 space-y-0">
                                  <FormControl>
                                    <Checkbox
                                      checked={field.value?.includes(item.id)}
                                      onCheckedChange={(checked) => {
                                        return checked
                                          ? field.onChange([
                                              ...field.value,
                                              item.id,
                                            ])
                                          : field.onChange(
                                              field.value?.filter(
                                                (value) => value !== item.id
                                              )
                                            )
                                      }}
                                    />
                                  </FormControl>
                                  <FormLabel className="text-sm font-normal">
                                    {item.label}
                                  </FormLabel>
                                </FormItem>
                              )
                            }}
                          />
                        ))}
                        <FormMessage />
                      </FormItem>
                    )}
                  />
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
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="app__form_label">Email</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Email"
                            className="w-full"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          Email is use to Login the account
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
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
