import Image from 'next/image'

export default function ErrorPage() {
  return (
    <>
      <div className="">
        <div className="app__modal_wrapper">
          <div className="app__modal_wrapper2">
            <div className="app__modal_wrapper3">
              <div className="modal-body relative p-4">
                <div className="grid grid-cols-1 gap-4 mb-4">
                  <div className="w-full flex-col items-center">
                    <div className="flex justify-center">
                      <Image
                        src="/logo.png"
                        width={120}
                        height={120}
                        priority={true}
                        alt="Logo Agriko"
                      />
                    </div>
                    <div className="text-center">
                      <h1 className="text-base font-light">
                        Something went wrong, please reload the page.
                      </h1>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
