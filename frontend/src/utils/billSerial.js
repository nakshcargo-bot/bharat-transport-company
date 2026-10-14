import api from '../api'

const SERIAL_STORAGE_KEY = 'btc_last_serial'
const BILL_PREFIX = 'BTC/26-27/'

export async function getNextSerialNumber() {
  let lastSerial

  try {
    const response = await api.get('/api/bills/last-serial')
    lastSerial = Number(response.data?.lastSerial)
    if (!Number.isSafeInteger(lastSerial) || lastSerial < 0) {
      throw new Error('The bill serial endpoint returned an invalid serial number.')
    }
  } catch (error) {
    const storedSerial = Number.parseInt(localStorage.getItem(SERIAL_STORAGE_KEY) || '0', 10)
    lastSerial = Number.isSafeInteger(storedSerial) && storedSerial > 0 ? storedSerial : 0
  }

  return `${BILL_PREFIX}${String(lastSerial + 1).padStart(3, '0')}`
}
