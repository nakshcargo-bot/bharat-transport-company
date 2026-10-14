import api from '../api'

const INV_PREFIX = 'BTC/26-27/'

export const getNextSerialNumber = async () => {
  try {
    const response = await api.get('/api/bills/last-serial')
    const lastNum = Number(response.data?.lastSerial) || 0
    return INV_PREFIX + (lastNum + 1).toString().padStart(3, '0')
  } catch (err) {
    const lastSaved = parseInt(localStorage.getItem('btc_last_serial') || '0', 10) || 0
    return INV_PREFIX + (lastSaved + 1).toString().padStart(3, '0')
  }
}

export const updateLastSerial = (serial) => {
  const num = parseInt(serial.split('/').pop(), 10) || 0
  localStorage.setItem('btc_last_serial', String(num))
}
