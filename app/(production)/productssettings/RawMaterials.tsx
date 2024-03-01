'use client'
import { RawMaterialTypes } from '@/types'

interface ModalProps {
  hideModal: () => void
  rawMaterials: RawMaterialTypes[]
}

const RawMaterials = ({ hideModal, rawMaterials }: ModalProps) => {
  return (
    <>
      <div className="app__modal_wrapper">
        <div className="app__modal_wrapper2_large">
          <div className="app__modal_wrapper3">
            <div className="app__modal_header">
              <h5 className="app__modal_header_text">Raw Materials</h5>
              <button
                onClick={hideModal}
                type="button"
                className="app__modal_header_btn">
                &times;
              </button>
            </div>

            <div className="app__modal_body">
              {rawMaterials.length > 0 && (
                <table className="app__table">
                  <thead className="app__thead">
                    <tr>
                      <th className="app__th">Raw Material</th>
                      <th className="app__th">Unit</th>
                      <th className="app__th">Quantity</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rawMaterials.map((item, idx) => (
                      <tr
                        key={idx}
                        className="app__tr">
                        <td className="app__td">{item.name}</td>
                        <td className="app__td">{item.unit}</td>
                        <td className="app__td">{item.quantity}</td>
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

export default RawMaterials
