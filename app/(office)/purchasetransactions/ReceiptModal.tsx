/* eslint-disable react/display-name */
'use client'

import { CustomButton } from '@/components/index'
import { OrderedProductTypes } from '@/types'
import { format } from 'date-fns'
import Image from 'next/image'
import React, { forwardRef, useRef } from 'react'
import { useReactToPrint } from 'react-to-print'

interface ModalProps {
  hideModal: () => void
  orderedProducts: OrderedProductTypes[]
}

interface ChildProps {
  forwardedRef: React.ForwardedRef<HTMLDivElement>
  orderedProducts: OrderedProductTypes[]
}

const ComponentToPrint: React.FC<ChildProps> = ({
  forwardedRef,
  orderedProducts,
}) => {
  return (
    <div
      ref={forwardedRef}
      className="w-[185px]">
      <div className="">
        <div className="text-base text-center font-bold">Agriko</div>
        <div className="text-[10px] text-center">
          AGRICULTURE KEEPS ORGANIC{' '}
        </div>
        <div className="text-[9px] text-center">
          <div>
            Paglinawan Organic Eco Farm, Purok 6, Libertad, Dumingag, Zamboanga
            del Sur
          </div>
          <div>+6399669968578</div>
        </div>
        <div className="text-[10px] font-light mt-2">
          <table className="w-full">
            <thead>
              <tr className="border-t border-b border-gray-700">
                <td>Qty</td>
                <td>Description</td>
                <td>Amount</td>
              </tr>
            </thead>
            <tbody>
              {orderedProducts.map((p, idx) => (
                <tr
                  key={idx}
                  className="align-top">
                  <td>{p.quantity}</td>
                  <td>
                    <div>{p.product_name}</div>
                    <div>{p.product_size}</div>
                  </td>
                  <td>{p.total_amount}</td>
                </tr>
              ))}
              <tr className="align-top border-t border-b border-gray-700">
                <td></td>
                <td>TOTAL:</td>
                <td>
                  {orderedProducts.reduce(
                    (total, current) =>
                      total + current.product_price * current.quantity,
                    0
                  )}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between text-[8px] mt-1 px-4">
          <span>{format(new Date(), 'MM/dd/yyyy')}</span>
          <span>{format(new Date(), 'p')}</span>
        </div>
        <div className="flex items-center justify-center relative mt-2">
          <Image
            src="/qr.png"
            width={80}
            height={80}
            priority={true}
            alt="Logo QR"
          />
        </div>
      </div>
    </div>
  )
}

const ReceiptModal: React.FC<ModalProps> = ({ hideModal, orderedProducts }) => {
  const componentRef = useRef<HTMLDivElement>(null)

  // Using forwardRef to pass the ref down to the ChildComponent
  const ChildWithRef = forwardRef<HTMLDivElement, ChildProps>((props, ref) => {
    return (
      <ComponentToPrint
        {...props}
        forwardedRef={ref}
        orderedProducts={orderedProducts}
      />
    )
  })

  const handlePrint = useReactToPrint({
    content: () => componentRef.current,
    documentTitle: 'Print Example',
  })

  return (
    <>
      <div className="app__modal_wrapper">
        <div className="app__modal_wrapper2">
          <div className="app__modal_wrapper3">
            <div className="app__modal_header">
              <h5 className="app__modal_header_text">Print Receipt</h5>
              <CustomButton
                btnType="button"
                title="Close"
                handleClick={hideModal}
                containerStyles="app__btn_gray"
              />
            </div>

            <div className="app__modal_body">
              <div className="mt-4 mb-8 text-center text-xl">
                <CustomButton
                  btnType="button"
                  title="Print Receipt"
                  handleClick={handlePrint}
                  containerStyles="app__btn_green"
                />
              </div>
              <div className="flex items-center justify-center mx-auto relative border border-gray-700 w-[200px]">
                <ChildWithRef
                  orderedProducts={orderedProducts}
                  ref={componentRef}
                  forwardedRef={null}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default ReceiptModal
