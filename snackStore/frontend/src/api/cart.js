import request from './request'

export const getCartApi = () => request.get('/cart')
export const addToCartApi = (data) => request.post('/cart', data)
