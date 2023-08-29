<template>
  <svg id="dynamicIllustration" class="w-full h-full" style="width: 100%;height: 50vh" ref="svgRef" />
<!--  <div>-->
<!--    <el-button-->
<!--        size="small"-->
<!--        type="danger"-->
<!--        plain-->
<!--        @click="downloadSVG(event)"-->
<!--    >下载</el-button-->
<!--    >-->
<!--  </div>-->
</template>

<script>
import { ref, onMounted, onUpdated, watch } from 'vue';
import { Transformer } from 'markmap-lib';
import { Markmap } from 'markmap-view/dist/index.esm';



export default {
  name: "markmapSVG",
  props: {
    value: {
      type: String
    }
  },
  methods: {
    downloadSVG(evt) {
      // const svgContent = document.getElementById("dynamicIllustration").outerHTML,
      //     blob = new Blob([svgContent], {
      //       type: "image/svg+xml"
      //     })
      // let url = window.URL.createObjectURL(blob);
      // let link = evt.target;
      //
      // link.target = "_blank";
      // link.download = "Illustration1.svg";
      // link.href = url;
      // let body = document.querySelector('body')
      // body.appendChild(link)
      // link.click()
      // console.log(link)
      const svg = document.getElementById('dynamicIllustration').innerHTML;
      const blob = new Blob([svg.toString()]);
      const element = document.createElement("a");
      element.download = "w3c.svg";
      element.href = window.URL.createObjectURL(blob);
      element.click();
      element.remove();

    }

  },
  setup(props) {

    const svgRef = ref();
    const { value } = props;
    // let mm;
    const mm = ref()

    const update = async () => {
      const transformer = new Transformer();
      // var matchReg = /(?<=```).*?(?=.```)/igs;
      // var svgvalue = value.match(matchReg)
      // const { root } = transformer.transform(svgvalue[0].replace('shell','').replace('markdown',''));
      console.log(value)
      const { root } = transformer.transform(value.replace('```shell','').replace('```markdown','').replace('```',''));
      console.log('root', root)
      await mm.value.setData(root);
      mm.value.fit();
    };
    watch(value,()=>{
      if(value != ''){
        update();
      }
    })
    onMounted(() => {

      mm.value = Markmap.create(svgRef.value);
      window.addEventListener("resize", update);
      if(value != ''){
        update();
      }
    });
    onUpdated(() => {
      update()
    });
    return {
      svgRef,
      value,
    };
  },
}
</script>

<style scoped>

</style>
