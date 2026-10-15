// 数量步进器:受控组件,点击 ± 触发 change 事件 { value },由父组件更新 value。
Component({
  properties: {
    value: { type: Number, value: 1 },
    min: { type: Number, value: 1 },
    max: { type: Number, value: 99 },
  },
  methods: {
    onMinus() {
      if (this.data.value <= this.data.min) return;
      this.triggerEvent('change', { value: this.data.value - 1 });
    },
    onPlus() {
      if (this.data.value >= this.data.max) return;
      this.triggerEvent('change', { value: this.data.value + 1 });
    },
  },
});
