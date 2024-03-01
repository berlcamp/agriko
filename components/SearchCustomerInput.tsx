'use client'

import { XMarkIcon } from '@heroicons/react/20/solid'
import React, { useState } from 'react'

interface OldCustomerValues {
  customer_id: string
  name_address: string
}

interface PropTypes {
  classNames?: string
  customers: OldCustomerValues[] | []
  handleSelectedId: (customer: string) => void
}

export default function SearchCustomerInput({
  classNames,
  customers,
  handleSelectedId,
}: PropTypes) {
  const [searchHead, setSearchHead] = useState('')
  const [searchResults, setSearchResults] = useState<OldCustomerValues[] | []>(
    []
  )
  const [selectedItems, setSelectedItems] = useState<OldCustomerValues[] | []>(
    []
  )

  const handleSearchUser = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const searchTerm = e.target.value

    setSearchHead(searchTerm)

    if (searchTerm.trim().length < 3) {
      setSearchResults([])
      return
    }

    // Search user
    const searchWords = e.target.value.split(' ')
    const results = customers.filter((c) => {
      const fullName = `${c.name_address}`.toLowerCase()
      return searchWords.every((word) => fullName.includes(word.toLowerCase()))
    })

    setSearchResults(results)
  }

  const handleSelected = (item: OldCustomerValues) => {
    setSelectedItems([item])
    handleSelectedId(item.customer_id)

    setSearchResults([])
    setSearchHead('')
  }
  const handleRemoveSelected = () => {
    setSelectedItems([])
    handleSelectedId('')
  }

  return (
    <div className={`app__selected_users_container ${classNames ?? ''}`}>
      {selectedItems.length > 0 &&
        selectedItems.map((item, index) => (
          <span
            key={index}
            className="app__search_customer_input">
            {item.name_address}
            <XMarkIcon
              onClick={handleRemoveSelected}
              className="w-4 h-4 ml-2 cursor-pointer"
            />
          </span>
        ))}
      <div
        className={`${
          selectedItems.length > 0 ? 'hidden' : ''
        } relative inline-flex w-full`}>
        <input
          type="text"
          placeholder="Search Customer.."
          value={searchHead}
          onChange={async (e) => await handleSearchUser(e)}
          className="app__search_customer_input"
        />

        {searchResults.length > 0 && (
          <div className="app__search_user_results_container">
            {searchResults.map((item: OldCustomerValues, index) => (
              <div
                key={index}
                onClick={() => handleSelected(item)}
                className="app__search_user_results">
                {item.name_address}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
