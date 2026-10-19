import { defineStore } from 'pinia'
import { getCartApi } from '@/api/cart'

export const useCartStore = defineStore('cart', {
  state: () => ({ count: 0, items: [] }),
  actions: {
    async refresh() {
      const items = await getCartApi()
      this.items = items
      this.count = items.reduce((sum, i) => sum + i.quantity, 0)
    },
    reset() {
      this.count = 0
      this.items = []
    },
  },
})
