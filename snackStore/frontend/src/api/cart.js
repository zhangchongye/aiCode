import request from './request'

export const getCartApi = () => request.get('/cart')
export const addToCartApi = (data) => request.post('/cart', data)
export const updateCartApi = (id, data) => request.put(`/cart/${id}`, data)
export const deleteCartApi = (id) => request.delete(`/cart/${id}`)
