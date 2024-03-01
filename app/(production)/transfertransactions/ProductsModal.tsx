'use client'
import { TransferedProductTypes } from '@/types'

interface ModalProps {
  hideModal: () => void
  products: TransferedProductTypes[]
}

const ProductsModal = ({ hideModal, products }: ModalProps) => {
  return (
    <>
      <div className="app__modal_wrapper">
        <div className="app__modal_wrapper2_large">
          <div className="app__modal_wrapper3">
            <div className="app__modal_header">
              <h5 className="app__modal_header_text">Transfered Products</h5>
              <button
                onClick={hideModal}
                type="button"
                className="app__modal_header_btn">
                &times;
              </button>
            </div>

            <div className="app__modal_body">
              {products.length > 0 && (
                <table className="app__table">
                  <thead className="app__thead">
                    <tr>
                      <th className="app__th">Product</th>
                      <th className="app__th">Category</th>
                      <th className="app__th">Transfered Quantity</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.map((product, idx) => (
                      <tr
                        key={idx}
                        className="app__tr">
                        <td className="app__td">
                          {product.name} ({product.size})
                        </td>
                        <td className="app__td">{product.category}</td>
                        <td className="app__td">{product.quantity}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default ProductsModal
