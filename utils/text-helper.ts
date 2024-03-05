import { logChanges, logError } from "./fetchApi"

export function fullTextQuery (string: string): string {
  // const isStringAllNumbers = (str: string) => {
  //   return /^\d+$/.test(str)
  // }

  // if (isStringAllNumbers(string)) {
  //   return parseInt(string, 10)
  // }

  const searchSplit = string.split(' ')

  const keywordArray: any[] = []
  searchSplit.forEach(item => {
    if (item !== '') keywordArray.push(`'${item}'`)
  })
  const searchQuery = keywordArray.join(' & ')

  return searchQuery
}

export function generateReferenceCode () {
  let result = ''
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
  const charactersLength = characters.length
  let counter = 0
  while (counter < 8) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength))
    counter += 1
  }
  return result
}
export function generateRandomNumber () {
  let result = ''
  const characters = '0123456789'
  const charactersLength = characters.length
  let counter = 0
  while (counter < 5) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength))
    counter += 1
  }
  return result
}

export async function handleLogChanges (newData: any, originalData: any, referenceColumn: string, referenceValue: any, userId: string, customMessage: string) {
  const changesData = []

  for (const key in newData) {
    if (newData.hasOwnProperty(key)) {
      const newValue = newData[key];
      const oldValue = originalData[key];
      if (newValue !== oldValue) {
        changesData.push({ field: key, new_value: newValue, old_value: oldValue })
      }
    }
  }

  const { error } = await logChanges(changesData, referenceColumn, referenceValue, userId, customMessage)
  if (error) {
    void logError(
      "Log Changes",
      "agriko_change_logs",
      JSON.stringify(changesData),
      JSON.stringify(error)
    );
  }
}
