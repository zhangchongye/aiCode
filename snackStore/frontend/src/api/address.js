import request from './request'

export const getAddressesApi = () => request.get('/addresses')
export const createAddressApi = (data) => request.post('/addresses', data)
export const updateAddressApi = (id, data) => request.put(`/addresses/${id}`, data)
export const deleteAddressApi = (id) => request.delete(`/addresses/${id}`)
export const setDefaultAddressApi = (id) => request.put(`/addresses/${id}/default`)
