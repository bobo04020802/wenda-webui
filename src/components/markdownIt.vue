<template>
  <markdown-it-vue
      :markitid="markdid_"
      :content="value"
  />
</template>

<script>
import { ref, onMounted, onUpdated, watch, defineComponent } from 'vue';
import MarkdownItVue from 'markdown-it-vue'

export default {
  name: "MarkdownIt",
  components: {
    MarkdownItVue
  },
  props: {
    value: {
      type: String
    },
    markdid_: {
      type: String
    }
  },
  methods: {

  },
  setup(props) {
    const { value, markdid_ } = props;
console.log(8888,{ value, markdid_ })
    const markRef = ref();
    const options = ref(
        {
          markdownIt:
              {
                linkify: true
              },
          linkAttributes: {
            attrs: {
              target: '_blank',
              rel: 'noopener'
            }
          }
        }
    );
    // watch(value,()=>{
    //   if(value != ''){
    //     markRef.value = value
    //   }
    // });
    // watch(markdid_,()=>{
    //   if(markdid_ != ''){
    //     markRef.value = markdid_
    //   }
    // });
    // onMounted(() => {
    //   console.log(content,markdid)
    // });
    return {
      markRef,
      value,
      options,
      markdid_
    };
  },
}
</script>

<style scoped>

</style>
