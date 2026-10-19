import request from './request'

export const adminGetProductsApi = (params) => request.get('/admin/products', { params })
export const adminCreateProductApi = (data) => request.post('/admin/products', data)
export const adminUpdateProductApi = (id, data) => request.put(`/admin/products/${id}`, data)
export const adminUpdateProductStatusApi = (id, data) => request.put(`/admin/products/${id}/status`, data)
export const adminDeleteProductApi = (id) => request.delete(`/admin/products/${id}`)
export const uploadImageApi = (file) => {
  const formData = new FormData()
  formData.append('file', file)
  return request.post('/admin/upload', formData, { headers: { 'Content-Type': 'multipart/form-data' } })
}
export const adminGetCategoriesApi = () => request.get('/admin/categories')
export const adminCreateCategoryApi = (data) => request.post('/admin/categories', data)
export const adminUpdateCategoryApi = (id, data) => request.put(`/admin/categories/${id}`, data)
export const adminDeleteCategoryApi = (id) => request.delete(`/admin/categories/${id}`)
export const adminGetOrdersApi = (params) => request.get('/admin/orders', { params })
export const shipOrderApi = (id) => request.post(`/admin/orders/${id}/ship`)
export const adminGetUsersApi = (params) => request.get('/admin/users', { params })
export const adminUpdateUserStatusApi = (id, data) => request.put(`/admin/users/${id}/status`, data)
export const getStatsApi = () => request.get('/admin/stats')
