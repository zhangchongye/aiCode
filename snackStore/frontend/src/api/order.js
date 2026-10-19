import request from './request'

export const createOrderApi = (data) => request.post('/orders', data)
export const getOrdersApi = (params) => request.get('/orders', { params })
export const getOrderApi = (id) => request.get(`/orders/${id}`)
export const payOrderApi = (id) => request.post(`/orders/${id}/pay`)
export const cancelOrderApi = (id) => request.post(`/orders/${id}/cancel`)
