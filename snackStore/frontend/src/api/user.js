import request from './request'

export const getProfileApi = () => request.get('/user/me')
export const updateProfileApi = (data) => request.put('/user/me', data)
export const updatePasswordApi = (data) => request.put('/user/password', data)
