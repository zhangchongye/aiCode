import request from './request'

export const getCategoriesApi = () => request.get('/categories')
export const getProductsApi = (params) => request.get('/products', { params })
export const getProductApi = (id) => request.get(`/products/${id}`)
