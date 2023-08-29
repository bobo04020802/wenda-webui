<template>
  <div :id="uid" :style="myStyle"></div>
</template>
<script setup>
import { onMounted, onBeforeMount, ref, defineProps, onBeforeUnmount, onUnmounted } from 'vue';
import * as echarts from 'echarts';
// 因为是封装的组件，会多次调用，id不能重复，要在初始化之前写，不然会报错dom为定义
let uid = ref('');
onBeforeMount(() => {
  uid.value = `echarts-uid-${parseInt((Math.random() * 1000000).toString())}`;
});

onMounted(() => {
  let myChart = echarts.init(document.getElementById(uid.value));
  console.log('ccccccc===', props.myOption)
  // 在template中可以直接取props中的值，但是在script中不行，因为script是在挂载之前执行的
  myChart.setOption(props.myOption);

  // 监听页面的大小
  window.addEventListener('resize', () => {
    setTimeout(() => {
      myChart?.resize({
        animation: {
          duration: 300,
        },
      });
    }, 300);
  });
});

const props = defineProps({
  myStyle: {
    type: Object,
    default: () => ({
      width: '100vh',
      height: '50vh',
    }),
  },
  myOption: {
    type: Object,
    default: () => ({}),
    required: true,
  },
});
</script>
